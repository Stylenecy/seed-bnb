// Seed the Cermin demo scene onto a real Canton participant via JSON Ledger API v2.
// One tool drives BOTH targets, selected by LEDGER_AUTH:
//   - shared-secret (default) -> CN Quickstart LocalNet (Mode C). HS256 JWT {sub,aud}.
//   - oauth2                  -> DevNet / Seaport hosted validator (Mode D). One
//                                OAuth2 client_credentials identity for everything.
//
// Reproduces `Cermin.Scripts.Demo:demoSetup`: upload DAR -> allocate the 5 parties
// -> authorise the submitter(s) -> build the pre-rescue scene (collateral, price
// 1.00, 6000 loan, GuardPolicy, 1500 ShadowVault).
//
// Auth model difference (the crux of the DevNet port):
//   * shared-secret: the token names a ledger USER; we mint one HS256 token per
//     identity (cermin / cermin-guard / cermin-borrower / cermin-oracle) and
//     create those users with actAs/readAs rights.
//   * oauth2: there is ONE shared m2m identity (the client_credentials user, a
//     ParticipantAdmin with CanReadAsAnyParty). We can't mint per-identity tokens,
//     so ALL submits go through that one user, differing only in `actAs` — and we
//     GRANT that user CanActAs on our 5 parties. The command `userId` is OMITTED
//     (the participant defaults it to the authenticated user; a mismatched userId
//     is rejected 403). No cermin-* users are created on DevNet.
//
// Usage (env-configurable; see the block below):
//   node scripts/seed-ledger.mjs            # upload DAR + allocate + authorise + seed
//                                           #   (re-run safe: skips the scene if a Loan is live)
//   node scripts/seed-ledger.mjs price 0.76 # oracle UpdatePrice (drives the rescue)
//   node scripts/seed-ledger.mjs coupon     # pay one 112.50 quarterly coupon (Coupon Sweep)
//   node scripts/seed-ledger.mjs verify     # Borrower position + PoolOperator privacy view
//
// Env:
//   LEDGER_AUTH=shared-secret|oauth2   LEDGER_URL=...   LEDGER_PACKAGE_NAME=cermin-rwa
//   DAR_PATH=daml/.daml/dist/cermin-rwa-0.0.1.dar
//   shared-secret: LEDGER_JWT_SECRET=unsafe  LEDGER_AUDIENCE=https://canton.network.global
//                  ADMIN_USER=ledger-api-user
//   oauth2:        AUTH_URL AUTH_CLIENT_ID AUTH_CLIENT_SECRET AUTH_AUDIENCE AUTH_SCOPE
//   party hints (defaults per auth mode): PARTY_HINT_ISSUER PARTY_HINT_BORROWER
//                  PARTY_HINT_POOL PARTY_HINT_GUARD PARTY_HINT_ORACLE
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const AUTH = (process.env.LEDGER_AUTH ?? "shared-secret").toLowerCase() === "oauth2" ? "oauth2" : "shared-secret";
const LEDGER_URL = process.env.LEDGER_URL ?? "http://localhost:3975";
const SECRET = process.env.LEDGER_JWT_SECRET ?? "unsafe";
const AUDIENCE = process.env.LEDGER_AUDIENCE ?? "https://canton.network.global";
const ADMIN_USER = process.env.ADMIN_USER ?? "ledger-api-user";
// Package-NAME reference (daml.yaml `name:`), used for ALL template ids — v2
// accepts `#<name>:Mod:Ent` on commands and REQUIRES it on ACS filters.
const PKG_NAME = process.env.LEDGER_PACKAGE_NAME ?? "cermin-rwa";
const DAR_PATH = process.env.DAR_PATH ?? "daml/.daml/dist/cermin-rwa-0.0.1.dar";

// Party hints — namespaced on the shared DevNet so we never collide with other
// teams (STATE.md §6). Defaults differ per auth mode; override via env.
const HINT_DEFAULTS =
  AUTH === "oauth2"
    ? { issuer: "cermin-issuer", borrower: "cermin-borrower", pool: "cermin-pool-operator", guard: "cermin-guard-agent", oracle: "cermin-oracle" }
    : { issuer: "Issuer", borrower: "Borrower", pool: "PoolOperator", guard: "GuardAgent", oracle: "Oracle" };
