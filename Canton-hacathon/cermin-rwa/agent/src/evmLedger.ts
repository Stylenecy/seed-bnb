/**
 * EvmLedger — the Guard Agent's `Ledger` seam backed by the CerminRWA Solidity
 * contract on BNB Chain (BSC testnet 97 by default), via viem.
 *
 * Mapping from the Daml contract-id world:
 *   - Loan / GuardPolicy / ShadowVault / GracePeriod "contract ids" are the
 *     borrower address (one of each per borrower on-chain).
 *   - PriceFeed contract id is `<instrumentId>#<round>`; `round` bumps on every
 *     oracle update, so guard.ts's "never act twice on one price observation"
 *     idempotency keeps working exactly as with Daml's archive+recreate.
 *   - CouponDistribution contract id is the on-chain coupon index.
 * Only rows naming THIS agent as guardAgent are returned (the Daml agent could
 * only see contracts it observed).
 */

import {
  createPublicClient,
  createWalletClient,
  formatUnits,
  hexToString,
  http,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { bsc, bscTestnet } from "viem/chains";
import { cerminRwaAbi, rwaPriceFeedAbi } from "./abi.js";
import type { GuardRepayArgs, GuardRepayResult, Ledger, SweepToLoanArgs, SweepToLoanResult } from "./ledger.js";
import type {
  Contract,
  CouponDistribution,
  GracePeriod,
  GuardPolicy,
  Loan,
  PriceFeed,
  RescueEvent,
  ShadowVault,
} from "./types.js";

export interface EvmLedgerConfig {
  rpcUrl: string;
  chainId: number; // 97 (default) or 56
  cerminRwaAddress: Address;
  guardAgentPrivateKey: Hex;
}

const num = (v: bigint): number => Number(formatUnits(v, 18));
const iso = (secs: bigint): string => new Date(Number(secs) * 1000).toISOString();
const same = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

interface Statics {
  instrumentId: string;
  instrumentHex: Hex;
  priceFeed: Address;
  pool: Address;
  issuer: Address;
}

export class EvmLedger implements Ledger {
  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient;
  private readonly account: PrivateKeyAccount;
  private readonly address: Address;
  private statics?: Statics;

  constructor(private readonly config: EvmLedgerConfig) {
    const chain = config.chainId === bsc.id ? bsc : bscTestnet;
    const transport = http(config.rpcUrl);
    this.account = privateKeyToAccount(config.guardAgentPrivateKey);
    this.publicClient = createPublicClient({ chain, transport }) as PublicClient;
    this.walletClient = createWalletClient({ account: this.account, chain, transport });
    this.address = config.cerminRwaAddress;
  }

  get guardAgentAddress(): Address {
    return this.account.address;
  }

  private read<T>(functionName: string, args: readonly unknown[] = []): Promise<T> {
    return this.publicClient.readContract({
      address: this.address,
      abi: cerminRwaAbi,
      functionName: functionName as never,
      args: args as never,
    }) as Promise<T>;
  }

  private async write(functionName: string, args: readonly unknown[]): Promise<Hex> {
    const { request } = await this.publicClient.simulateContract({
      address: this.address,
      abi: cerminRwaAbi,
      functionName: functionName as never,
      args: args as never,
      account: this.account,
    });
    const hash = await this.walletClient.writeContract(request as never);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(`${functionName} reverted (tx ${hash})`);
    return hash;
  }

  private async getStatics(): Promise<Statics> {
    if (!this.statics) {
      const [instrumentHex, priceFeed, pool, issuer] = await Promise.all([
        this.read<Hex>("INSTRUMENT_ID"),
        this.read<Address>("PRICE_FEED"),
        this.read<Address>("POOL_OPERATOR"),
        this.read<Address>("ISSUER"),
      ]);
      const instrumentId = hexToString(instrumentHex, { size: 32 }).replace(/\0+$/, "");
      this.statics = { instrumentId, instrumentHex, priceFeed, pool, issuer };
    }
    return this.statics;
  }

  private async borrowers(): Promise<Address[]> {
    return [...(await this.read<readonly Address[]>("getBorrowers"))];
  }

  private async loanOf(borrower: Address): Promise<Contract<Loan> | null> {
    const s = await this.getStatics();
    const [guardAgent, principal, outstanding, rateBps, collateralAmount, loanId, active] = await this.read<
      readonly [Address, bigint, bigint, bigint, bigint, string, boolean]
    >("loans", [borrower]);
    if (!active) return null;
    return {
      contractId: borrower,
      payload: {
        borrower,
        poolOperator: s.pool,
        guardAgent,
        loanId,
        principal: num(principal),
        outstanding: num(outstanding),
        rateBps: Number(rateBps),
        collateralInstrumentId: s.instrumentId,
        collateralAmount: num(collateralAmount),
      },
    };
  }

  async getActivePriceFeeds(): Promise<Contract<PriceFeed>[]> {
    const s = await this.getStatics();
    const [price, round] = (await this.publicClient.readContract({
      address: s.priceFeed,
      abi: rwaPriceFeedAbi,
      functionName: "getPrice",
      args: [s.instrumentHex],
    })) as readonly [bigint, bigint, bigint];
    const oracle = (await this.publicClient.readContract({
      address: s.priceFeed,
      abi: rwaPriceFeedAbi,
      functionName: "owner",
    })) as Address;
    return [
      {
        contractId: `${s.instrumentId}#${round}`,
        payload: { oracle, instrumentId: s.instrumentId, price: num(price), subscribers: [] },
      },
    ];
  }

  async getActiveLoans(): Promise<Contract<Loan>[]> {
    const loans = await Promise.all((await this.borrowers()).map((b) => this.loanOf(b)));
    return loans.filter((l): l is Contract<Loan> => !!l && same(l.payload.guardAgent, this.guardAgentAddress));
  }

  async getActiveGuardPolicies(): Promise<Contract<GuardPolicy>[]> {
    const rows = await Promise.all(
      (await this.borrowers()).map(async (b) => {
        const [guardAgent, trigger, target, maxRepay, couponSweep, active] = await this.read<
          readonly [Address, bigint, bigint, bigint, boolean, boolean]
        >("policies", [b]);
        if (!active || !same(guardAgent, this.guardAgentAddress)) return null;
        const c: Contract<GuardPolicy> = {
          contractId: b,
          payload: {
            borrower: b,
            guardAgent,
            triggerRatioBps: Number(trigger),
            targetRatioBps: Number(target),
            maxRepayPerEvent: num(maxRepay),
            couponSweep,
          },
        };
        return c;
      }),
    );
    return rows.filter((r): r is Contract<GuardPolicy> => !!r);
  }

  async getActiveShadowVaults(): Promise<Contract<ShadowVault>[]> {
    const rows = await Promise.all(
      (await this.borrowers()).map(async (b) => {
        const [guardAgent, balance, active] = await this.read<readonly [Address, bigint, boolean]>("vaults", [b]);
        if (!active || !same(guardAgent, this.guardAgentAddress)) return null;
        const c: Contract<ShadowVault> = { contractId: b, payload: { borrower: b, guardAgent, balance: num(balance) } };
        return c;
      }),
    );
    return rows.filter((r): r is Contract<ShadowVault> => !!r);
  }

  async getActiveGracePeriods(): Promise<Contract<GracePeriod>[]> {
    const s = await this.getStatics();
    const rows = await Promise.all(
      (await this.borrowers()).map(async (b) => {
        const [loanId, startedAt, expiresAt, active] = await this.read<readonly [string, bigint, bigint, boolean]>(
          "gracePeriods",
          [b],
        );
        if (!active) return null;
        const c: Contract<GracePeriod> = {
          contractId: b,
          payload: {
            borrower: b,
            guardAgent: this.guardAgentAddress,
            poolOperator: s.pool,
            loanId,
            startedAt: iso(startedAt),
            expiresAt: iso(expiresAt),
          },
        };
        return c;
      }),
    );
    return rows.filter((r): r is Contract<GracePeriod> => !!r);
  }

  async getActiveCouponDistributions(): Promise<Contract<CouponDistribution>[]> {
    const s = await this.getStatics();
    const ids = await this.read<readonly bigint[]>("activeCouponIds");
    const rows = await Promise.all(
      ids.map(async (id) => {
        const [owner, guardAgent, amount, active] = await this.read<readonly [Address, Address, bigint, boolean]>(
          "coupons",
          [id],
        );
        if (!active || !same(guardAgent, this.guardAgentAddress)) return null;
        const c: Contract<CouponDistribution> = {
          contractId: id.toString(),
          payload: { issuer: s.issuer, owner, instrumentId: s.instrumentId, amount: num(amount) },
        };
        return c;
      }),
    );
    return rows.filter((r): r is Contract<CouponDistribution> => !!r);
  }

  private async lastRescue(borrower: Address): Promise<Contract<RescueEvent>> {
    const events = await this.read<
      readonly {
        loanId: string;
        description: string;
        amount: bigint;
        healthBefore: bigint;
        healthAfter: bigint;
        at: bigint;
      }[]
    >("getRescueEvents", [borrower]);
    const e = events[events.length - 1];
    if (!e) throw new Error(`no RescueEvent recorded for ${borrower}`);
    return {
      contractId: `${borrower}#rescue-${events.length - 1}`,
      payload: {
        guardAgent: this.guardAgentAddress,
        borrower,
        loanId: e.loanId,
        description: e.description,
        amount: num(e.amount),
        healthBefore: Number(e.healthBefore),
        healthAfter: Number(e.healthAfter),
        at: iso(e.at),
      },
    };
  }

  async exerciseGuardRepay(vaultCid: string, _args: GuardRepayArgs): Promise<GuardRepayResult> {
    const borrower = vaultCid as Address;
    await this.write("guardRepay", [borrower]);
    const [rescueEvent, loan, vaults] = await Promise.all([
      this.lastRescue(borrower),
      this.loanOf(borrower),
      this.getActiveShadowVaults(),
    ]);
    const vault = vaults.find((v) => same(v.contractId, borrower));
    if (!loan || !vault) throw new Error(`post-GuardRepay state missing for ${borrower}`);
    return {
      vault,
      loan,
      rescueEvent,
      amountRepaid: rescueEvent.payload.amount,
      healthBefore: rescueEvent.payload.healthBefore,
      healthAfter: rescueEvent.payload.healthAfter,
    };
  }

  async exerciseStartGracePeriod(loanCid: string): Promise<Contract<GracePeriod>> {
    const borrower = loanCid as Address;
    await this.write("startGracePeriod", [borrower]);
    const grace = (await this.getActiveGracePeriods()).find((g) => same(g.contractId, borrower));
    if (!grace) throw new Error(`GracePeriod not found after startGracePeriod for ${borrower}`);
    return grace;
  }

  async exerciseSweepToLoan(couponCid: string, _args: SweepToLoanArgs): Promise<SweepToLoanResult> {
    const id = BigInt(couponCid);
    const [owner, , amount] = await this.read<readonly [Address, Address, bigint, boolean]>("coupons", [id]);
    await this.write("sweepToLoan", [id]);
    const loan = await this.loanOf(owner);
    if (!loan) throw new Error(`loan for ${owner} missing after sweep`);
    return { amount: num(amount), loan };
  }
}
