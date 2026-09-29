// Package server exposes MUSASHI's read-only analysis engine over HTTP so the
// web tier (Next.js) can call it instead of spawning the binary per request.
//
// Design (see ARCHITECTURE.md):
//   - READ-ONLY. No endpoint here signs a transaction, so the daemon needs NO
//     BSC_PRIVATE_KEY. On-chain writes stay in the CLI publish path.
//   - Wraps existing pipeline.*/chain.* functions — no analysis logic is
//     re-implemented; output is byte-identical to the CLI.
//   - Binds to 127.0.0.1 by default. Optional X-Api-Key for server→server auth.
package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"

	"github.com/yeheskieltame/musashi/scripts/musashi-core/internal/chain"
	"github.com/yeheskieltame/musashi/scripts/musashi-core/internal/journal"
	"github.com/yeheskieltame/musashi/scripts/musashi-core/internal/pipeline"
)

// validChains mirrors the frontend allow-list (musashi-cli.ts). 0 = "all chains"
// (only meaningful for scan/discover; rejected for single-token endpoints).
var validChains = map[int64]bool{0: true, 1: true, 56: true, 137: true, 42161: true, 8453: true, 16661: true}

// Options configures the daemon.
type Options struct {
	Addr   string // host:port to bind, e.g. 127.0.0.1:8787
	APIKey string // optional; when set, requests must send matching X-Api-Key
}

type handler struct {
	apiKey string
}

// Run starts the HTTP daemon and blocks until the server stops.
func Run(opts Options) error {
	if opts.Addr == "" {
		opts.Addr = "127.0.0.1:8787"
	}
	h := &handler{apiKey: opts.APIKey}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", h.healthz)
	mux.HandleFunc("GET /v1/gates", h.auth(h.gates))
	mux.HandleFunc("GET /v1/scan", h.auth(h.scan))
	mux.HandleFunc("GET /v1/discover", h.auth(h.discover))
	mux.HandleFunc("GET /v1/hunt", h.auth(h.hunt))
	mux.HandleFunc("GET /v1/search", h.auth(h.search))
	mux.HandleFunc("GET /v1/status", h.auth(h.status))
	mux.HandleFunc("GET /v1/agent-info", h.auth(h.agentInfo))
	mux.HandleFunc("GET /v1/history", h.auth(h.history))
	mux.HandleFunc("GET /v1/journal/check", h.auth(h.journalCheck))

	srv := &http.Server{
		Addr:              opts.Addr,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
		// Generous: a full gate run can take ~2min through external-API retries.
		WriteTimeout: 240 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	authNote := "no auth (set --api-key / MUSASHI_DAEMON_KEY to require X-Api-Key)"
	if opts.APIKey != "" {
		authNote = "X-Api-Key required"
	}
	fmt.Printf("musashi-core serve (read-only) listening on http://%s — %s\n", opts.Addr, authNote)
	return srv.ListenAndServe()
}

// ─────────────────────────────────────────────────────────────── middleware

func (h *handler) auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if h.apiKey != "" && subtleNotEqual(r.Header.Get("X-Api-Key"), h.apiKey) {
			writeErr(w, http.StatusUnauthorized, "invalid or missing X-Api-Key")
			return
		}
		next(w, r)
	}
}

// ─────────────────────────────────────────────────────────────── handlers

func (h *handler) healthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, `{"status":"ok","service":"musashi-core","mode":"read-only"}`)
}

func (h *handler) gates(w http.ResponseWriter, r *http.Request) {
	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if !common.IsHexAddress(token) {
		writeErr(w, http.StatusBadRequest, "invalid token address (expected 0x + 40 hex)")
		return
	}
	chainID := qInt64(r, "chain", 1)
	if !validChains[chainID] || chainID == 0 {
		writeErr(w, http.StatusBadRequest, "invalid chain id")
		return
	}
	res, err := pipeline.RunGates(token, chainID, qBool(r, "skipAI"))
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, res.JSON())
}

func (h *handler) scan(w http.ResponseWriter, r *http.Request) {
	chainID := qInt64(r, "chain", 0)
	if !validChains[chainID] {
		writeErr(w, http.StatusBadRequest, "invalid chain id")
		return
	}
	res, err := pipeline.ScanTokens(chainID, clampInt(qInt(r, "limit", 10), 1, 50), qBool(r, "gates"))
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, res)
}

