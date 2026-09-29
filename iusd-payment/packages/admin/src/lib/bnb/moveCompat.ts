/**
 * Move -> EVM compatibility table for the BNB Chain port.
 *
 * The app was written against the Initia Move modules `pay_v3` / `gift_v3`
 * (BCS-encoded MsgExecute messages + REST view functions). On BNB Chain the
 * same logic lives in the Solidity contracts IPayPool / IPayGiftPool
 * (packages/contracts/foundry). Instead of rewriting every call site, this
 * table maps each Move function to its Solidity twin so a thin adapter can:
 *   - decode the BCS args the existing builders already produce,
 *   - call the contract with viem/ethers,
 *   - format view results exactly like the Initia REST `view_functions` JSON.
 *
 * Amount convention: the app keeps 6-decimal "micro" units everywhere
 * (DB, UI, API). BSC stables use 18 decimals, so `amount` args are scaled
 * up by 10^(TOKEN_DECIMALS - 6) on the way in and down on the way out.
 *
 * Dependency-free on purpose. Identical copies live in:
 *   packages/app/src/lib/bnb/moveCompat.ts
 *   packages/admin/src/lib/bnb/moveCompat.ts
 *   packages/api/src/lib/bnb/moveCompat.ts
 * Keep them in sync.
 */

export type ArgType =
  | 'address'
  | 'u64' // plain integer (ids, ttl, bps, slot index)
  | 'amount' // token amount in 6-decimal micro units, scaled to token decimals on chain
  | 'bytes'
  | 'bytes[]'
  | 'string'
  | 'string[]'
  | 'bool'

export type RetType = ArgType | 'u8' | 'u8[]' | 'u64[]' | 'amount[]' | 'address[]'

export type ContractKind = 'pay' | 'gift'

export interface FnSpec {
  contract: ContractKind
  /** Solidity function name */
  fn: string
  /** Move arg types AFTER the pool object (if `pool`) */
  args: ArgType[]
  /** First Move arg is the pool `Object<...>`; dropped on EVM (one contract = one pool) */
  pool: boolean
  /** Return types (views only) */
  ret?: RetType[]
  /** Token approval the caller must grant before this write */
  approve?: 'deposit' | 'gift' | 'refund'
  /** Move-only setup call with no EVM equivalent (e.g. init_freeze_registry) */
  noop?: boolean
}

const p = (fn: string, args: ArgType[], extra: Partial<FnSpec> = {}): FnSpec => ({ contract: 'pay', fn, args, pool: true, ...extra })
const g = (fn: string, args: ArgType[], extra: Partial<FnSpec> = {}): FnSpec => ({ contract: 'gift', fn, args, pool: true, ...extra })

