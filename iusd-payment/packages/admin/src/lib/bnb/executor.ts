/**
 * Executes the app's existing Initia-shaped tx messages on BNB Chain.
 *
 * Supported message types (everything the app builds today):
 *   /initia.move.v1.MsgExecute       pay_v3 / gift_v3 calls with BCS args
 *   /initia.move.v1.MsgExecuteJSON   primary_fungible_store::transfer (token send), JSON args
 *   /cosmos.bank.v1beta1.MsgSend     token or native BNB transfer
 *
 * Returns the same shape callers read from InterwovenKit's requestTxBlock:
 *   { code: 0 | 1, transactionHash, txHash, height, rawLog }
 */
import { BaseError, ContractFunctionRevertedError, type WalletClient } from 'viem'
import {
  decodeBcsArg,
  microToToken,
  normalizeArg,
  specFor,
  toEvmAddress,
  type DecodedArg,
  type FnSpec,
} from './moveCompat'
import {
  EVM_CHAIN,
  TOKEN_ADDRESS,
  TOKEN_DECIMALS,
  contractFor,
  erc20Abi,
  giftAbi,
  payAbi,
  publicClient,
  GIFT_POOL,
  PAY_POOL,
} from './chain'

export interface TxBlockResult {
  code: number
  transactionHash: string
  txHash: string
  height: number
  rawLog: string
}

type Hex = `0x${string}`

interface EvmCall {
  address: Hex
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abi: any
  functionName: string
  args: unknown[]
  value?: bigint
  spec?: FnSpec
}

function errMsg(e: unknown): string {
  if (e instanceof BaseError) {
    const revert = e.walk(err => err instanceof ContractFunctionRevertedError)
    if (revert instanceof ContractFunctionRevertedError) {
      return revert.data?.errorName ?? revert.shortMessage
    }
    return e.shortMessage
  }
  return (e as Error)?.message ?? String(e)
}

function isUserRejection(e: unknown): boolean {
  const m = String((e as Error)?.message ?? e)
  return /user rejected|user denied|rejected the request|4001/i.test(m)
}

/** Translate one Initia message into an EVM call (or null for Move-only no-ops). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toEvmCall(msg: any): EvmCall | null {
  const typeUrl: string = msg?.typeUrl ?? ''
  const v = msg?.value ?? {}

  if (typeUrl === '/initia.move.v1.MsgExecute' || typeUrl === '/initia.move.v1.MsgExecuteJSON') {
    const isJson = typeUrl.endsWith('JSON')
    if (v.moduleName === 'primary_fungible_store' && v.functionName === 'transfer') {
      const [, to, amount] = (v.args as string[]).map(a => (isJson ? JSON.parse(a) : a))
      return {
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [toEvmAddress(String(to)), microToToken(BigInt(amount), TOKEN_DECIMALS)],
      }
    }
    const spec = specFor(v.moduleName, v.functionName)
    if (!spec) throw new Error(`Unsupported call on BNB Chain: ${v.moduleName}::${v.functionName}`)
    if (spec.noop) return null
    const raw: unknown[] = spec.pool ? (v.args as unknown[]).slice(1) : (v.args as unknown[])
    const args: DecodedArg[] = spec.args.map((t, i) =>
      isJson ? normalizeArg(t, JSON.parse(String(raw[i])), TOKEN_DECIMALS) : decodeBcsArg(t, raw[i] as Uint8Array | string, TOKEN_DECIMALS),
    )
    const c = contractFor(spec.contract)
    return { address: c.address, abi: c.abi, functionName: spec.fn, args, spec }
  }

  if (typeUrl === '/cosmos.bank.v1beta1.MsgSend') {
    const coin = (v.amount ?? [])[0] ?? {}
    const to = toEvmAddress(String(v.toAddress ?? v.to_address))
    const micro = BigInt(coin.amount ?? 0)
    if (String(coin.denom ?? '').startsWith('move/')) {
      return { address: TOKEN_ADDRESS, abi: erc20Abi, functionName: 'transfer', args: [to, microToToken(micro, TOKEN_DECIMALS)] }
    }
    // native gas token (uinit -> BNB, 6 -> 18 decimals)
    return { address: to, abi: null, functionName: '', args: [], value: micro * 10n ** 12n }
  }

  throw new Error(`Unsupported message type on BNB Chain: ${typeUrl}`)
}

/** How much token the pool will pull for this call (0 = no approval needed). */
async function requiredAllowance(call: EvmCall): Promise<{ spender: Hex; amount: bigint } | null> {
  const kind = call.spec?.approve
  if (!kind) return null
  if (kind === 'deposit') return { spender: PAY_POOL, amount: call.args[1] as bigint }
  if (kind === 'refund') {
    const r = (await publicClient.readContract({
      address: PAY_POOL,
      abi: payAbi,
      functionName: 'getPayment',
      args: [call.args[0] as Hex],
    })) as readonly [number, bigint, Hex, bigint, bigint]
    return { spender: PAY_POOL, amount: r[1] }
  }
  // gift: boxId is arg 0; the flexible amount sits at a function-specific index
  const amountIdx = call.functionName === 'sendGift' ? 4 : 3
  const [giftAmount, fee] = (await publicClient.readContract({
    address: GIFT_POOL,
    abi: giftAbi,
    functionName: 'quoteGift',
    args: [call.args[0] as bigint, call.args[amountIdx] as bigint],
  })) as readonly [bigint, bigint]
  return { spender: GIFT_POOL, amount: giftAmount + fee }
}

async function send(wallet: WalletClient, account: Hex, call: EvmCall): Promise<Hex> {
  if (!call.abi) {
    return wallet.sendTransaction({ account, chain: EVM_CHAIN, to: call.address, value: call.value ?? 0n })
  }
  const { request } = await publicClient.simulateContract({
    account,
    address: call.address,
    abi: call.abi,
    functionName: call.functionName,
    args: call.args,
  })
  return wallet.writeContract(request)
}

export async function executeMessages(
  wallet: WalletClient,
  account: Hex,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[],
): Promise<TxBlockResult> {
  let last: TxBlockResult = { code: 0, transactionHash: '', txHash: '', height: 0, rawLog: '' }
  for (const msg of messages) {
    let call: EvmCall | null
    try {
      call = toEvmCall(msg)
    } catch (e) {
      return { ...last, code: 1, rawLog: errMsg(e) }
    }
    if (!call) continue
    try {
      const need = await requiredAllowance(call)
      if (need && need.amount > 0n) {
        const current = (await publicClient.readContract({
          address: TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [account, need.spender],
        })) as bigint
        if (current < need.amount) {
          const approveHash = await send(wallet, account, {
            address: TOKEN_ADDRESS,
            abi: erc20Abi,
            functionName: 'approve',
            args: [need.spender, need.amount],
          })
          await publicClient.waitForTransactionReceipt({ hash: approveHash })
        }
      }
      const hash = await send(wallet, account, call)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const ok = receipt.status === 'success'
      last = {
        code: ok ? 0 : 1,
        transactionHash: hash,
        txHash: hash,
        height: Number(receipt.blockNumber),
        rawLog: ok ? '' : 'transaction reverted',
      }
      if (!ok) return last
    } catch (e) {
      if (isUserRejection(e)) throw e
      return { ...last, code: 1, rawLog: errMsg(e) }
    }
  }
  return last
}
