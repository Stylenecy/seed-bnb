/**
 * BNB Chain (BSC) backend adapter.
 *
 * - `executeMoveOnEvm()` runs the relayer's Move-shaped calls
 *   (`{ moduleName, functionName, args: MoveArg[] }`) against the Solidity
 *   IPayPool / IPayGiftPool contracts with an ethers wallet.
 * - `installBnbFetchShim()` answers the legacy Initia REST URLs still used
 *   across routes (Move view functions, bank balances, tx lookup, account
 *   lookup, feegrant) from BSC, in the same JSON shape.
 *
 * Env: EVM_CHAIN_ID (97|56), BSC_RPC_URL, IPAY_POOL_ADDRESS, GIFT_POOL_ADDRESS,
 *      IUSD_FA (ERC-20 token address), TOKEN_DECIMALS (18).
 */
import { ethers } from 'ethers'
import { bech32 } from 'bech32'
import {
  ERC20_ABI,
  GIFT_ABI,
  PAY_ABI,
  decodeBcsArg,
  formatViewResult,
  normalizeArg,
  parseViewUrl,
  specFor,
  toEvmAddress,
  tokenToMicro,
  type ContractKind,
} from './moveCompat'

export const EVM_CHAIN_ID = Number(process.env.EVM_CHAIN_ID || '97')
export const BSC_RPC_URL =
  process.env.BSC_RPC_URL ||
  (EVM_CHAIN_ID === 56 ? 'https://bsc-dataseed.bnbchain.org' : 'https://data-seed-prebsc-1-s1.bnbchain.org:8545')
export const TOKEN_DECIMALS = Number(process.env.TOKEN_DECIMALS || '18')

/** Accepts 0x (20 or 32-byte) or legacy init1… bech32 (same key bytes) and returns a 0x address. */
export function anyToEvm(a: string): `0x${string}` {
  if (/^init1/i.test(a)) {
    const { words } = bech32.decode(a)
    return toEvmAddress(Buffer.from(bech32.fromWords(words)).toString('hex'))
  }
  return toEvmAddress(a)
}

const addr = (v: string | undefined) => (v ? toEvmAddress(v) : '')
export const PAY_POOL = () => addr(process.env.IPAY_POOL_ADDRESS)
export const GIFT_POOL = () => addr(process.env.GIFT_POOL_ADDRESS)
export const TOKEN = () => addr(process.env.IUSD_FA)

export const provider = new ethers.JsonRpcProvider(BSC_RPC_URL, EVM_CHAIN_ID, {
  staticNetwork: true,
  cacheTimeout: -1, // no request cache: the relayer sends back-to-back txs and needs fresh nonces
})

export const payIface = new ethers.Interface(PAY_ABI as unknown as string[])
export const giftIface = new ethers.Interface(GIFT_ABI as unknown as string[])
export const erc20Iface = new ethers.Interface(ERC20_ABI as unknown as string[])

export function contractFor(kind: ContractKind, runner: ethers.ContractRunner = provider): ethers.Contract {
  return kind === 'pay'
    ? new ethers.Contract(PAY_POOL(), payIface, runner)
    : new ethers.Contract(GIFT_POOL(), giftIface, runner)
}

export interface EvmTxResult {
  success: boolean
  txHash?: string
  error?: string
}

export interface MoveCall {
  moduleName: string
  functionName: string
  args: Array<{ type: string; value: unknown }>
}

function revertReason(e: unknown): string {
  const err = e as { shortMessage?: string; reason?: string; message?: string; revert?: { name?: string }; data?: string }
  if (err?.revert?.name) return err.revert.name
  if (typeof err?.data === 'string' && err.data.length >= 10) {
    for (const iface of [payIface, giftIface]) {
      try {
        const parsed = iface.parseError(err.data)
        if (parsed) return parsed.name
      } catch {
        /* not this contract's error */
      }
    }
  }
  return err?.reason || err?.shortMessage || err?.message || String(e)
}

/** Execute a Move-shaped call on BSC. `signer` must be connected to `provider`. */
export async function executeMoveOnEvm(signer: ethers.Signer, call: MoveCall): Promise<EvmTxResult> {
  const spec = specFor(call.moduleName, call.functionName)
  if (!spec) return { success: false, error: `Unsupported on BNB Chain: ${call.moduleName}::${call.functionName}` }
  if (spec.noop) return { success: true, txHash: '' }
  try {
    const raw = spec.pool ? call.args.slice(1) : call.args
    const args = spec.args.map((t, i) =>
      t === 'address' ? anyToEvm(String(raw[i]?.value)) : normalizeArg(t, raw[i]?.value, TOKEN_DECIMALS),
    )
    const contract = contractFor(spec.contract, signer)

    if (spec.approve === 'deposit' || spec.approve === 'gift') {
      const owner = await signer.getAddress()
      const spender = spec.contract === 'pay' ? PAY_POOL() : GIFT_POOL()
      let need: bigint
      if (spec.approve === 'deposit') need = args[1] as bigint
      else {
        const amountIdx = spec.fn === 'sendGift' ? 4 : 3
        const [g, f] = await contractFor('gift').quoteGift(args[0], args[amountIdx])
        need = (g as bigint) + (f as bigint)
      }
      const token = new ethers.Contract(TOKEN(), erc20Iface, signer)
      if ((await token.allowance(owner, spender)) < need) await (await token.approve(spender, need)).wait()
    }

    const tx: ethers.TransactionResponse = await contract.getFunction(spec.fn)(...args)
    const receipt = await tx.wait()
    return receipt && receipt.status === 1
      ? { success: true, txHash: tx.hash }
      : { success: false, txHash: tx.hash, error: 'transaction reverted' }
  } catch (e) {
    return { success: false, error: revertReason(e) }
  }
}

