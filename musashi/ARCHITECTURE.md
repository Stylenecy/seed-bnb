# MUSASHI — Blueprint Arsitektur Target (Patokan Rombak)

> Dokumen ini adalah **north star** selama refactor. Setiap kali ragu "ini harus di mana / siapa yang pegang ini", jawabannya ada di sini.
> Dibaca berpasangan dengan [`AUDIT.md`](./AUDIT.md). AUDIT = _apa yang salah_; ARCHITECTURE = _mau jadi seperti apa_.

---

## 1. Kenapa arsitektur sekarang rusak (ringkas)

```
[ Browser ] → [ Next.js API route ] → child_process.spawn("musashi-core" / "claude") → BNB Chain
                     │
                     ├─ memegang BSC_PRIVATE_KEY di env  ❌ (secret di web tier)
                     ├─ binary Go tidak ada di Vercel         ❌ (fitur mati di "live")
                     └─ chat = Bash agent + key + cwd root     ❌ (RCE / key theft)
```

Masalah inti: **batas tanggung jawab salah ditarik.** Next.js merangkap jadi orchestrator + pemegang secret + process launcher. Tidak serverless-ready, tidak aman, rapuh.

---

## 2. Arsitektur target

```
┌──────────────────────┐      HTTPS / JSON          ┌─────────────────────────────────┐
│  Next.js (UI)        │  ───────────────────────►  │  musashi-core  (HTTP daemon)    │
│  - RSC untuk read    │   X-Api-Key (server→server)│  subcommand: `musashi-core serve`│
│  - API route = thin  │ ◄───────────────────────   │  /healthz                       │
│    proxy ke daemon   │      JSON (no secret)      │  /v1/gates  /v1/scan  /v1/hunt  │
│  - TIDAK pegang key  │                            │  /v1/discover /v1/search        │
│  - TIDAK spawn proc  │                            │  /v1/status /v1/agent-info      │
└──────────┬───────────┘                            │  /v1/history                    │
           │                                        │  (write) /v1/strike  [auth]     │
           │ multicall + react-query                │                                 │
           ▼ (read-only)                            │  BSC_PRIVATE_KEY HANYA di  │
   ┌───────────────┐                                │  daemon (publish path)          │
   │  BSC RPC       │ ◄──────────────────────────────┤───► BNB Chain / 0G Storage       │
   │  (public)     │                                └─────────────────────────────────┘
   └───────────────┘
```

### Aturan tak-bisa-ditawar (invariants)
1. **Private key hanya hidup di daemon `musashi-core`.** Web tier (Next.js) tidak boleh punya `BSC_PRIVATE_KEY` di env-nya, tidak boleh membaca `.env` yang memuatnya, tidak boleh mewariskannya ke proses anak.
2. **Web tier tidak `child_process.spawn` apa pun di jalur request.** Semua kerja analisa = HTTP call ke daemon.
3. **Endpoint publik chat tidak pernah dapat tool `Bash` mentah.** Hanya registry tool tertutup (whitelist fungsi → wrapper tervalidasi), pola yang sudah benar di `frontend/src/lib/gemini-adapter.ts`.
4. **Aksi tulis on-chain (`/v1/strike`) di belakang auth** (server→server API key minimal) DAN tetap butuh verdict judge `PASS` (guard `orchestrate` yang sudah ada).
5. **Read on-chain dari UI = multicall + cache**, bukan N+1 `eth_call` per render.
6. **Satu sumber kebenaran logika analisa** = package Go di `internal/`. CLI, daemon HTTP, dan (kalau ada) OpenClaw semua memanggil package yang sama. Tidak ada logika gate yang ditulis ulang di TS.

---

## 3. Kontrak API daemon (`musashi-core serve`)

| Method | Path | Auth | Body / Query | Dipakai oleh |
|---|---|---|---|---|
| GET | `/healthz` | — | — | liveness |
| GET | `/v1/gates?token=&chain=` | — | — | gates panel, debate Phase 1 |
| GET | `/v1/scan?chain=&limit=&gates=` | — | — | scanner |
| GET | `/v1/hunt?chain=&top=` | — | — | hunt |
| GET | `/v1/discover?chain=&limit=` | — | — | discover |
| GET | `/v1/search?q=&limit=` | — | — | search |
| GET | `/v1/status?perAgent=&agentId=` | — | — | reputation (boleh tetap read on-chain dari UI) |
| GET | `/v1/agent-info?tokenId=` | — | — | INFT panel |
| GET | `/v1/history?agentId=&limit=` | — | — | judge calibration |
| POST | `/v1/strike` | ✅ API key | `{token,chain,convergence,evidence,judgeVerdict}` | publish (server-side only) |