const HINTS = {
  issuer: process.env.PARTY_HINT_ISSUER ?? HINT_DEFAULTS.issuer,
  borrower: process.env.PARTY_HINT_BORROWER ?? HINT_DEFAULTS.borrower,
  pool: process.env.PARTY_HINT_POOL ?? HINT_DEFAULTS.pool,
  guard: process.env.PARTY_HINT_GUARD ?? HINT_DEFAULTS.guard,
  oracle: process.env.PARTY_HINT_ORACLE ?? HINT_DEFAULTS.oracle,
};

const b64 = (b) => Buffer.from(b).toString("base64url");
function hs256(sub) {
  const h = b64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const p = b64(JSON.stringify({ sub, aud: AUDIENCE }));
  const s = createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url");
  return `${h}.${p}.${s}`;
}

// --- token source ----------------------------------------------------------
let oauthToken;
async function fetchOAuthToken() {
  const need = ["AUTH_URL", "AUTH_CLIENT_ID", "AUTH_CLIENT_SECRET", "AUTH_AUDIENCE"];
  for (const k of need) if (!process.env[k]) throw new Error(`LEDGER_AUTH=oauth2 requires ${k}`);
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.AUTH_CLIENT_ID,
    client_secret: process.env.AUTH_CLIENT_SECRET,
    audience: process.env.AUTH_AUDIENCE,
    scope: process.env.AUTH_SCOPE ?? "daml_ledger_api",
  });
  const res = await fetch(process.env.AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`OAuth2 token request failed: ${res.status}: ${text}`);
  const json = JSON.parse(text);
  if (!json.access_token) throw new Error("OAuth2 token response missing access_token");
  return json.access_token;
}
/** The authenticated OAuth user id (the JWT `sub`), for rights grants. */
function oauthSub() {
  return JSON.parse(Buffer.from(oauthToken.split(".")[1], "base64url").toString()).sub;
}
/** Token for a logical identity. shared-secret mints per-sub; oauth2 returns the
 * one shared token (the sub is ignored for the token, used only as a label). */
async function tokenFor(sub) {
  if (AUTH === "oauth2") return oauthToken;
  return hs256(sub);
}
async function adminToken() {
  return AUTH === "oauth2" ? oauthToken : hs256(ADMIN_USER);
}