/** key = `${moduleName}::${functionName}` */
export const MOVE_TO_EVM: Record<string, FnSpec> = {
  // ── pay_v3 writes ─────────────────────────────────────────────
  'pay_v3::init_freeze_registry': p('', [], { pool: false, noop: true }),
  'pay_v3::add_freeze_admin': p('addFreezeAdmin', ['address'], { pool: false }),
  'pay_v3::remove_freeze_admin': p('removeFreezeAdmin', ['address'], { pool: false }),
  'pay_v3::freeze_address': p('freezeAddress', ['address'], { pool: false }),
  'pay_v3::unfreeze_address': p('unfreezeAddress', ['address'], { pool: false }),
  'pay_v3::deposit': p('deposit', ['bytes', 'amount', 'bytes', 'bytes', 'bytes', 'bytes', 'u64'], { approve: 'deposit' }),
  'pay_v3::claim': p('claim', ['bytes', 'bytes']),
  'pay_v3::sponsor_claim': p('sponsorClaim', ['bytes', 'bytes', 'address']),
  'pay_v3::revoke': p('revoke', ['bytes']),
  'pay_v3::refund': p('refund', ['bytes'], { approve: 'refund' }),
  'pay_v3::expire': p('expire', ['bytes']),
  'pay_v3::add_owner': p('addOwner', ['address']),
  'pay_v3::remove_owner': p('removeOwner', ['address']),
  'pay_v3::emergency_withdraw': p('emergencyWithdraw', ['address', 'amount']),
  'pay_v3::add_sponsor': p('addSponsor', ['address']),
  'pay_v3::remove_sponsor': p('removeSponsor', ['address']),
  'pay_v3::set_treasury': p('setTreasury', ['address']),
  'pay_v3::set_fee': p('setFee', ['u64', 'amount']),

  // ── pay_v3 views ──────────────────────────────────────────────
  'pay_v3::is_frozen': p('isFrozen', ['address'], { pool: false, ret: ['bool'] }),
  'pay_v3::is_freeze_admin': p('isFreezeAdmin', ['address'], { pool: false, ret: ['bool'] }),
  'pay_v3::get_payment': p('getPayment', ['bytes'], { ret: ['u8', 'amount', 'address', 'u64', 'u64'] }),
  'pay_v3::get_payment_full': p('getPaymentFull', ['bytes'], {
    ret: ['u8', 'amount', 'amount', 'address', 'address', 'u64', 'u64', 'bytes', 'bytes', 'bytes', 'bytes'],
  }),
  'pay_v3::get_pool_stats': p('getPoolStats', [], { ret: ['u64', 'amount', 'amount'] }),
  'pay_v3::get_pool_config': p('getPoolConfig', [], { ret: ['address', 'address', 'u64', 'amount'] }),
  'pay_v3::is_owner': p('isOwner', ['address'], { ret: ['bool'] }),
  'pay_v3::is_sponsor': p('isSponsor', ['address'], { ret: ['bool'] }),

  // ── gift_v3 writes ────────────────────────────────────────────
  'gift_v3::set_cap': g('setCap', ['amount']),
  'gift_v3::set_treasury': g('setTreasury', ['address']),
  'gift_v3::add_sponsor': g('addSponsor', ['address']),
  'gift_v3::remove_sponsor': g('removeSponsor', ['address']),
  'gift_v3::add_owner': g('addOwner', ['address']),
  'gift_v3::remove_owner': g('removeOwner', ['address']),
  'gift_v3::emergency_withdraw': g('emergencyWithdraw', ['address', 'amount']),
  'gift_v3::register_box': g('registerBox', ['u64', 'string', 'amount', 'u64', 'string[]', 'bool']),
  'gift_v3::update_box': g('updateBox', ['u64', 'string', 'amount', 'u64', 'string[]', 'bool']),
  'gift_v3::remove_box': g('removeBox', ['u64']),
  'gift_v3::list_box': g('listBox', ['u64']),
  'gift_v3::delist_box': g('delistBox', ['u64']),
  'gift_v3::send_gift': g('sendGift', ['u64', 'bytes', 'bytes', 'bytes', 'amount', 'u64'], { approve: 'gift' }),
  'gift_v3::send_gift_group': g('sendGiftGroup', ['u64', 'bytes', 'u64', 'amount', 'bytes', 'bytes[]', 'u64'], { approve: 'gift' }),
  'gift_v3::send_gift_group_equal': g('sendGiftGroupEqual', ['u64', 'bytes', 'u64', 'amount', 'bytes[]', 'u64'], { approve: 'gift' }),
  'gift_v3::claim_direct': g('claimDirect', ['bytes', 'bytes']),
  'gift_v3::sponsor_claim_direct': g('sponsorClaimDirect', ['bytes', 'bytes', 'address']),
  'gift_v3::claim_slot': g('claimSlot', ['bytes', 'u64', 'bytes', 'bytes']),
  'gift_v3::sponsor_claim_slot': g('sponsorClaimSlot', ['bytes', 'u64', 'bytes', 'bytes', 'address']),
  'gift_v3::expire_and_refund': g('expireAndRefund', ['bytes']),

  // ── gift_v3 views ─────────────────────────────────────────────
  'gift_v3::get_box_ids': g('getBoxIds', [], { ret: ['u64[]'] }),
  'gift_v3::get_box': g('getBox', ['u64'], { ret: ['u64', 'string', 'amount', 'u64', 'string[]', 'bool'] }),
  'gift_v3::is_box_listed': g('isBoxListed', ['u64'], { ret: ['bool'] }),
  'gift_v3::get_box_count': g('getBoxCount', [], { ret: ['u64'] }),
  'gift_v3::get_packet': g('getPacket', ['bytes'], {
    ret: ['bytes', 'u64', 'address', 'u8', 'bytes', 'amount', 'u64', 'u64', 'amount', 'u8', 'u64', 'u64'],
  }),
  'gift_v3::get_recipient_blob': g('getRecipientBlob', ['bytes'], { ret: ['bytes', 'bytes'] }),
  'gift_v3::get_slot': g('getSlot', ['bytes', 'u64'], { ret: ['amount', 'u8', 'address', 'u64'] }),
  'gift_v3::get_slots_summary': g('getSlotsSummary', ['bytes'], { ret: ['u8[]', 'address[]', 'amount[]'] }),
  'gift_v3::get_pool_stats': g('getPoolStats', [], { ret: ['address', 'address', 'amount', 'u64', 'amount', 'amount'] }),
  'gift_v3::get_pool_config': g('getPoolConfig', [], { ret: ['address', 'address', 'amount'] }),
  'gift_v3::is_owner': g('isOwner', ['address'], { ret: ['bool'] }),
  'gift_v3::is_sponsor': g('isSponsor', ['address'], { ret: ['bool'] }),
}

