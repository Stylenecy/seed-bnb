# MUSASHI 武蔵 — Audit Menyeluruh & Rencana Rombak Total

> Audit teknik mendalam: arsitektur sistem, desain codebase, keamanan, kualitas kode (line-by-line), performa, dan kesiapan production.
> Tanggal: 2026-05-29 · Scope: Go core (`scripts/musashi-core`), Smart Contracts (`contracts`), Frontend Next.js (`frontend`), CI/DevOps.
> Total ±16.9k LOC (Go ±8.6k, TS/TSX ±8.3k) + Solidity.

---

## 0. Ringkasan Eksekutif

MUSASHI adalah project dengan **konsep kuat dan eksekusi yang tidak merata**. Bagian on-chain (Solidity) dan ide pipeline gate sudah matang; tetapi **lapisan integrasi web↔CLI, keamanan, CI, dan konsistensi engineering belum layak production**.

**Verdict kesiapan production: BELUM (perlu rombak pada lapisan integrasi + keamanan).**
Sebagai submission hackathon: **kuat**. Sebagai produk yang ditlayani publik di `musashi-agent.xyz`: **berisiko tinggi**.

### Temuan paling kritis (harus diberesi sebelum apa pun)

| # | Severity | Temuan singkat |
|---|----------|----------------|
| S1 | 🔴 CRITICAL | `/api/chat` men-spawn `claude` dengan tool **Bash** + **private key di env** → RCE & pencurian private key wallet via prompt injection |
| A1 | 🔴 CRITICAL (arsitektur) | Web tier memanggil binary Go lewat `child_process`; binary tidak ada di Vercel → **seluruh fitur analisa mati di deployment "live"** |
| B1 | 🟠 HIGH | CI **rusak total**: Go 1.22 vs `go.mod` 1.26.1, dan `npm ci` padahal project pakai pnpm |
| C1 | 🟠 HIGH | `MusashiINFT.transfer()` **tidak** menghapus usage-auth padahal komentarnya bilang iya → pelanggaran model keamanan ERC-7857 |
| S2 | 🟠 HIGH | Private key dikirim sebagai argumen CLI (`--key`) → bocor di `ps`/`/proc` |

### Scorecard per-dimensi

| Dimensi | Nilai | Catatan |
|---|---|---|
| Desain sistem (konsep) | A− | Pipeline gate→specialist→debate→judge→on-chain orisinal & koheren |
| Arsitektur codebase (implementasi) | C | Coupling web↔CLI rapuh; tidak serverless-ready; duplikasi besar |
| Keamanan | D | RCE chat, key di env/`ps`, tanpa auth, rate-limit ilusi |
| Smart contracts | B+ | Rapi, test bagus, tapi ada bug auth-clear + klaim sentralisasi |
| Kualitas kode Go | C+ | inft.go bagus; conviction.go duplikatif & manual ABI tanpa test |
| Kualitas frontend | C | Semua `"use client"`, N+1 RPC, state manual, tanpa cache |
| Performa | C | Spawn proses per-request, N+1 koneksi RPC, pipeline serial |
| Testing | C− | Contracts oke; Go & frontend nyaris kosong di area berisiko |
| CI/DevOps | D | Workflow tidak jalan; contracts tidak di-CI sama sekali |
| Dokumentasi vs realita | C | README meng-overclaim fitur yang mati di host |

**Legend severity:** 🔴 Critical (eksploitasi/kerugian langsung) · 🟠 High (harus sebelum production) · 🟡 Medium (utang teknis serius) · ⚪ Low/Info (polish).

---

## 1. Temuan Keamanan (Security)

### 🔴 S1 — Chat endpoint = RCE + eksfiltrasi private key (tanpa autentikasi)
**Bukti:** `frontend/src/app/api/chat/route.ts:206-221` men-spawn:
```
claude -p --allowedTools Bash,Read,Glob,Grep,WebSearch,WebFetch,Skill --append-system-prompt <persona>
  cwd: PROJECT_ROOT, env: childEnv
```
`childEnv` = `{ ...process.env, ...parentEnv }` (`frontend/src/lib/env.ts:42-44`) — memuat `OG_CHAIN_PRIVATE_KEY` yang dibaca dari `../.env`.

