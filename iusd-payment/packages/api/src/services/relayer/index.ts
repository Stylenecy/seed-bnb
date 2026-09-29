/**
 * Multi-relayer service entrypoint.
 *
 * Creates three independent RelayerPools:
 *   - payPool:   for pay auto-claim + fee grants
 *   - giftPool:  for gift claim sponsorship
 *   - sweepPool: for expiry sweep
 *
 * Each pool has N instances, each with its own wallet and serial queue.
 * Configure via env vars: RELAYER_PAY_COUNT, RELAYER_GIFT_COUNT, RELAYER_SWEEP_COUNT
 */

import { contractFor } from '../../lib/bnb/evm'
import { RelayerPool } from '../../lib/RelayerPool'
import {
  RELAYER_MNEMONIC,
  RELAYER_PAY_COUNT,
  RELAYER_GIFT_COUNT,
  RELAYER_SWEEP_COUNT,
  RELAYER_MNEMONICS_PAY,
  RELAYER_MNEMONICS_GIFT,
  RELAYER_MNEMONIC_SWEEP,
} from '../../shared/config'
import { getPoolAddress, getGiftPoolAddress } from '../../shared/contract-config'

let _payPool: RelayerPool | null = null
let _giftPool: RelayerPool | null = null
let _sweepPool: RelayerPool | null = null
let started = false

function buildPool(
  explicitMnemonics: string,
  count: number,
  baseMnemonic: string,
  namePrefix: string,
  accountIndex: number,
): RelayerPool {
  if (explicitMnemonics) {
    const mnemonics = explicitMnemonics.split(',').map(m => m.trim()).filter(Boolean)
    return RelayerPool.fromMnemonics(mnemonics, namePrefix)
  }
  return RelayerPool.fromMnemonic(baseMnemonic, count, namePrefix, accountIndex)
}

export async function startRelayerService(): Promise<void> {
  if (started) return

  if (!RELAYER_MNEMONIC) {
    console.warn('[Relayer] No RELAYER_MNEMONIC set, all sponsorship disabled')
    started = true
    return
  }

  _payPool = buildPool(RELAYER_MNEMONICS_PAY, RELAYER_PAY_COUNT, RELAYER_MNEMONIC, 'pay', 10)
  _giftPool = buildPool(RELAYER_MNEMONICS_GIFT, RELAYER_GIFT_COUNT, RELAYER_MNEMONIC, 'gift', 20)
  _sweepPool = buildPool(RELAYER_MNEMONIC_SWEEP, RELAYER_SWEEP_COUNT, RELAYER_MNEMONIC, 'sweep', 30)

  started = true

  // Print relayer info
  console.log(`\n[Relayer] Initialized:`)
  console.log(`  Pay pool:   ${_payPool.size} instance(s)`)
  _payPool.getAddresses().forEach((a, i) => console.log(`    pay-${i}: ${a}`))
  console.log(`  Gift pool:  ${_giftPool.size} instance(s)`)
  _giftPool.getAddresses().forEach((a, i) => console.log(`    gift-${i}: ${a}`))
  console.log(`  Sweep pool: ${_sweepPool.size} instance(s)`)
  _sweepPool.getAddresses().forEach((a, i) => console.log(`    sweep-${i}: ${a}`))
  console.log()

  // Check sponsor registration
  await checkSponsorStatus()
}

export function getPayPool(): RelayerPool {
  if (!_payPool) throw new Error('Relayer service not started')
  return _payPool
}

export function getGiftPool(): RelayerPool {
  if (!_giftPool) throw new Error('Relayer service not started')
  return _giftPool
}

export function getSweepPool(): RelayerPool {
  if (!_sweepPool) throw new Error('Relayer service not started')
  return _sweepPool
}

export function getRelayerServiceAddress(): string {
  if (_payPool) return _payPool.getAddresses()[0]
  return process.env.RELAYER_ADDRESS || ''
}

/** Get all unique relayer addresses across all pools. */
export function getAllRelayerAddresses(): string[] {
  const addrs = new Set<string>()
  if (_payPool) _payPool.getAddresses().forEach(a => addrs.add(a))
  if (_giftPool) _giftPool.getAddresses().forEach(a => addrs.add(a))
  if (_sweepPool) _sweepPool.getAddresses().forEach(a => addrs.add(a))
  return [...addrs]
}

// ── Sponsor Registration Check ──────────────────────────────────

async function checkSponsorForPool(
  poolType: string,
  poolAddress: string,
  moduleName: string,
  addresses: string[],
): Promise<void> {
  const unregistered: string[] = []

  for (const addr of addresses) {
    try {
      const kind = moduleName === 'pay_v3' ? 'pay' : 'gift'
      const isSponsor = await contractFor(kind).isSponsor(addr) as boolean
      if (!isSponsor) unregistered.push(addr)
    } catch {
      // Can't verify, assume not registered
      unregistered.push(addr)
    }
  }

  if (unregistered.length > 0) {
    console.warn(`\n[Relayer] ⚠️  ${unregistered.length} ${poolType} relayer(s) NOT registered as sponsor:`)
    for (const addr of unregistered) {
      console.warn(`  ${addr}`)
    }
    console.warn(`\n  Register with (contract owner):`)
    for (const addr of unregistered) {
      console.warn(`  cast send ${poolAddress} "addSponsor(address)" ${addr} --rpc-url $BSC_RPC_URL --private-key $DEPLOYER_PK`)
    }
  }
}

async function checkSponsorStatus(): Promise<void> {
  if (!_payPool || !_giftPool || !_sweepPool) return

  const payPoolAddr = getPoolAddress()
  const giftPoolAddr = getGiftPoolAddress()

  // All relayer addresses that need pay_v3 sponsor
  const payAddrs = [...new Set([..._payPool.getAddresses()])]
  // All relayer addresses that need gift_v3 sponsor
  const giftAddrs = [...new Set([..._giftPool.getAddresses(), ..._sweepPool.getAddresses()])]

  if (payPoolAddr) {
    await checkSponsorForPool('pay', payPoolAddr, 'pay_v3', payAddrs)
  }
  if (giftPoolAddr) {
    await checkSponsorForPool('gift', giftPoolAddr, 'gift_v3', giftAddrs)
  }
}