// --- HTTP helpers ----------------------------------------------------------
async function api(path, token, body, contentType = "application/json") {
  const res = await fetch(`${LEDGER_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType },
    body: contentType === "application/octet-stream" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}
async function get(path, token) {
  const res = await fetch(`${LEDGER_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}: ${text}`);
  return JSON.parse(text);
}

const tid = (moduleEntity) => `#${PKG_NAME}:${moduleEntity}`;
let cmdSeq = 0;
function created(resp, moduleEntitySuffix) {
  const evs = resp.transaction?.events ?? [];
  for (const e of evs) {
    const ce = e.CreatedEvent;
    if (ce && ce.templateId.endsWith(`:${moduleEntitySuffix}`)) return ce;
  }
  throw new Error(`no CreatedEvent for ${moduleEntitySuffix}; events=${JSON.stringify(evs).slice(0, 400)}`);
}
/** Submit as logical identity `sub` acting as `actAs`. In oauth2 mode the command
 * `userId` is omitted (participant defaults it to the authenticated user). */
async function submit(actAs, sub, command) {
  cmdSeq += 1;
  const token = await tokenFor(sub);
  const commands = { commandId: `seed-${Date.now()}-${cmdSeq}`, actAs, readAs: actAs, commands: [command] };
  if (AUTH !== "oauth2") commands.userId = sub;
  return api("/v2/commands/submit-and-wait-for-transaction", token, { commands });
}
const create = (templateSuffix, args) => ({ CreateCommand: { templateId: tid(templateSuffix), createArguments: args } });
const exercise = (templateSuffix, contractId, choice, choiceArgument) => ({
  ExerciseCommand: { templateId: tid(templateSuffix), contractId, choice, choiceArgument },
});

let NS;
async function resolveNS() {
  const pid = await get("/v2/parties/participant-id", await adminToken());
  // party/participant ids are `name::fingerprint`; the namespace is the last ::
  // segment (LocalNet: participant::<ns>; DevNet: 5nsandbox-devnet-2::<ns>).
  NS = pid.participantId.split("::").pop();
  return NS;
}
const partyId = (key) => `${HINTS[key]}::${NS}`;

async function allocateParty(hint) {
  const admin = await adminToken();
  // Check for an existing party with this hint FIRST — another session (or an
  // earlier run) may already have allocated it on the shared validator.
  const existing = await get(`/v2/parties/${hint}::${NS}`, admin).catch(() => null);
  if (existing?.partyDetails?.[0]?.party) return existing.partyDetails[0].party;
  const r = await api("/v2/parties", admin, { partyIdHint: hint, identityProviderId: "" });
  return r.partyDetails.party;
}

/** shared-secret: create a ledger user with actAs/readAs on its parties. */
async function ensureUser(userId, primaryParty, actAsParties) {
  const admin = await adminToken();
  const exists = await get(`/v2/users/${userId}`, admin).catch(() => null);
  if (!exists) {
    await api("/v2/users", admin, {
      user: { id: userId, isDeactivated: false, primaryParty, identityProviderId: "", metadata: { resourceVersion: "", annotations: {} } },
      rights: [],
    });
  }
  const rights = [];
  for (const p of actAsParties) {
    rights.push({ kind: { CanActAs: { value: { party: p } } } });
    rights.push({ kind: { CanReadAs: { value: { party: p } } } });
  }
  await api(`/v2/users/${userId}/rights`, admin, { userId, identityProviderId: "", rights });
}

/** oauth2: grant the ONE shared OAuth user CanActAs+CanReadAs on our parties, so
 * it can submit as them (it lacks CanActAsAnyParty; CanReadAsAnyParty it has). */
async function grantOAuthUserRights(parties) {
  const admin = await adminToken();
  const userId = oauthSub();
  const rights = [];
  for (const p of parties) {
    rights.push({ kind: { CanActAs: { value: { party: p } } } });
    rights.push({ kind: { CanReadAs: { value: { party: p } } } });
  }
  await api(`/v2/users/${userId}/rights`, admin, { userId, identityProviderId: "", rights });
  return userId;
}

/** Active contracts of one template visible to `party`, queried as `sub`'s token. */
async function acs(sub, party, moduleEntity) {
  const token = await tokenFor(sub);
  const { offset } = await get("/v2/state/ledger-end", token);
  const rows = await api("/v2/state/active-contracts", token, {
    activeAtOffset: offset,
    verbose: true,
    filter: { filtersByParty: { [party]: { cumulative: [{ identifierFilter: { TemplateFilter: { value: { templateId: tid(moduleEntity) } } } }] } } },
  });
  return rows.map((r) => r.contractEntry?.JsActiveContract?.createdEvent).filter(Boolean);
}

/** Fetch the OAuth token once (no-op in shared-secret mode). */
async function ensureOAuth() {
  if (AUTH === "oauth2" && !oauthToken) oauthToken = await fetchOAuthToken();
}

// `price <p>` — oracle exercises PriceFeed.UpdatePrice (the rescue trigger).
async function priceCmd(newPrice) {
  if (!newPrice || Number.isNaN(Number(newPrice))) throw new Error("usage: seed-ledger.mjs price <decimal, e.g. 0.76>");
  await ensureOAuth();
  await resolveNS();
  const oracle = partyId("oracle");
  const feed = (await acs("cermin-oracle", oracle, "Cermin.Oracle:PriceFeed"))[0];
  if (!feed) throw new Error("no live PriceFeed — run the seed first");
  console.log(`PriceFeed ${feed.contractId.slice(0, 14)}...: price ${feed.createArgument.price} -> ${newPrice}`);
  const resp = await submit([oracle], "cermin-oracle",
    exercise("Cermin.Oracle:PriceFeed", feed.contractId, "UpdatePrice", { newPrice: String(newPrice) }));
  const ev = created(resp, "Cermin.Oracle:PriceFeed");
  console.log("UpdatePrice OK — new PriceFeed price:", ev.createArgument.price);
}

// `coupon` — issuer pays one quarterly coupon (112.50 on the demo numbers); the
// Guard Agent's next poll sweeps it into the loan (GuardPolicy.couponSweep=True).
async function couponCmd() {
  await ensureOAuth();
  await resolveNS();
  const issuer = partyId("issuer"), borrower = partyId("borrower"), guardAgent = partyId("guard");
  const resp = await submit([issuer, borrower], "cermin", // CouponDistribution is signed by issuer+owner
    create("Cermin.Coupon:CouponDistribution", { issuer, owner: borrower, guardAgent, instrumentId: "mUST-2030", amount: "112.50" }));
  const ev = created(resp, "Cermin.Coupon:CouponDistribution");
  console.log("CouponDistribution created:", ev.contractId.slice(0, 16) + "...", "amount", ev.createArgument.amount);
}

// `verify [--party <id>]` — reproduces the E2E acceptance check on-ledger: a
// borrower's full position (numbers should match STATE.md §2, or the given
// self-service party's) AND the PoolOperator's view of the private templates,
// which must all be 0 — the headline privacy claim. `--party` scopes the
// borrower view to a self-service user (Task 16 per-user evidence).
async function verifyCmd() {
  await ensureOAuth();
  await resolveNS();
  const partyArgIdx = process.argv.indexOf("--party");
  const borrower = partyArgIdx >= 0 ? process.argv[partyArgIdx + 1] : partyId("borrower");
  const pool = partyId("pool");
  console.log(`(verify borrower = ${borrower})`);
  const loan = (await acs("cermin-borrower", borrower, "Cermin.Credit:Loan"))[0];
  // The PriceFeed is GLOBAL — read it as the oracle (a self-service borrower is
  // not a subscriber), exactly like the backend's getPosition does.
  const feed = (await acs("cermin-oracle", partyId("oracle"), "Cermin.Oracle:PriceFeed"))[0];
  const vault = (await acs("cermin-borrower", borrower, "Cermin.Guard:ShadowVault"))[0];
  const rescues = await acs("cermin-borrower", borrower, "Cermin.Guard:RescueEvent");
  if (!loan || !feed) throw new Error("no live Loan/PriceFeed — run the seed first");
  const out = Number(loan.createArgument.outstanding);
  const amt = Number(loan.createArgument.collateralAmount);
  const price = Number(feed.createArgument.price);
  console.log("BORROWER view:");
  console.log(`  price ${price}  collateral ${amt}  outstanding ${out.toFixed(2)}  vault ${Number(vault?.createArgument.balance ?? 0).toFixed(2)}`);
  console.log(`  Health Ratio = ${Math.round((amt * price * 10000) / out)} bps`);
  console.log(`  RescueEvents: ${rescues.length}`);
  for (const r of rescues.map((e) => e.createArgument).sort((a, b) => (a.at < b.at ? -1 : 1))) {
    console.log(`    - ${r.description} | amount ${Number(r.amount).toFixed(2)} | ${r.healthBefore} -> ${r.healthAfter}`);
  }
  console.log("POOL OPERATOR view (privacy check — all MUST be 0):");
  const [pv, pr, pp] = await Promise.all([
    acs("cermin", pool, "Cermin.Guard:ShadowVault"),
    acs("cermin", pool, "Cermin.Guard:RescueEvent"),
    acs("cermin", pool, "Cermin.Guard:GuardPolicy"),
  ]);
  console.log(`  ShadowVaults: ${pv.length}  RescueEvents: ${pr.length}  GuardPolicies: ${pp.length}`);
  if (pv.length || pr.length || pp.length) throw new Error("PRIVACY VIOLATION: pool can see private contracts");
}

async function main() {
  await ensureOAuth();

  // 0. participant namespace
  await resolveNS();
  console.log(`LEDGER_AUTH=${AUTH}  LEDGER_URL=${LEDGER_URL}`);
  console.log("participant namespace:", NS);

  // 1. upload DAR (idempotent — append-only on the participant)
  console.log("uploading DAR", DAR_PATH, "...");
  await api("/v2/packages", await adminToken(), readFileSync(DAR_PATH), "application/octet-stream");
  console.log("DAR uploaded (package name", PKG_NAME + ")");

  // 2. allocate the 5 Cermin parties (reusing any that already exist)
  const issuer = await allocateParty(HINTS.issuer);
  const borrower = await allocateParty(HINTS.borrower);
  const poolOperator = await allocateParty(HINTS.pool);
  const guardAgent = await allocateParty(HINTS.guard);
  const oracle = await allocateParty(HINTS.oracle);
  console.log("\nPARTIES:");
  for (const [k, v] of Object.entries({ issuer, borrower, poolOperator, guardAgent, oracle })) console.log(`  ${k} = ${v}`);

  // 3. authorise the submitter(s)
  const allParties = [issuer, borrower, poolOperator, guardAgent, oracle];
  if (AUTH === "oauth2") {
    const uid = await grantOAuthUserRights(allParties);
    console.log(`\nRIGHTS: granted OAuth user "${uid}" CanActAs+CanReadAs on all 5 parties (single shared identity).`);
  } else {
    await ensureUser("cermin", borrower, allParties);
    await ensureUser("cermin-guard", guardAgent, [guardAgent]);
    await ensureUser("cermin-borrower", borrower, [borrower]);
    await ensureUser("cermin-oracle", oracle, [oracle]);
    console.log("\nUSERS: cermin (super), cermin-guard, cermin-borrower, cermin-oracle");
  }

  const instrumentId = "mUST-2030";

  // 4. build the pre-rescue scene (mirrors demoSetup) — GUARDED: steps 1-3 are
  // idempotent, but the scene creates are NOT (a second Loan/Vault/Policy for the
  // same borrower breaks the demo numbers), so skip if a Loan is already live.
  const existingLoans = await acs("cermin", borrower, "Cermin.Credit:Loan");
  if (existingLoans.length > 0) {
    console.log(
      `\nscene already seeded (${existingLoans.length} live Loan) — skipping scene creation.` +
      `\nFor a fresh scene: allocate fresh parties (new hints) or reset the ledger.`,
    );
    return;
  }
  console.log("\nseeding scene ...");
  const collateral = created(
    await submit([issuer, borrower], "cermin",
      create("Cermin.Assets:TreasuryToken", { issuer, owner: borrower, instrumentId, faceValue: "10000.0", couponRateBps: "450", maturity: "2030-01-01", lockedBy: null })),
    "Cermin.Assets:TreasuryToken");
  console.log("  TreasuryToken", collateral.contractId.slice(0, 16) + "...");

  const feed = created(
    await submit([oracle], "cermin",
      create("Cermin.Oracle:PriceFeed", { oracle, instrumentId, price: "1.0", subscribers: [borrower, guardAgent, poolOperator] })),
    "Cermin.Oracle:PriceFeed");
  console.log("  PriceFeed", feed.contractId.slice(0, 16) + "...");

  const liquidity = created(
    await submit([issuer, poolOperator], "cermin",
      create("Cermin.Assets:StableCoin", { issuer, owner: poolOperator, amount: "6000.0" })),
    "Cermin.Assets:StableCoin");

  const disbursement = created(
    await submit([poolOperator], "cermin",
      exercise("Cermin.Assets:StableCoin", liquidity.contractId, "TransferCoin", { newOwner: borrower })),
    "Cermin.Assets:StableCoinTransferProposal");

  const offer = created(
    await submit([poolOperator], "cermin",
      create("Cermin.Credit:LendingPoolOffer", {
        poolOperator, borrower, guardAgent, loanId: "loan-1", principal: "6000.0", rateBps: "500",
        collateralInstrumentId: instrumentId, collateralAmount: "10000.0", disbursementProposalCid: disbursement.contractId })),
    "Cermin.Credit:LendingPoolOffer");

  const loan = created(
    await submit([borrower], "cermin",
      exercise("Cermin.Credit:LendingPoolOffer", offer.contractId, "AcceptOffer", { collateralTokenCid: collateral.contractId })),
    "Cermin.Credit:Loan");
  console.log("  Loan", loan.contractId.slice(0, 16) + "...  args=", JSON.stringify(loan.createArgument));

  const policy = created(
    await submit([borrower], "cermin",
      create("Cermin.Guard:GuardPolicy", { borrower, guardAgent, triggerRatioBps: "13000", targetRatioBps: "14500", maxRepayPerEvent: "2000.0", couponSweep: true })),
    "Cermin.Guard:GuardPolicy");

  const vault = created(
    await submit([borrower], "cermin",
      create("Cermin.Guard:ShadowVault", { borrower, guardAgent, balance: "1500.0" })),
    "Cermin.Guard:ShadowVault");
  console.log("  GuardPolicy", policy.contractId.slice(0, 12) + "...  ShadowVault", vault.contractId.slice(0, 12) + "...");

  console.log("\nSEED OK. Loan.createArgument (numeric-encoding probe):");
  console.log(JSON.stringify(loan.createArgument, null, 1));
}
const [cmd, arg] = process.argv.slice(2);
const run = cmd === "price" ? () => priceCmd(arg) : cmd === "coupon" ? couponCmd : cmd === "verify" ? verifyCmd : main;
run().catch((e) => { console.error((cmd ?? "seed").toUpperCase() + " FAILED:", e.message); process.exit(1); });