Catatan implementasi:
- Reuse fungsi `pipeline.*` / `chain.*` yang ada — `serve` hanya membungkus jadi handler HTTP. **Tidak menduplikasi logika.**
- Validasi input di daemon (alamat hex, chain whitelist, limit) — pindahkan/duplikasi guard dari `frontend/src/lib/musashi-cli.ts:27-58` ke sisi Go (defense in depth).
- Output JSON identik dengan output CLI sekarang (agar frontend cukup ganti "spawn → fetch").
- Daemon stateless untuk read; rate-limit + auth di reverse-proxy / middleware.

---

## 4. Model runtime chat (semua runtime seragam)

```
User msg → /api/chat (Next, thin) → adapter → registry tool tertutup (agent-tools.ts) → HTTP daemon
   ├─ claude/hermes : gateway OpenAI-compatible (Hermes/OpenRouter/Nous/LiteLLM)  ✅ PRODUKSI (semua orang)
   ├─ gemini        : Gemini REST                                                  ✅ hosted
   └─ claude/openclaw lokal : CLI shell-capable                                     ⚠️ opt-in (dev only)
```

- Registry tool tertutup = `AGENT_TOOLS[]` di `frontend/src/lib/agent-tools.ts` — SATU sumber, dipakai semua adapter. Tiap tool memanggil daemon via HTTP, bukan shell.
- Jalur "anyone can try" = **Claude via Hermes** (`hermes-adapter.ts`, OpenAI-compatible, HTTP, tanpa install per-user, jalan di serverless). Aktif saat `HERMES_API_KEY` di-set; tab "Claude" otomatis memakainya.
- Gemini (`gemini-adapter.ts`) = opsi hosted lain. Keduanya streaming SSE via helper `streamLLM` bersama di `chat/route.ts`.
- Tidak ada runtime chat hosted yang menjalankan shell. Hanya jalur lokal opt-in yang `spawn` CLI.

---

## 5. Kepemilikan secret & env

| Var | Web (Next) | Daemon | Browser (NEXT_PUBLIC_) |
|---|---|---|---|
| `BSC_PRIVATE_KEY` | ❌ NEVER | ✅ | ❌ |
| `GEMINI_API_KEY` | ✅ (dipakai adapter) | — | ❌ |
| `BSC_RPC_URL`, alamat kontrak | ✅ | ✅ | ✅ (read) |
| `MUSASHI_DAEMON_URL`, `MUSASHI_DAEMON_KEY` | ✅ | — | ❌ |

Konvensi nama alamat kontrak (samakan di mana-mana): `NEXT_PUBLIC_CONVICTION_LOG_ADDRESS`, `NEXT_PUBLIC_MUSASHI_INFT_ADDRESS` (sesuai `frontend/src/lib/contracts.ts`).

---

## 6. Urutan migrasi (biar tidak bingung di tengah jalan)

> Setiap fase meninggalkan repo dalam keadaan **bisa di-build & konsisten**. Tidak ada fase yang setengah jadi.

### FASE 0 — Hentikan pendarahan (TIDAK mengubah arsitektur; aman & cepat) ← ✅ **SELESAI**
Tujuan: amankan + hijaukan CI tanpa menyentuh batas web↔analisa.
- Web tier: cabut `BSC_PRIVATE_KEY` dari env subprocess (`childEnv`). Invariant #1 mulai ditegakkan dari sisi env.
- Chat Bash agent (claude/openclaw) → **default OFF**, opt-in `MUSASHI_ENABLE_LOCAL_AGENTS=1`. Default deployment = Gemini (tool tertutup). Menetralkan S1 by-default.
- Gemini key → header (S5).
- CI: Go pakai `go-version-file`, frontend pakai pnpm, samakan nama env var, tambah job contracts (B1/B2/B3/F6).
- **Status interim:** arsitektur masih spawn-based (Gemini tools masih spawn `musashi-core` lokal). Itu OK untuk dev lokal; di Vercel fitur analisa memang belum jalan sampai Fase 1. Ini disengaja & didokumentasikan.

