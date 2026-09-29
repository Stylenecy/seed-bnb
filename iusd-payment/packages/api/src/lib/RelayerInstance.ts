/**
 * RelayerInstance — a single relayer wallet with a serial transaction queue.
 *
 * Each instance owns an independent HD wallet and processes transactions
 * one at a time, waiting for on-chain confirmation before proceeding.
 * This prevents nonce conflicts.
 *
 * BNB Chain port: callers still submit Move-shaped params
 * ({ moduleName: 'pay_v3' | 'gift_v3', functionName, args }); they are
 * executed against the Solidity IPayPool / IPayGiftPool contracts on BSC
 * via lib/bnb/evm.ts.
 */

import { ethers } from 'ethers'
import { executeMoveOnEvm, provider } from './bnb/evm'

export interface TxResult {
  success: boolean
  txHash?: string
  error?: string
}

export interface MsgExecuteParams {
  moduleAddress: string
  moduleName: string
  functionName: string
  typeArgs?: string[]
  args: MoveArg[]
}

export type MoveArg =
  | { type: 'object'; value: string }
  | { type: 'address'; value: string }
  | { type: 'u64'; value: number | bigint }
  | { type: 'raw_hex'; value: string }
  | { type: 'string'; value: string }
  | { type: 'bool'; value: boolean }

interface QueueJob {
  execute: () => Promise<TxResult>
  resolve: (result: TxResult) => void
}

export class RelayerInstance {
  readonly name: string
  /** Kept for API compatibility with the Initia build; on BSC this is the 0x address. */
  readonly bech32Address: string
  readonly hexAddress: string
  private wallet: ethers.HDNodeWallet
  private queue: QueueJob[] = []
  private processing = false

  constructor(mnemonic: string, name: string, derivationPath?: string) {
    this.name = name
    const base = derivationPath
      ? ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, derivationPath)
      : (ethers.Wallet.fromPhrase(mnemonic) as ethers.HDNodeWallet)
    this.wallet = base.connect(provider)
    this.hexAddress = this.wallet.address.toLowerCase()
    this.bech32Address = this.hexAddress
  }

  /** Submit a contract call. Queued and executed serially. */
  submit(params: MsgExecuteParams, memo = ''): Promise<TxResult> {
    return new Promise(resolve => {
      this.queue.push({ execute: () => this.execute(params, memo), resolve })
      this.drain()
    })
  }

  /**
   * Fee grants are a Cosmos feature with no BSC equivalent. Kept as a no-op so
   * existing callers keep working; users pay their own BNB gas, and relayer
   * `sponsor_*` calls still cover claim gas.
   */
  submitFeeGrant(granteeAddress: string, _spendLimitUinit: string, _allowedMessages: string[], _memo = ''): Promise<TxResult> {
    console.log(`[${this.name}] feegrant skipped for ${granteeAddress} (not supported on BNB Chain)`)
    return Promise.resolve({ success: true, txHash: 'no-feegrant-on-bsc' })
  }

  get queueLength(): number { return this.queue.length }
  get isProcessing(): boolean { return this.processing }

  private async drain(): Promise<void> {
    if (this.processing) return
    this.processing = true
    while (this.queue.length > 0) {
      const job = this.queue.shift()!
      try {
        job.resolve(await job.execute())
      } catch (err: any) {
        job.resolve({ success: false, error: err.message })
      }
    }
    this.processing = false
  }

  private async execute(params: MsgExecuteParams, memo: string): Promise<TxResult> {
    const res = await executeMoveOnEvm(this.wallet, {
      moduleName: params.moduleName,
      functionName: params.functionName,
      args: params.args,
    })
    if (res.success) console.log(`[${this.name}] TX confirmed: ${res.txHash} ${memo}`)
    else console.error(`[${this.name}] TX failed: ${params.moduleName}::${params.functionName} ${res.error}`)
    return res
  }
}