**Dampak:** Siapa pun yang bisa POST ke `/api/chat` (rate limit 10/menit/IP, IP bisa dipalsukan via `x-forwarded-for`) mengirim prompt yang menyuruh agent Bash menjalankan `cat ../.env` / `env` / perintah arbitrer → **pencurian private key deployer (= owner kontrak + oracle) dan eksekusi kode arbitrer di host**. Satu-satunya penghalang adalah instruksi **level prompt** ("Never leak secrets", `musashi-system-prompt.ts:89`) yang bisa di-bypass dengan prompt injection — itu **bukan** kontrol keamanan.
Reachability: aktif saat dijalankan lokal (`pnpm dev`, alur yang justru direkomendasikan README untuk "full Claude Code experience"). Di Vercel di-block oleh `IS_HOSTED_PREVIEW`, tapi desainnya tetap cacat.

**Fix:**
1. Jangan pernah memberi agent chat akses `Bash` yang terhubung ke endpoint HTTP tak terautentikasi.
2. Hapus secret dari env subprocess (lihat S2-fix); private key tidak boleh ada di environment proses web sama sekali.
3. Standarkan **semua** runtime chat ke registry tool tertutup (pola `gemini-adapter.ts` yang sudah benar) — bukan Bash mentah.
4. Jika Claude Code tetap dipakai, jalankan sebagai worker terpisah dengan allowlist tool minimal, tanpa private key, dan di sandbox.

### 🟠 S2 — Secret diwariskan ke semua subprocess (least-privilege dilanggar)
**Bukti:** `childEnv` dipakai di `musashi-cli.ts:12`, `gemini-adapter.ts:69`, `debate/route.ts:84,104,231`. Hampir semua command (gates/scan/discover/status/history) hanya butuh `OG_CHAIN_RPC` + alamat kontrak; hanya command publish yang butuh private key.
**Fix:** Buat `childEnv` minimal (whitelist var non-sensitif). Jalankan command publish lewat jalur terpisah yang sangat dibatasi. Idealnya web tier **tidak memegang** private key sama sekali (lihat §6 arsitektur target).

### 🟠 S3 — Private key bocor lewat argumen proses (`ps`)
**Bukti:** `scripts/musashi-core/internal/storage/og_storage.go:82-87`:
```go
runCLI("upload", "--url", c.rpcURL, "--key", c.privateKey, ...)
```
`--key <PRIVATE_KEY>` muncul di command line → terlihat oleh user lokal mana pun via `ps aux`/`/proc/<pid>/cmdline`. (Makefile sendiri memperingatkan ini untuk jalur deploy.)
**Fix:** Lewatkan key via env var ke `0g-storage-client`, atau via stdin/keystore file (mode 0600), bukan argumen.

### 🟠 S4 — Tidak ada autentikasi/otorisasi di seluruh `/api/*`
**Bukti:** semua route publik. `chat` & `debate` memicu agent LLM berbayar (uang nyata); `scan/gates/discover` men-spawn proses + menabrak API upstream yang rate-limited.
**Dampak:** abuse biaya (Gemini/Claude), upstream IP kena ban, DoS via resource exhaustion (1 proses/req).
**Fix:** API key/session untuk endpoint mahal; rate limit tersentral (lihat S6); pertimbangkan auth wallet-based untuk aksi tulis.

### 🟡 S5 — Gemini API key di query string URL
**Bukti:** `gemini-adapter.ts:319` `…:generateContent?key=${apiKey}`. URL gampang ter-log (proxy, error trace, akses log).
**Fix:** kirim via header `x-goog-api-key`.

### 🟡 S6 — Rate limit in-memory & per-instance (ilusi di serverless)
**Bukti:** `chat/route.ts:26`, `debate/route.ts:17` pakai `Map` proses. Reset tiap cold start, tidak dibagi antar-instance, dan IP dari `x-forwarded-for` (`chat/route.ts:63`) bisa dipalsukan.
**Fix:** rate limit tersentral (Upstash/Redis/Vercel KV) + key yang tak mudah dipalsu.