/** Human-readable ABIs (accepted by both viem `parseAbi` and ethers `Interface`). */
export const PAY_ABI = [
  'function addFreezeAdmin(address)',
  'function removeFreezeAdmin(address)',
  'function freezeAddress(address)',
  'function unfreezeAddress(address)',
  'function deposit(bytes paymentId, uint256 amount, bytes ciphertext, bytes keyForSender, bytes keyForRecipient, bytes claimKeyHash, uint256 ttlSeconds)',
  'function claim(bytes paymentId, bytes claimKey)',
  'function sponsorClaim(bytes paymentId, bytes claimKey, address recipient)',
  'function revoke(bytes paymentId)',
  'function refund(bytes paymentId)',
  'function expire(bytes paymentId)',
  'function addOwner(address)',
  'function removeOwner(address)',
  'function emergencyWithdraw(address to, uint256 amount)',
  'function addSponsor(address)',
  'function removeSponsor(address)',
  'function setTreasury(address)',
  'function setFee(uint256 feeBps, uint256 feeCap)',
  'function isFrozen(address) view returns (bool)',
  'function isFreezeAdmin(address) view returns (bool)',
  'function getPayment(bytes) view returns (uint8, uint256, address, uint64, uint64)',
  'function getPaymentFull(bytes) view returns (uint8, uint256, uint256, address, address, uint64, uint64, bytes, bytes, bytes, bytes)',
  'function getPoolStats() view returns (uint256, uint256, uint256)',
  'function getPoolConfig() view returns (address, address, uint256, uint256)',
  'function isOwner(address) view returns (bool)',
  'function isSponsor(address) view returns (bool)',
  'error NotAuthorized()',
  'error AlreadyExists()',
  'error InvalidTransition()',
  'error PaymentNotFound()',
  'error ClaimWindowClosed()',
  'error PaymentNotExpired()',
  'error InvalidKey()',
  'error InvalidAmount()',
  'error NotSender()',
  'error NotSponsor()',
  'error AccountFrozen()',
] as const