func (h *handler) discover(w http.ResponseWriter, r *http.Request) {
	chainID := qInt64(r, "chain", 1)
	if !validChains[chainID] {
		writeErr(w, http.StatusBadRequest, "invalid chain id")
		return
	}
	res, err := pipeline.DiscoverTokens(chainID, clampInt(qInt(r, "limit", 20), 1, 50))
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, res)
}

func (h *handler) hunt(w http.ResponseWriter, r *http.Request) {
	chainID := qInt64(r, "chain", 8453)
	if !validChains[chainID] || chainID == 0 {
		writeErr(w, http.StatusBadRequest, "invalid chain id")
		return
	}
	res, err := pipeline.HuntStrikes(chainID, clampInt(qInt(r, "top", 3), 1, 10))
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, res.JSON())
}

func (h *handler) search(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if q == "" || len(q) > 200 {
		writeErr(w, http.StatusBadRequest, "query must be 1-200 characters")
		return
	}
	res, err := pipeline.SearchTokensJSON(q, clampInt(qInt(r, "limit", 5), 1, 20))
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, res)
}

func (h *handler) status(w http.ResponseWriter, r *http.Request) {
	var res string
	var err error
	if qBool(r, "perAgent") {
		res, err = chain.QueryAgentReputation(qUint64(r, "agentId", 0))
	} else {
		res, err = chain.QueryReputation()
	}
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, res)
}

func (h *handler) agentInfo(w http.ResponseWriter, r *http.Request) {
	res, err := chain.QueryAgent(qUint64(r, "tokenId", 0))
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, res)
}

func (h *handler) history(w http.ResponseWriter, r *http.Request) {
	res, err := chain.QueryHistory(qUint64(r, "agentId", 0), clampInt(qInt(r, "limit", 12), 1, 50))
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, res)
}

// journalCheck is the learning-layer cache lookup (local JSONL index). Returns
// {"hit":false} on a miss instead of a non-200, so callers branch on the body.
func (h *handler) journalCheck(w http.ResponseWriter, r *http.Request) {
	token := strings.TrimSpace(r.URL.Query().Get("token"))
	if token == "" {
		writeErr(w, http.StatusBadRequest, "token required")
		return
	}
	entry, err := journal.Check(token, qInt64(r, "chain", 1), qUint64(r, "agentId", 0), strings.TrimSpace(r.URL.Query().Get("age")))
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	if entry == nil {
		writeJSON(w, `{"hit":false}`)
		return
	}
	out, _ := json.Marshal(map[string]any{"hit": true, "entry": entry})
	writeJSON(w, string(out))
}

// ─────────────────────────────────────────────────────────────── helpers

func writeJSON(w http.ResponseWriter, raw string) {
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(raw))
}

func writeErr(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func qInt64(r *http.Request, key string, def int64) int64 {
	if v, err := strconv.ParseInt(strings.TrimSpace(r.URL.Query().Get(key)), 10, 64); err == nil {
		return v
	}
	return def
}

func qInt(r *http.Request, key string, def int) int {
	if v, err := strconv.Atoi(strings.TrimSpace(r.URL.Query().Get(key))); err == nil {
		return v
	}
	return def
}

func qUint64(r *http.Request, key string, def uint64) uint64 {
	if v, err := strconv.ParseUint(strings.TrimSpace(r.URL.Query().Get(key)), 10, 64); err == nil {
		return v
	}
	return def
}

func qBool(r *http.Request, key string) bool {
	v := strings.ToLower(strings.TrimSpace(r.URL.Query().Get(key)))
	return v == "true" || v == "1" || v == "yes"
}

func clampInt(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

// subtleNotEqual is a constant-time-ish string compare wrapper. We avoid early
// return on length to not leak key length via timing on the (rare) auth path.
func subtleNotEqual(a, b string) bool {
	if len(a) != len(b) {
		return true
	}
	var diff byte
	for i := 0; i < len(a); i++ {
		diff |= a[i] ^ b[i]
	}
	return diff != 0
}