### FASE 1 — Daemon HTTP + web jadi thin proxy (rombak inti) ← ✅ **SELESAI** (jalur data)
> Catatan: `musashi-core serve` read-only sudah jalan & teruji end-to-end (browser→Next→daemon→DexScreener). Jalur data web 100% HTTP (no spawn). Sisa: chat Claude/OpenClaw + debate masih `spawn` LLM agent lokal (di-gate opt-in `MUSASHI_ENABLE_LOCAL_AGENTS`) — memindahkannya ke worker terpisah adalah pekerjaan fase lanjutan.
- Tambah `musashi-core serve` (§3). Verifikasi dengan `go test` + smoke `curl`.
- Ganti `frontend/src/lib/musashi-cli.ts` dari `execFile(BINARY,…)` → `fetch(MUSASHI_DAEMON_URL + …)`. Hapus `child_process` dari web.
- `gemini-adapter.ts` tool handler → panggil daemon, bukan `runRaw` spawn.
- `debate/route.ts` → konsumsi `/v1/gates` + `/v1/history` via HTTP; jalankan specialist/judge di daemon atau worker (bukan spawn di web).
- Auth + rate-limit tersentral untuk endpoint mahal (S4/S6).
- **Setelah fase ini:** deployment "live" bisa benar (web stateless ke daemon), invariant #1–#4 ditegakkan penuh.

### FASE 2 — Smart contract & integritas ← ✅ **SELESAI** (kode + test) · ⚠️ perlu REDEPLOY ke mainnet agar berlaku on-chain
- **C1** ✅ `transfer()` kini benar-benar menghapus usage-auth via auth-epoch O(1) (`_authEpoch[tokenId]++`); `isAuthorized` cek epoch. + regression test `testTransferClearsUsageAuth`.
- **C6** ✅ `seal.go` pakai AES-256-GCM (authenticated) menggantikan AES-CTR; tamper → decrypt gagal. + `seal_test.go` (roundtrip + tamper).
- **C4** ✅ `reputation()` return `total`→`filled` (kontrak + ABI `contracts.ts` + komentar Go + test).
- Catatan: kontrak mainnet terdeploy (`0x2B84…`/`0x74BC…`) masih jalan bytecode LAMA — fix C1/C4 baru aktif setelah redeploy (`contracts/script/deploy-and-verify.sh`). C6 off-chain (Go) langsung aktif.
- Belum: dokumentasi trust assumptions (S8/C2/C3/C5) → Fase 5.

### FASE 3 — Kualitas Go & performa
- G1/G2 (refactor `conviction.go` ke pola `inft.go` + golden-vector test ABI/sign), G3/G4 (multicall history), G5–G10.

### FASE 4 — Frontend & DX
- F4/F5 (multicall + react-query, sentralkan client), F3 (RSC), F7/F8, S7 (CSP).

### FASE 5 — Dokumentasi jujur
- Selaraskan README dengan realita.

---

## 7. Apa yang TIDAK berubah (jangan diutak-atik tanpa alasan)
- Logika gate di `internal/gates/*` (kualitas analisanya bagus; "empty ≠ false").
- Smart contract storage layout & event (sudah efisien & teruji) — kecuali C1/C4/C6.
- `inft.go` (sudah jadi pola yang benar — justru jadi template untuk G1).
- `gemini-adapter.ts` registry tool (jadi template runtime chat).
- Strategi pre-fetch data anti-429 di `runner.go`.

---

## 8. Definition of Done per fase
- **Build hijau:** `go build ./... && go test ./...`, `pnpm build && pnpm test && pnpm lint`, `forge build && forge test`.
- **Invariants §2 tidak dilanggar** (cek: `grep -r BSC_PRIVATE_KEY frontend/` harus kosong setelah Fase 1; `grep -r child_process frontend/src` harus kosong setelah Fase 1).
- **Tidak ada regресi fitur** yang sebelumnya jalan di jalur yang didukung.