export const GIFT_ABI = [
  'function setCap(uint256)',
  'function setTreasury(address)',
  'function addSponsor(address)',
  'function removeSponsor(address)',
  'function addOwner(address)',
  'function removeOwner(address)',
  'function emergencyWithdraw(address to, uint256 amount)',
  'function registerBox(uint64 boxId, string name, uint256 amount, uint256 feeBps, string[] urls, bool enabled)',
  'function updateBox(uint64 boxId, string name, uint256 amount, uint256 feeBps, string[] urls, bool enabled)',
  'function removeBox(uint64 boxId)',
  'function listBox(uint64 boxId)',
  'function delistBox(uint64 boxId)',
  'function sendGift(uint64 boxId, bytes packetId, bytes recipientBlob, bytes claimKeyHash, uint256 amount, uint256 ttl)',
  'function sendGiftGroup(uint64 boxId, bytes packetId, uint256 numSlots, uint256 amount, bytes allocationSeed, bytes[] slotHashes, uint256 ttl)',
  'function sendGiftGroupEqual(uint64 boxId, bytes packetId, uint256 numSlots, uint256 amount, bytes[] slotHashes, uint256 ttl)',
  'function claimDirect(bytes packetId, bytes claimKey)',
  'function sponsorClaimDirect(bytes packetId, bytes claimKey, address recipient)',
  'function claimSlot(bytes packetId, uint256 slotIndex, bytes slotSecret, bytes proof)',
  'function sponsorClaimSlot(bytes packetId, uint256 slotIndex, bytes slotSecret, bytes proof, address recipient)',
  'function expireAndRefund(bytes packetId)',
  'function quoteGift(uint64 boxId, uint256 amount) view returns (uint256 giftAmount, uint256 fee)',
  'function getBoxIds() view returns (uint64[])',
  'function getBox(uint64) view returns (uint64, string, uint256, uint256, string[], bool)',
  'function isBoxListed(uint64) view returns (bool)',
  'function getBoxCount() view returns (uint256)',
  'function getPacket(bytes) view returns (bytes, uint64, address, uint8, bytes, uint256, uint64, uint64, uint256, uint8, uint64, uint64)',
  'function getRecipientBlob(bytes) view returns (bytes, bytes)',
  'function getSlot(bytes, uint256) view returns (uint256, uint8, address, uint64)',
  'function getSlotsSummary(bytes) view returns (uint8[], address[], uint256[])',
  'function getPoolStats() view returns (address, address, uint256, uint256, uint256, uint256)',
  'function getPoolConfig() view returns (address, address, uint256)',
  'function isOwner(address) view returns (bool)',
  'function isSponsor(address) view returns (bool)',
  'error NotAuthorized()',
  'error NotSponsor()',
  'error BoxNotFound()',
  'error BoxDisabled()',
  'error BoxExists()',
  'error AmountTooLow()',
  'error AmountTooHigh()',
  'error TooManySlots()',
  'error PacketNotFound()',
  'error PacketExpired()',
  'error PacketNotExpired()',
  'error SlotNotOpen()',
  'error SlotOutOfRange()',
  'error InvalidSecret()',
  'error InvalidProof()',
  'error DuplicatePacket()',
  'error WrongMode()',
  'error ZeroSlots()',
  'error InvalidFee()',
] as const

export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
] as const

// ── Amount scaling ──────────────────────────────────────────────

export const MICRO_DECIMALS = 6

export function amountScale(tokenDecimals: number): bigint {
  const d = tokenDecimals - MICRO_DECIMALS
  return d >= 0 ? 10n ** BigInt(d) : 1n
}

export const microToToken = (micro: bigint, tokenDecimals: number) => micro * amountScale(tokenDecimals)
export const tokenToMicro = (wei: bigint, tokenDecimals: number) => wei / amountScale(tokenDecimals)

// ── Hex / address helpers ───────────────────────────────────────

export function bytesToHex(b: Uint8Array): `0x${string}` {
  let s = '0x'
  for (const x of b) s += x.toString(16).padStart(2, '0')
  return s as `0x${string}`
}

export function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/i, '')
  const out = new Uint8Array(h.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16)
  return out
}

/** Accepts 0x20-byte, 0x32-byte (Move-padded) or unprefixed hex; returns a 20-byte 0x address. */
export function toEvmAddress(addr: string): `0x${string}` {
  const h = addr.replace(/^0x/i, '').toLowerCase()
  return ('0x' + h.padStart(40, '0').slice(-40)) as `0x${string}`
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob === 'function') {
    const bin = atob(b64)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  }
  // Node without atob
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Uint8Array((globalThis as any).Buffer.from(b64, 'base64'))
}

// ── BCS decoding (the existing builders emit BCS) ───────────────

class Reader {
  private i = 0
  private b: Uint8Array
  constructor(b: Uint8Array) {
    this.b = b
  }
  uleb(): number {
    let v = 0
    let shift = 0
    for (;;) {
      const byte = this.b[this.i++]
      v |= (byte & 0x7f) << shift
      if ((byte & 0x80) === 0) return v
      shift += 7
    }
  }
  take(n: number): Uint8Array {
    const out = this.b.slice(this.i, this.i + n)
    this.i += n
    return out
  }
  u64(): bigint {
    const b = this.take(8)
    let v = 0n
    for (let k = 7; k >= 0; k--) v = (v << 8n) | BigInt(b[k])
    return v
  }
  vec(): Uint8Array {
    return this.take(this.uleb())
  }
  str(): string {
    return new TextDecoder().decode(this.vec())
  }
}

export type DecodedArg = string | bigint | boolean | string[] | `0x${string}`[]

