// Request parsing + validation for the onboard service. Narrow runtime checks,
// no frameworks.
//
// H4: every run parameter now lives INSIDE the signed payload (so the owner's
// signature binds them) plus `agentHash`. The request body carries only the
// signed `payload`, the `signature`, and the opaque `agentSource` bytes — whose
// keccak the server checks against `payload.agentHash`. Values are kept exactly
// as received (no transforms) so signature recovery is byte-stable.

import type { OnboardAction, SignedPayload } from './auth.js';
import { type EncryptedAgentBundle, isEncryptedBundle } from './crypto.js';

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function asString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (typeof v !== 'string' || v.length === 0) {
    throw new HttpError(400, `field "${key}" must be a non-empty string`);
  }
  return v;
}

function asPositiveBigInt(s: string, field: string): bigint {
  try {
    const n = BigInt(s);
    if (n <= 0n) throw new Error('non-positive');
    return n;
  } catch {
    throw new HttpError(400, `field "${field}" must be a decimal positive uint256 string`);
  }
}

function asAction(s: string): OnboardAction {
  if (s === 'onboard' || s === 'offboard') return s;
  throw new HttpError(400, `field "action" must be "onboard" or "offboard"`);
}

function asHex32(obj: Record<string, unknown>, field: string): `0x${string}` {
  const s = asString(obj, field);
  if (!/^0x[0-9a-fA-F]{64}$/.test(s)) {
    throw new HttpError(400, `field "${field}" must be a 0x-prefixed 32-byte hex`);
  }
  return s as `0x${string}`;
}

function asMarket(obj: Record<string, unknown>): 'spot' | 'perp' {
  const s = asString(obj, 'market');
  if (s === 'spot' || s === 'perp') return s;
  throw new HttpError(400, `field "market" must be "spot" or "perp"`);
}

/** Read a numeric field that may arrive as a string or JSON number; keep its
 *  exact string form (what the client signed) but reject non-finite values. */
function asNumericString(obj: Record<string, unknown>, field: string): string {
  const v = obj[field];
  if (typeof v !== 'string' && typeof v !== 'number') {
    throw new HttpError(400, `field "${field}" must be a number or numeric string`);
  }
  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw new HttpError(400, `field "${field}" must be a finite number`);
  }
  return String(v);
}

export interface OnboardRequest {
  payload: SignedPayload; // action === 'onboard', fully populated with bound fields
  signature: string;
  /** Either plaintext source (legacy) or an ECIES bundle to decrypt server-side. */
  agentSource: string | EncryptedAgentBundle;
}

export interface OffboardRequest {
  payload: SignedPayload; // action === 'offboard', base fields only
  signature: string;
}

function asObject(v: unknown, label: string): Record<string, unknown> {
  if (v === null || typeof v !== 'object') {
    throw new HttpError(400, `"${label}" must be an object`);
  }
  return v as Record<string, unknown>;
}

/** Base 4 fields shared by both actions. */
function parseBasePayload(o: Record<string, unknown>): SignedPayload {
  const action = asAction(asString(o, 'action'));
  const tokenId = asString(o, 'tokenId');
  asPositiveBigInt(tokenId, 'payload.tokenId');
  return { action, tokenId, nonce: asString(o, 'nonce'), deadline: asString(o, 'deadline') };
}

export function parseOnboard(raw: unknown): OnboardRequest {
  const o = asObject(raw, 'body');
  const po = asObject(o.payload, 'payload');
  const base = parseBasePayload(po);
  if (base.action !== 'onboard') {
    throw new HttpError(400, `payload.action must be "onboard"`);
  }

  // Bound run parameters — all required, kept verbatim for signature recovery.
  const payload: SignedPayload = {
    ...base,
    agentHash: asHex32(po, 'agentHash'),
    genesisHash: asHex32(po, 'genesisHash'),
    symbol: asString(po, 'symbol'),
    interval: asString(po, 'interval'),
    market: asMarket(po),
    barsPerEpoch: asNumericString(po, 'barsPerEpoch'),
    initialBalance: asNumericString(po, 'initialBalance'),
    leverage: asNumericString(po, 'leverage'),
    feeBps: asNumericString(po, 'feeBps'),
    slippageBps: asNumericString(po, 'slippageBps'),
  };

  const rawAgent = o.agentSource;
  let agentSource: string | EncryptedAgentBundle;
  if (typeof rawAgent === 'string' && rawAgent.length > 0) {
    agentSource = rawAgent;
  } else if (isEncryptedBundle(rawAgent)) {
    agentSource = rawAgent;
  } else {
    throw new HttpError(
      400,
      `field "agentSource" must be a non-empty string OR an encrypted bundle { scheme, blob }`,
    );
  }

  return { payload, signature: asString(o, 'signature'), agentSource };
}

export function parseOffboard(raw: unknown): OffboardRequest {
  const o = asObject(raw, 'body');
  const payload = parseBasePayload(asObject(o.payload, 'payload'));
  if (payload.action !== 'offboard') {
    throw new HttpError(400, `payload.action must be "offboard"`);
  }
  return { payload, signature: asString(o, 'signature') };
}

export function checkDeadline(deadline: string): void {
  const d = Number(deadline);
  if (!Number.isFinite(d)) {
    throw new HttpError(400, `payload.deadline must be a number string`);
  }
  if (d < Math.floor(Date.now() / 1000)) {
    throw new HttpError(400, `payload expired (deadline=${d}, now=${Math.floor(Date.now() / 1000)})`);
  }
}
