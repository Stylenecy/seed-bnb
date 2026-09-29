// The only module in the workspace that touches ORACLE_PRIVATE_KEY at
// runtime. Delegates to the SDK's `LocalOracleClient`, which is the single
// source of truth for the signing scheme (digest + EIP-191) so the SDK's
// HttpOracleClient and this service cannot drift.

import { Contract, JsonRpcProvider, getAddress } from 'ethers';
import { LocalOracleClient, type TransferProofRequest } from 'zeroarena';
import { oracleConfig } from './config.js';
import { HttpError } from './validate.js';

const INFT_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function transferNonce(uint256 tokenId) view returns (uint256)',
] as const;
let _provider: JsonRpcProvider | undefined;
function provider(): JsonRpcProvider {
  return (_provider ??= new JsonRpcProvider(oracleConfig.rpc));
}

let cached: LocalOracleClient | undefined;

function client(): LocalOracleClient {
  if (cached === undefined) {
    cached = new LocalOracleClient({ privateKey: oracleConfig.privateKey });
  }
  return cached;
}

/** Address derived from the configured key — log on boot; compare to the on-chain `ReencryptionOracle.signer()`. */
export function signerAddress(): string {
  return client().address;
}

/** Sign a parsed request, returning the 0x-hex EIP-191 signature. */
export async function signTransferProof(req: TransferProofRequest): Promise<string> {
  return client().signTransferProof(req);
}

/**
 * Refuse to sign unless the request is for this oracle's chain AND `from` is the
 * current on-chain owner of the token (M2). Stops the oracle from blind-signing
 * transfer proofs for arbitrary (token, from) pairs or foreign chains.
 */
export async function assertSignable(req: TransferProofRequest): Promise<void> {
  if (Number(req.chainId) !== oracleConfig.chainId) {
    throw new HttpError(400, `chainId ${req.chainId} != oracle chain ${oracleConfig.chainId}`);
  }
  const inft = new Contract(req.inftAddress, INFT_ABI, provider());
  let owner: string;
  try {
    owner = await (inft.ownerOf as (id: bigint) => Promise<string>)(req.tokenId);
  } catch {
    throw new HttpError(400, `ownerOf(${req.tokenId}) reverted — token may not exist at ${req.inftAddress}`);
  }
  if (getAddress(owner) !== getAddress(req.from)) {
    throw new HttpError(403, `from ${req.from} is not the owner of token ${req.tokenId} (owner ${owner})`);
  }

  // Don't sign a stale-nonce proof (M3): it must match the on-chain transferNonce.
  const onChainNonce = await (inft.transferNonce as (id: bigint) => Promise<bigint>)(req.tokenId);
  if (onChainNonce !== req.nonce) {
    throw new HttpError(409, `stale nonce: request ${req.nonce} != on-chain transferNonce ${onChainNonce} for token ${req.tokenId}`);
  }
}