/** Decode one BCS-encoded Move arg (Uint8Array or base64 string). */
export function decodeBcsArg(type: ArgType, raw: Uint8Array | string, tokenDecimals: number): DecodedArg {
  const bytes = typeof raw === 'string' ? base64ToBytes(raw) : raw
  const r = new Reader(bytes)
  switch (type) {
    case 'address':
      return toEvmAddress(bytesToHex(bytes))
    case 'u64':
      return r.u64()
    case 'amount':
      return microToToken(r.u64(), tokenDecimals)
    case 'bool':
      return bytes[0] === 1
    case 'bytes':
      return bytesToHex(r.vec())
    case 'string':
      return r.str()
    case 'bytes[]': {
      const n = r.uleb()
      const out: `0x${string}`[] = []
      for (let k = 0; k < n; k++) out.push(bytesToHex(r.vec()))
      return out
    }
    case 'string[]': {
      const n = r.uleb()
      const out: string[] = []
      for (let k = 0; k < n; k++) out.push(r.str())
      return out
    }
  }
}

/**
 * Normalise a JS-level arg (backend `MoveArg` values, JSON args) to what the
 * EVM call expects.
 */
export function normalizeArg(type: ArgType, v: unknown, tokenDecimals: number): DecodedArg {
  switch (type) {
    case 'address':
      return toEvmAddress(String(v))
    case 'u64':
      return BigInt(v as string | number | bigint)
    case 'amount':
      return microToToken(BigInt(v as string | number | bigint), tokenDecimals)
    case 'bool':
      return v === true || v === 'true'
    case 'bytes': {
      const s = String(v)
      return (s.startsWith('0x') ? s : '0x' + s).toLowerCase() as `0x${string}`
    }
    case 'bytes[]':
      return (v as string[]).map(x => (x.startsWith('0x') ? x : '0x' + x).toLowerCase() as `0x${string}`)
    case 'string':
      return String(v)
    case 'string[]':
      return (v as string[]).map(String)
  }
}

/** Format an EVM view result like the Initia REST view JSON (`JSON.parse(res.data)`). */
export function formatViewResult(spec: FnSpec, result: unknown, tokenDecimals: number): unknown {
  const ret = spec.ret ?? []
  const values = ret.length === 1 ? [result] : (result as unknown[])
  const fmt = (t: RetType, v: unknown): unknown => {
    switch (t) {
      case 'u8':
        return Number(v)
      case 'u64':
        return String(v)
      case 'amount':
        return String(tokenToMicro(BigInt(v as bigint), tokenDecimals))
      case 'address':
        return String(v).toLowerCase()
      case 'bytes':
        return String(v).toLowerCase()
      case 'bool':
        return Boolean(v)
      case 'string':
        return String(v)
      case 'string[]':
        return (v as string[]).map(String)
      case 'u8[]':
        return (v as unknown[]).map(Number)
      case 'u64[]':
        return (v as unknown[]).map(x => String(x))
      case 'amount[]':
        return (v as unknown[]).map(x => String(tokenToMicro(BigInt(x as bigint), tokenDecimals)))
      case 'address[]':
        return (v as string[]).map(x => x.toLowerCase())
      default:
        return v
    }
  }
  const out = ret.map((t, i) => fmt(t, values[i]))
  return ret.length === 1 ? out[0] : out
}

/** Parse `/initia/move/v1/accounts/<addr>/modules/<module>/view_functions/<fn>` */
export function parseViewUrl(url: string): { moduleName: string; functionName: string } | null {
  const m = url.match(/\/initia\/move\/v1\/accounts\/[^/]+\/modules\/([a-z0-9_]+)\/view_functions\/([a-z0-9_]+)/i)
  if (m) return { moduleName: m[1], functionName: m[2] }
  // older variant used in relayer/index.ts: /accounts/<addr>/view_functions/<module>/<fn>
  const m2 = url.match(/\/initia\/move\/v1\/accounts\/[^/]+\/view_functions\/([a-z0-9_]+)\/([a-z0-9_]+)/i)
  if (m2) return { moduleName: m2[1], functionName: m2[2] }
  return null
}

export function specFor(moduleName: string, functionName: string): FnSpec | undefined {
  return MOVE_TO_EVM[`${moduleName}::${functionName}`]
}
