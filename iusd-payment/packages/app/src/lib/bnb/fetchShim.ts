/**
 * Serves the Initia REST endpoints the app still calls from BNB Chain.
 *
 * Many modules query `${REST_URL}/initia/move/v1/.../view_functions/...` or
 * `${REST_URL}/cosmos/bank/v1beta1/balances/<addr>` directly with fetch().
 * Rather than rewriting each call site, this shim intercepts those URLs
 * (any host) and answers them from the IPayPool / IPayGiftPool contracts and
 * the ERC-20 token, returning the same JSON shape the Initia REST API used.
 *
 * Install once, before the app renders (see main.tsx).
 */
import { formatViewResult, decodeBcsArg, parseViewUrl, specFor, tokenToMicro, toEvmAddress } from './moveCompat'
import { TOKEN_ADDRESS, TOKEN_DECIMALS, contractFor, erc20Abi, publicClient } from './chain'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

async function handleView(url: string, init?: RequestInit): Promise<Response | null> {
  const parsed = parseViewUrl(url)
  if (!parsed) return null
  const spec = specFor(parsed.moduleName, parsed.functionName)
  if (!spec || !spec.ret) return json({ message: `view ${parsed.moduleName}::${parsed.functionName} not available on BNB Chain` }, 404)
  let rawArgs: string[] = []
  try {
    rawArgs = JSON.parse(String(init?.body ?? '{}')).args ?? []
  } catch {
    /* no body */
  }
  const argsB64 = spec.pool ? rawArgs.slice(1) : rawArgs
  const args = spec.args.map((t, i) => decodeBcsArg(t, argsB64[i], TOKEN_DECIMALS))
  const c = contractFor(spec.contract)
  try {
    const result = await publicClient.readContract({ address: c.address, abi: c.abi, functionName: spec.fn as never, args: args as never })
    return json({ data: JSON.stringify(formatViewResult(spec, result, TOKEN_DECIMALS)) })
  } catch (e) {
    return json({ message: (e as Error)?.message ?? 'view reverted' }, 400)
  }
}

async function handleBalances(url: string): Promise<Response | null> {
  const m = url.match(/\/cosmos\/bank\/v1beta1\/balances\/([^/?]+)/)
  if (!m) return null
  const addr = toEvmAddress(m[1])
  const [tokenWei, bnbWei] = await Promise.all([
    publicClient.readContract({ address: TOKEN_ADDRESS, abi: erc20Abi, functionName: 'balanceOf', args: [addr] }) as Promise<bigint>,
    publicClient.getBalance({ address: addr }),
  ])
  const tokenDenom = `move/${TOKEN_ADDRESS.replace(/^0x/, '')}`
  const balances = [
    { denom: tokenDenom, amount: tokenToMicro(tokenWei, TOKEN_DECIMALS).toString() },
    // native BNB exposed under the old gas denom, in 6-decimal units
    { denom: 'uinit', amount: (bnbWei / 10n ** 12n).toString() },
  ]
  const byDenom = new URL(url, 'http://x').searchParams.get('denom')
  if (url.includes('/by_denom') && byDenom) {
    return json({ balance: balances.find(b => b.denom === byDenom) ?? { denom: byDenom, amount: '0' } })
  }
  return json({ balances, pagination: { next_key: null, total: String(balances.length) } })
}

export function installBnbFetchShim(): void {
  const g = globalThis as typeof globalThis & { __ipayBnbShim?: boolean }
  if (g.__ipayBnbShim) return
  g.__ipayBnbShim = true
  const original = g.fetch.bind(g)
  g.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (url.includes('/initia/move/v1/')) {
      const r = await handleView(url, init)
      if (r) return r
      return json({ message: 'Initia Move endpoint not available on BNB Chain' }, 404)
    }
    if (url.includes('/cosmos/bank/v1beta1/balances/')) {
      const r = await handleBalances(url)
      if (r) return r
    }
    return original(input, init)
  }
}
