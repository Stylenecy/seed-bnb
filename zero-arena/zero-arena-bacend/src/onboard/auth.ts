// Onboard auth — recovers the owner address from an EIP-191 signature and
// verifies (a) the signer owns the tokenId on-chain, (b) the signer has
// authorized our operator wallet to update the live cert.
//
// SECURITY (H4): the signed payload binds NOT just {action,tokenId,nonce,
// deadline} but also the agent code hash + every run parameter. Without that
// binding the owner's signature was a blank cheque — anyone replaying it (or a
// malicious intermediary) could run arbitrary agent code / params under the
// token. The per-owner nonce is now consumed so a captured payload can't be
// replayed inside its deadline window.
//
// The signed message is the canonical JSON from `digestFor()`. The SDK
// (OnboardClient) and the FE (lib/be/onboard.ts) MUST build the identical
// string — sorted keys, no whitespace, every value a string.

import { Contract, JsonRpcProvider, Wallet, getAddress, keccak256, toUtf8Bytes, verifyMessage } from 'ethers';
import { onboardConfig } from './config.js';

const INFT_ABI = ['function ownerOf(uint256 tokenId) view returns (address)'] as const;
// LiveCertificate.authorizedUpdaters is per-token (H2): the owner calls
// authorizeUpdater(tokenId, operator, true) on-chain to delegate. We verify
// that on-chain consent here, in addition to recovering the owner from the
// signed payload.
const LIVE_CERT_ABI = [
  'function authorizedUpdaters(uint256 tokenId, address operator) view returns (bool)',
] as const;

export type OnboardAction = 'onboard' | 'offboard';

export interface SignedPayload {
  action: OnboardAction;
  tokenId: string; // decimal string for uint256 safety
  nonce: string; // random hex / decimal — consumed once per signer
  deadline: string; // unix seconds, string
  // Present iff action === 'onboard'. Binds the run to the owner's signature.
  agentHash?: string; // 0x keccak256(utf8(agent source plaintext))
  genesisHash?: string;
  symbol?: string;
  interval?: string;
  market?: 'spot' | 'perp';
  barsPerEpoch?: string;
  initialBalance?: string;
  leverage?: string;
  feeBps?: string;
  slippageBps?: string;
}

/**
 * Canonical message the owner signs. Sorted keys, no whitespace, every value
 * coerced to a string — so the digest is independent of object construction
 * order across the BE / SDK / FE. `undefined` fields are dropped (offboard
 * payloads carry only the 4 base fields).
 */
export function digestFor(payload: SignedPayload): string {
  const obj: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined && v !== null) obj[k] = String(v);
  }
  return JSON.stringify(obj, Object.keys(obj).sort());
}

/** keccak256 over the UTF-8 bytes of the agent source plaintext. */
export function hashAgentSource(plaintext: string): string {
  return keccak256(toUtf8Bytes(plaintext));
}

export function recoverSigner(payload: SignedPayload, signature: string): string {
  return getAddress(verifyMessage(digestFor(payload), signature));
}

// ─── Replay protection ──────────────────────────────────────────────────────
// In-memory used-nonce set keyed by `${signer}:${nonce}`, holding each nonce
// until its deadline lapses (after which checkDeadline() rejects the payload
// anyway). The onboard service runs as a single daemon, so in-memory is
// sufficient; a multi-instance deployment should back this with the persistent
// volume or chain.
const _usedNonces = new Map<string, number>();

/** Returns false if (signer, nonce) was already consumed within its window. */
export function consumeNonce(signer: string, nonce: string, deadlineSec: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (_usedNonces.size > 10_000) {
    for (const [k, exp] of _usedNonces) if (exp < now) _usedNonces.delete(k);
  }
  const key = `${signer.toLowerCase()}:${nonce}`;
  const existing = _usedNonces.get(key);
  if (existing !== undefined && existing >= now) return false;
  _usedNonces.set(key, deadlineSec);
  return true;
}

/** Cached operator address (derived once per process from the operator key). */
let _operatorAddress: string | undefined;
export function operatorAddress(): string {
  if (_operatorAddress) return _operatorAddress;
  const w = new Wallet(onboardConfig.operatorPrivateKey);
  _operatorAddress = getAddress(w.address);
  return _operatorAddress;
}

/** Verify: signer owns the tokenId AND has authorized our operator wallet. */
export async function verifyOwnerAndAuthorization(
  tokenId: bigint,
  expectedOwner: string,
): Promise<{ ok: boolean; reason?: string }> {
  const provider = new JsonRpcProvider(onboardConfig.rpc);
  const inft = new Contract(onboardConfig.inftAddress, INFT_ABI, provider);
  const lc = new Contract(onboardConfig.liveCertAddress, LIVE_CERT_ABI, provider);

  let onChainOwner: string;
  try {
    const ownerOfFn = inft.ownerOf as (id: bigint) => Promise<string>;
    onChainOwner = getAddress(await ownerOfFn(tokenId));
  } catch (err: unknown) {
    return { ok: false, reason: `ownerOf(${tokenId}) reverted: ${String(err)}` };
  }
  if (onChainOwner !== getAddress(expectedOwner)) {
    return { ok: false, reason: `signer ${expectedOwner} is not the iNFT owner (chain says ${onChainOwner})` };
  }

  const op = operatorAddress();
  let authorized: boolean;
  try {
    const authFn = lc.authorizedUpdaters as (tokenId: bigint, operator: string) => Promise<boolean>;
    authorized = await authFn(tokenId, op);
  } catch (err: unknown) {
    return { ok: false, reason: `authorizedUpdaters check reverted: ${String(err)}` };
  }
  if (!authorized) {
    return {
      ok: false,
      reason: `operator ${op} is not authorized for token ${tokenId} — owner must call authorizeUpdater(${tokenId}, ${op}, true) first`,
    };
  }

  return { ok: true };
}