### 🟡 S7 — Header keamanan kurang
**Bukti:** `next.config.ts` punya X-Frame-Options/nosniff tapi **tanpa Content-Security-Policy**; `X-XSS-Protection` sudah deprecated (sebaiknya `0` atau dihapus).
**Fix:** tambah CSP ketat; hapus X-XSS-Protection.

### 🟡 S8 — Reputasi bergantung penuh pada owner (klaim "no trust-me-bro" lemah)
**Bukti:** `ConvictionLog.recordOutcome` (`ConvictionLog.sol:122`) `onlyOwner`. Owner bisa mencatat outcome apa pun → win-rate/return bisa "dipoles".
**Fix:** dokumentasikan ini sebagai trust assumption secara eksplisit, atau gerakkan ke oracle harga objektif/komitmen + dispute window. Minimal: jangan klaim "immutable, manipulation-proof track record" tanpa caveat.

---

## 2. Smart Contracts

### 🟠 C1 — `transfer()` tidak menghapus usage-auth (komentar berbohong)
**Bukti:** `contracts/src/MusashiINFT.sol:169` komentar: _"Clears all usage auths (spec requirement)."_ Tapi badan `transfer()` (`:170-199`) tidak pernah menyentuh `_auths`. Tidak ada test yang menangkap (tak ada assertion `isAuthorized` pasca-transfer di `MusashiINFT.t.sol`).
**Dampak:** executor yang di-authorize owner lama tetap punya hak guna setelah agent dijual → pelanggaran model keamanan ERC-7857 ("no previous party retains access").
**Fix:** lacak daftar executor per-token (mis. `EnumerableSet`) lalu hapus saat transfer; **atau** scope auth dengan `version`/epoch yang naik tiap transfer sehingga auth lama otomatis invalid. Tambah test `transfer → isAuthorized == false`.

### ⚪ C2 — Bukan ERC-721 compatible
INFT custom: tanpa `supportsInterface`/`tokenURI`/`safeTransferFrom`/`approve`. Tidak muncul di tooling/marketplace NFT standar. Wajar untuk ERC-7857 draft, tapi catat batasannya di README.

### ⚪ C3 — `mint` `onlyOwner` vs klaim "multi-agent"
`MusashiINFT.sol:138` `mint` hanya owner. Praktiknya hanya agent deployer yang ada, jadi "any INFT holder can log strikes" menyusut jadi "agent deployer". Dokumentasikan scope atau buka minting (dengan guard).

### ⚪ C4 — `reputation()` menamai `total` padahal `totalFilled`
`ConvictionLog.sol:164-168` mengembalikan `totalFilled` sebagai parameter bernama `total` (dikonfirmasi test `:177` `assertEq(total, 0)` setelah 3 strike/0 outcome). Menyesatkan integrator. Rename → `filled`. (Frontend aman karena pakai `strikeCount()` + `agentReputation()`.)

### ⚪ C5 — `setINFT` one-shot tanpa jalur perbaikan
`INFTAlreadySet` mencegah koreksi bila alamat salah → link bisa "brick". Acceptable, tapi sadari risikonya.

### ⚪ C6 — AES-256-CTR tanpa autentikasi
`internal/chain/seal.go` pakai CTR (tanpa integrity/tamper-detection di lapis cipher; bergantung merkle root 0G + signed digest). Lebih baik **AES-256-GCM** (authenticated encryption).

> Catatan positif: ECDSA replay-protection (chainid+contract+version) benar, test transfer/clone/replay/stale-root/pause/access-control komprehensif, packing storage efisien (4 slot/strike), `Ownable2Step`+`Pausable`+`ReentrancyGuard` dipakai tepat.

---

## 3. Go Core (CLI)