/** Run a Move-named view function against BSC and return Initia-REST-shaped data. */
export async function evmView(moduleName: string, functionName: string, b64Args: string[]): Promise<unknown> {
  const spec = specFor(moduleName, functionName)
  if (!spec || !spec.ret) throw new Error(`view ${moduleName}::${functionName} not available on BNB Chain`)
  const raw = spec.pool ? b64Args.slice(1) : b64Args
  const args = spec.args.map((t, i) => decodeBcsArg(t, raw[i], TOKEN_DECIMALS))
  const result = await contractFor(spec.contract).getFunction(spec.fn).staticCall(...args)
  // ethers returns a Result (array-like); a single return value is unwrapped by getFunction
  const value = spec.ret.length === 1 ? result : Array.from(result as ethers.Result)
  return formatViewResult(spec, value, TOKEN_DECIMALS)
}

// ── fetch shim ─────────────────────────────────────────────────

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

async function route(url: string, init?: RequestInit): Promise<Response | null> {
  if (url.includes('/initia/move/v1/')) {
    const v = parseViewUrl(url)
    if (!v) return json({ message: 'Initia Move endpoint not available on BNB Chain' }, 404)
    let args: string[] = []
    try {
      args = JSON.parse(String(init?.body ?? '{}')).args ?? []
    } catch {
      /* no body */
    }
    try {
      return json({ data: JSON.stringify(await evmView(v.moduleName, v.functionName, args)) })
    } catch (e) {
      return json({ message: revertReason(e) }, 400)
    }
  }

  let m = url.match(/\/cosmos\/bank\/v1beta1\/balances\/([^/?]+)/)
  if (m) {
    const who = anyToEvm(decodeURIComponent(m[1]))
    const token = new ethers.Contract(TOKEN(), erc20Iface, provider)
    const [tok, bnb] = await Promise.all([token.balanceOf(who) as Promise<bigint>, provider.getBalance(who)])
    const balances = [
      { denom: `move/${TOKEN().replace(/^0x/, '')}`, amount: tokenToMicro(tok, TOKEN_DECIMALS).toString() },
      { denom: 'uinit', amount: (bnb / 10n ** 12n).toString() }, // native BNB, 6-decimal units
    ]
    return json({ balances, pagination: { next_key: null, total: String(balances.length) } })
  }

  m = url.match(/\/cosmos\/tx\/v1beta1\/txs\/(0x[0-9a-fA-F]{64})/)
  if (m) {
    const receipt = await provider.getTransactionReceipt(m[1])
    if (!receipt) return json({ message: 'tx not found' }, 404)
    return json({
      tx_response: { txhash: receipt.hash, height: String(receipt.blockNumber), code: receipt.status === 1 ? 0 : 1, raw_log: '' },
    })
  }

  m = url.match(/\/cosmos\/auth\/v1beta1\/accounts\/([^/?]+)/)
  if (m) {
    const who = anyToEvm(decodeURIComponent(m[1]))
    const nonce = await provider.getTransactionCount(who)
    // "new user" on Initia = no pub_key; on BSC = never sent a tx
    return json({ account: { address: who, account_number: '0', sequence: String(nonce), ...(nonce > 0 ? { pub_key: {} } : {}) } })
  }

  if (url.includes('/cosmos/feegrant/v1beta1/')) {
    // No native fee grants on BSC; report "granted" so callers skip the grant tx.
    return json({ allowance: { note: 'no feegrant on BNB Chain' } })
  }
  return null
}

export function installBnbFetchShim(): void {
  const g = globalThis as typeof globalThis & { __ipayBnbShim?: boolean }
  if (g.__ipayBnbShim) return
  g.__ipayBnbShim = true
  const original = g.fetch.bind(g)
  g.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    try {
      const r = await route(url, init)
      if (r) return r
    } catch (e) {
      return json({ message: revertReason(e) }, 502)
    }
    return original(input as RequestInfo, init)
  }) as typeof fetch
}
