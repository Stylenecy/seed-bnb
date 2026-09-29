// Back-compat alias. The LocalNet seeder (Mode C) was generalized to
// scripts/seed-ledger.mjs so ONE tool drives LocalNet (shared-secret) AND DevNet
// (oauth2). This thin shim re-runs it with the same argv/env so existing
// `scripts/seed-localnet.mjs [price|coupon|verify]` commands keep working —
// defaults are unchanged (LEDGER_AUTH=shared-secret => LocalNet).
import "./seed-ledger.mjs";