### 🟠 G1 — Duplikasi boilerplate transaksi masif di `conviction.go`
**Bukti:** `PublishStrike` (`:74`), `SetINFT` (`:356`), `RecordOutcome` (`:621`) masing-masing mengulang ±50 baris identik (dial, parse key, nonce, gas price, chainID, sign, send, `WaitMined`, cek receipt). ±400/739 baris duplikat.
**Solusinya sudah ada di repo:** `inft.go:108` `sendINFTTx()` + `abi.Pack` melakukannya dengan benar & DRY.
**Fix:** refactor `conviction.go` mengikuti pola `inft.go` — satu helper `sendTx(ctx, action, calldata)` + go-ethereum `abi` package (hapus encoding manual).

### 🟠 G2 — ABI encoding manual tanpa test (risiko on-chain)
**Bukti:** `conviction.go:137-143` (logStrike calldata), `:678-693` (two's-complement int128), `seal.go:155-181` (`SignTransferDigest` harus byte-match Solidity `abi.encode`). Manipulasi byte berisiko tinggi tanpa satu pun unit test terhadap vektor yang diketahui.
**Dampak:** salah offset/padding = tx malformed/destruktif ke chain mainnet.
**Fix:** migrasi ke `abi.Pack` (seperti inft.go) + tambah golden-vector test untuk encoding & `SignTransferDigest` vs output Solidity.

### 🟡 G3 — N+1 koneksi RPC di `QueryHistory`
**Bukti:** `conviction.go:592-601` loop `QueryStrike`, dan tiap `QueryStrike` (`:492`) `ethclient.Dial` baru. `history --limit 20` membuka 20+ koneksi sekuensial.
**Fix:** reuse satu `*ethclient.Client`; lebih baik pakai multicall/batch.

### 🟡 G4 — Semantik `limit` `QueryHistory` keliru
**Bukti:** `conviction.go:586-601` memindai `limit` ID terakhir lalu memfilter `agentID` → bisa mengembalikan jauh < limit (atau 0) bila strike terbaru milik agent lain.
**Fix:** paginate sampai terkumpul `limit` strike yang cocok.

### 🟡 G5 — Tidak ada retry pada panggilan RPC chain
Data HTTP client punya retry/backoff (`httpclient.go`), tapi `CallContract`/`SendTransaction` tidak. Blip transien = gagal keras.
**Fix:** bungkus RPC read dengan retry/backoff + context.

### 🟡 G6 — `0g-storage-client` exec tanpa timeout
**Bukti:** `og_storage.go:151-155` `exec.Command(...).CombinedOutput()` bisa hang selamanya.
**Fix:** `exec.CommandContext` dengan deadline.

### ⚪ G7 — `httpclient.Do` menyesatkan
`httpclient.go:42,59` selalu hardcode GET dan mengabaikan body/method template; abstraksi pura-pura generik. `time.Sleep` backoff tak bisa dibatalkan via context.

### ⚪ G8 — Magic sentinel di `chainAgeMultiplier`
`gate.go:94` `case 101, 900, 8453*1000` (sentinel Solana di pipeline EVM-only; `8453*1000` literal membingungkan). Dead-ish/menyesatkan.

### ⚪ G9 — Token tanpa data umur → `AgeEstablished` (filtering paling ketat)
`runner.go:103` + `gate.go:114` mem-default ke established → token baru tanpa pair DexScreener kena filter paling ketat, padahal token baru justru target. Jadikan tier sendiri / `DATA_INSUFFICIENT`.

### ⚪ G10 — go-ethereum API deprecated & pipeline serial
`types.NewTransaction`/`NewEIP155Signer` legacy (OK untuk 0G legacy-gas, tapi deprecated). `runner.go:249` menjalankan gate sekuensial; gate independen bisa paralel (perf). Komentar `RunGates` bilang "fail-fast" (`:120`) padahal body "collect-all kecuali Gate 1" (`:24,242`).

> Catatan positif: `inft.go` (abi.Pack + sendINFTTx), strategi pre-fetch data sekali lalu dibagi antar-gate (`runner.go:128-213`) untuk hindari 429, dan filosofi "empty ≠ false" di Gate 1 (`contract_safety.go`) — semua bagus.

---

## 4. Frontend (Next.js)

### 🔴 / 🟠 F1 — Web tier kopling ke binary Go via `child_process` (cacat arsitektur sentral)
**Bukti:** `musashi-cli.ts:5`, `gemini-adapter.ts:26`, `debate/route.ts:10` resolve `../scripts/musashi-core/musashi-core`. Binary di-`.gitignore` dan **tidak ada build step Go di Vercel**.
**Dampak:** di host "live", **semua** `scan/gates/discover/search/status/agent-info/debate` + **tool-call Gemini** mati (ENOENT). Dashboard "live" hanya bisa: read kontrak client-side + chat Gemini yang **tak bisa memanggil tool apa pun**. Plus: spawn 1 proses/request (lambat, boros), parsing stdout-JSON rapuh.
**Fix:** lihat §6 (jadikan `musashi-core` HTTP service; frontend memanggil via HTTP; secret hanya di service).

### 🟠 F2 — Route `debate` tanpa guard hosted-preview
Berbeda dari `chat`, `debate/route.ts` tak cek `IS_HOSTED_PREVIEW`. Di Vercel tiap `spawn("claude")` ENOENT → error beruntun + verdict `UNKNOWN`, bukan pesan bersih. Lagipula 5 proses Claude × ≤180s melebihi batas fungsi serverless.

### 🟡 F3 — Semua komponen `"use client"`, tanpa RSC
14 komponen + kedua page `"use client"`. Tidak ada Server Component untuk fetch data → semua di browser (lihat F4).

### 🟡 F4 — N+1 read on-chain dari browser, tanpa multicall/cache
**Bukti:** `ReputationPanel.tsx:95-123` loop 12× `getStrike`; `StrikeLedger.tsx:97` loop 20×. Tiap `eth_call` round-trip terpisah ke RPC publik 0G tiap load, tanpa cache/batch. `@tanstack/react-query` tersedia (via wagmi) tapi panel hand-roll `useEffect`+`useState`.
**Fix:** viem `multicall` + react-query, atau indexer/cache sisi server.

### 🟡 F5 — Definisi viem client/chain terduplikasi
**Bukti:** `ReputationPanel.tsx:14-24`, `StrikeLedger.tsx:24`, `StrikePublisher.tsx:24`, `AgentIntelligencePanel.tsx:24` masing-masing `createPublicClient` + chain inline; plus `wagmi.ts` (`ogMainnet`) dan `contracts.ts` (konstanta). 3+ sumber config chain.
**Fix:** satu modul `chain client` tersentral, di-import semua.

### 🟡 F6 — Mismatch nama env var CI vs kode
**Bukti:** CI set `NEXT_PUBLIC_CONVICTION_LOG`/`NEXT_PUBLIC_MUSASHI_INFT` (`ci.yml:57-58`), tapi kode baca `…_ADDRESS` (`contracts.ts:19,24`). Alamat dari CI diabaikan diam-diam (fallback ke hardcoded).
**Fix:** samakan nama; idealnya satu konstanta.

### ⚪ F7 — Risiko truncation `maxBuffer`
`musashi-cli.ts:12` (2MB) / `gemini-adapter.ts:69` (4MB): output scan besar bisa lewati buffer → `ERR_CHILD_PROCESS_STDIO_MAXBUFFER` → route 500. Streaming/naikkan hati-hati.

### ⚪ F8 — `page.tsx` monolit (1.251 baris)
Landing page raksasa dengan helper inline (`useInView`, `Reveal`, `SectionHeading`). Bisa dipecah ke komponen/section. (Acceptable untuk marketing page, tapi utang.)

> Catatan positif: `gemini-adapter.ts` (registry tool tertutup + validasi alamat/chain di `musashi-cli.ts:27-58`) adalah pola yang benar — jadikan standar. SSE streaming, `ErrorBoundary`, abort handling sudah ada.

---

## 5. CI / DevOps & Build

### 🟠 B1 — CI Go job rusak (versi tidak cocok)
**Bukti:** `ci.yml:18` `go-version: "1.22"` vs `go.mod` `go 1.26.1` → `go build` gagal (`go.mod requires go >= 1.26.1`).
**Fix:** naikkan `setup-go` ke 1.26.x. **Verifikasi `go 1.26.1` adalah toolchain rilis nyata**; jika belum, pin ke versi stabil (mis. 1.23/1.24) di go.mod dan CI sekaligus.

### 🟠 B2 — CI Frontend job rusak (npm vs pnpm)
**Bukti:** `ci.yml:38-43` `cache: npm` + `cache-dependency-path: frontend/package-lock.json` + `npm ci`. Repo hanya punya `pnpm-lock.yaml` (no `package-lock.json`) → `npm ci` gagal.
**Fix:** `pnpm/action-setup` + `cache: pnpm` + `pnpm install --frozen-lockfile`.

### 🟡 B3 — Contracts tidak ada di CI sama sekali
Kode dengan blast-radius tertinggi (on-chain) tak di-gate CI. Tambah job `forge build` + `forge test`.

### 🟡 B4 — Lint/vet/staticcheck Go tidak ada
Tambah `gofmt -l`, `go vet`, `staticcheck` ke CI.

### ⚪ B5 — Dependency mencurigakan / bleeding-edge
`go.mod` indirect `github.com/ProjectZKM/Ziren/.../zkvm_runtime` — konfirmasi memang transitif sah. Next 16 + React 19 sangat baru (`frontend/AGENTS.md` memperingatkan "This is NOT the Next.js you know") — pastikan disengaja & terkunci.

---

## 6. Testing

| Area | Status | Gap |
|---|---|---|
| Contracts | ✅ Baik | Kurang: assertion transfer→auth-clear (C1), fuzz math outcome/return |
| Go gates framework | 🟡 Sebagian | `gate_test.go` hanya helper murni (IsEmpty, ClassifyAge, Result) |
| Go gate logic | ❌ Kosong | Tak ada test `Evaluate` dgn mock GoPlus/Dex |
| Go ABI/crypto | ❌ Kosong | **Kritis**: encoding calldata & `SignTransferDigest` tak diuji |
| Go pipeline/scanner/journal | ❌ Kosong | Scoring heuristik & runner tak diuji |
| Frontend | ❌ ~Kosong | Hanya `verdict-parser.test.mjs`; route/adapter/komponen tak diuji |

---

## 7. Arsitektur Target (untuk Rombak Total)

Inti masalah: **batas web↔analisa salah ditarik**. Saat ini Next.js = orchestrator yang men-spawn CLI + memegang secret. Itu tidak serverless-ready, tidak aman, dan rapuh.

**Target:**

```
┌────────────┐     HTTPS/JSON      ┌──────────────────────────┐      RPC/Storage
│ Next.js    │ ──────────────────► │ musashi-core (HTTP daemon)│ ───► 0G Chain / 0G Storage
│ (UI + RSC) │   (no secrets)      │  /gates /scan /hunt ...   │      (private key HANYA di sini)
└────────────┘                     │  /strike (auth-gated)     │
      │ multicall + react-query     └──────────────────────────┘
      ▼
  0G RPC (read-only, client/server cache)
```

Prinsip:
1. **`musashi-core serve`** — subcommand HTTP baru yang meng-expose logika gate/scan/hunt/status sebagai JSON. Satu sumber kebenaran, dipakai CLI, OpenClaw, dan web.
2. **Web tier tanpa secret & tanpa `child_process`.** Next API route/RSC memanggil daemon via HTTP. Private key hanya hidup di daemon.
3. **Chat: semua runtime pakai registry tool tertutup** (pola `gemini-adapter.ts`). Tidak ada `Bash` mentah dari endpoint publik. Claude Code (jika dipakai) = worker terpisah, tool minimal, sandbox, tanpa key.
4. **Aksi tulis on-chain (`strike`) di belakang auth** + konfirmasi verdict judge (sudah ada guard `orchestrate`), dijalankan oleh daemon, bukan web.
5. **Read on-chain via multicall + cache** (react-query / indexer ringan), bukan N+1 dari browser.
6. **Package Go `chaintx` bersama** menghapus duplikasi `conviction.go` (pola `inft.go`).

---

## 8. Roadmap Perbaikan (Berfase)

### FASE 0 — Hentikan pendarahan (security & CI) — **wajib pertama**
- [ ] **S1/S2:** Hilangkan `Bash` dari agent chat publik; bersihkan secret dari env subprocess (whitelist var). Pisahkan jalur publish.
- [ ] **S3:** `0g-storage-client` terima key via env/stdin, bukan `--key` argumen.
- [ ] **B1:** CI Go → versi cocok dgn `go.mod` (atau pin go.mod ke versi stabil).
- [ ] **B2:** CI Frontend → pnpm (`frozen-lockfile`).
- [ ] **S5:** Gemini key ke header, bukan URL.
- [ ] **F6:** Samakan nama env var alamat kontrak.

### FASE 1 — Pondasi arsitektur (rombak inti)
- [ ] **F1:** Bangun `musashi-core serve` (HTTP JSON). Pindahkan semua API route Next ke pemanggilan HTTP daemon; hapus `child_process` dari web.
- [ ] **S4/S6:** Auth + rate limit tersentral (Upstash/KV) untuk endpoint mahal.
- [ ] **F2:** Tangani ketiadaan runtime dengan pesan bersih (atau jalankan debate di daemon).
- [ ] **G1/G2:** Refactor `conviction.go` ke pola `inft.go` (sendTx + abi.Pack) + golden-vector test ABI/sign.

### FASE 2 — Smart contract & integritas
- [ ] **C1:** Implement clear/scope usage-auth saat transfer + test.
- [ ] **C6:** Pindah ke AES-256-GCM.
- [ ] **C4:** Rename `total` → `filled`. **C2/C3/C5/S8:** dokumentasikan trust assumptions & scope dengan jujur.
- [ ] **B3:** CI contracts (`forge build` + `forge test`).

### FASE 3 — Kualitas Go & performa
- [ ] **G3/G4:** Reuse client + multicall di `QueryHistory`; perbaiki semantik limit.
- [ ] **G5/G6/G7:** Retry RPC, timeout exec, rapikan `httpclient`.
- [ ] **G8/G9/G10:** Bersihkan magic sentinel; tier "no age data"; pertimbangkan paralelisasi gate.
- [ ] Tambah test Go: gate logic (mock), pipeline, scanner scoring, journal, seal roundtrip.

### FASE 4 — Frontend & DX
- [ ] **F4/F5:** Multicall + react-query; sentralkan viem client/chain config.
- [ ] **F3:** Pindah read on-chain ke RSC/server action di mana relevan.
- [ ] **F7/F8:** Tangani maxBuffer; pecah `page.tsx`.
- [ ] **S7:** CSP + hapus X-XSS-Protection.
- [ ] **B4:** lint/vet/staticcheck di CI; tes route & adapter frontend.

### FASE 5 — Dokumentasi jujur
- [ ] Selaraskan README/marketing dengan realita (fitur yang jalan di host vs lokal, journal lokal, outcome owner-recorded). Hapus overclaim.

---

## 9. Quick wins (≤1 jam, dampak tinggi)
1. CI: ganti ke pnpm + Go version benar (B1/B2) — bikin pipeline hijau lagi.
2. `0g-storage-client` key via env (S3).
3. Gemini key ke header (S5).
4. `childEnv` whitelist (S2) — kurangi blast radius drastis.
5. Samakan nama env var alamat (F6).
6. Rename `total`→`filled` di kontrak + ABI (C4).
7. Tambah guard hosted-preview di route `debate` (F2).

## 10. Catatan akhir
Project ini punya **fondasi ide yang layak dilanjutkan**: pipeline konviksi orisinal, kontrak rapi & teruji, dan beberapa modul Go (inft.go, gemini-adapter.ts) yang sudah "benar" dan bisa jadi **template** untuk merapikan sisanya. Rombak total **bukan** menulis ulang dari nol — melainkan: (a) tarik ulang batas web↔analisa (daemon HTTP), (b) cabut secret dari web tier, (c) hapus duplikasi conviction.go, (d) perbaiki CI, (e) jujurkan dokumentasi. Setelah Fase 0–1, postur keamanan & kesiapan production naik dari **D → B**.
