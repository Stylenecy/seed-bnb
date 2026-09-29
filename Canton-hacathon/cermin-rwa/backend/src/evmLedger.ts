// EvmLedger — the backend's `Ledger` seam backed by the CerminRWA Solidity
// contract on BNB Chain (BSC testnet 97 by default), via viem.
//
// Custody model (mirrors the Canton hosted-party setup, where the backend held
// the validator credentials and submitted as each party): every self-service
// username maps to a deterministic EOA derived from USER_KEY_SECRET, and the
// backend signs that user's own txs (acceptOffer, setGuardPolicy, vault ops).
// The OPERATOR key plays issuer + pool operator + oracle. The Guard Agent is a
// separate process with its own key. TESTNET DEMO ONLY — do not use this
// custodial model with real funds; a production build would have users sign in
// their own wallet (TODO: wagmi in the frontend).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  createPublicClient,
  createWalletClient,
  formatUnits,
  http,
  keccak256,
  maxUint256,
  parseUnits,
  stringToHex,
  toHex,
  type Address,
  type Hex,
  type PublicClient,
} from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { bsc, bscTestnet } from 'viem/chains';
import { cerminRwaAbi, mockTokenAbi, rwaPriceFeedAbi } from './abi.ts';
import {
  FAUCET_MUST,
  INSTRUMENT_ID,
  LedgerConflictError,
  LedgerValidationError,
  MAX_REPAY_PER_EVENT,
  RATE_BPS,
  RESTORE_SPREAD_BPS,
  computeHealthRatioBps,
  partyHintForUsername,
  requirePositiveNumber,
  round2,
  validateTriggerBps,
  type BorrowRequest,
  type FaucetResult,
  type Ledger,
  type OnboardResult,
  type PositionView,
} from './ledger.ts';
import { PriceHistoryBuffer, type PricePoint } from './priceHistory.ts';

export interface EvmLedgerConfig {
  rpcUrl: string;
  chainId: number;
  cerminRwaAddress: Address;
  operatorPrivateKey: Hex;
  guardAgentAddress: Address;
  userKeySecret: string;
  gasDripWei: bigint;
  usersDbPath: string;
  /** Optional read-only borrower shown when no X-Cermin-Party header is sent. */
  legacyBorrower?: Address;
}

const num = (v: bigint): number => Number(formatUnits(v, 18));
const units = (n: number): bigint => parseUnits(n.toFixed(6), 18);
const NEXT_COUPON_DATE = '2026-10-10';

type Tuple<T extends unknown[]> = readonly [...T];

export class EvmLedger implements Ledger {
  private readonly cfg: EvmLedgerConfig;
  private readonly chain: typeof bsc | typeof bscTestnet;
  private readonly publicClient: PublicClient;
  private readonly operator: PrivateKeyAccount;
  private readonly history = new PriceHistoryBuffer();
  /** address (lowercase) -> username slug, persisted so a restart can re-derive keys. */
  private users: Record<string, string>;
  /** Per-signer promise chains so concurrent requests never race a nonce. */
  private readonly queues = new Map<string, Promise<unknown>>();
  private tokens?: { must: Address; musd: Address; feed: Address };

  constructor(cfg: EvmLedgerConfig) {
    this.cfg = cfg;
    this.chain = cfg.chainId === bsc.id ? bsc : bscTestnet;
    this.publicClient = createPublicClient({ chain: this.chain, transport: http(cfg.rpcUrl) }) as PublicClient;
    this.operator = privateKeyToAccount(cfg.operatorPrivateKey);
    this.users = this.loadUsers();
  }

  // ── persistence ────────────────────────────────────────────────────────────
  private loadUsers(): Record<string, string> {
    try {
      return JSON.parse(readFileSync(this.cfg.usersDbPath, 'utf8')) as Record<string, string>;
    } catch {
      return {};
    }
  }

  private saveUsers(): void {
    mkdirSync(dirname(this.cfg.usersDbPath), { recursive: true });
    writeFileSync(this.cfg.usersDbPath, JSON.stringify(this.users, null, 2));
  }

  // ── accounts ───────────────────────────────────────────────────────────────
  private accountForSlug(slug: string): PrivateKeyAccount {
    return privateKeyToAccount(keccak256(stringToHex(`${this.cfg.userKeySecret}:${slug}`)));
  }

  private accountForParty(party: string): PrivateKeyAccount {
    const slug = this.users[party.toLowerCase()];
    if (!slug) throw new LedgerValidationError('unknown party — connect (onboard) again');
    return this.accountForSlug(slug);
  }

  // ── chain helpers ──────────────────────────────────────────────────────────
  private async addrs(): Promise<{ must: Address; musd: Address; feed: Address }> {
    if (!this.tokens) {
      const [must, musd, feed] = await Promise.all([
        this.readRwa<Address>('COLLATERAL'),
        this.readRwa<Address>('STABLE'),
        this.readRwa<Address>('PRICE_FEED'),
      ]);
      this.tokens = { must, musd, feed };
    }
    return this.tokens;
  }

  private readRwa<T>(functionName: string, args: readonly unknown[] = []): Promise<T> {
    return this.publicClient.readContract({
      address: this.cfg.cerminRwaAddress,
      abi: cerminRwaAbi,
      functionName: functionName as never,
      args: args as never,
    }) as Promise<T>;
  }

  private enqueue<T>(signer: Address, fn: () => Promise<T>): Promise<T> {
    const prev = this.queues.get(signer) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(fn);
    this.queues.set(signer, next);
    return next;
  }

  /** Simulate, send and await one contract write from `account`. */
  private send(
    account: PrivateKeyAccount,
    address: Address,
    abi: readonly unknown[],
    functionName: string,
    args: readonly unknown[],
  ): Promise<Hex> {
    return this.enqueue(account.address, async () => {
      const wallet = createWalletClient({ account, chain: this.chain, transport: http(this.cfg.rpcUrl) });
      const { request } = await this.publicClient.simulateContract({
        address,
        abi: abi as never,
        functionName: functionName as never,
        args: args as never,
        account,
      });
      const hash = await wallet.writeContract(request as never);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw new Error(`${functionName} reverted (tx ${hash})`);
      return hash;
    });
  }

  private sendRwa(account: PrivateKeyAccount, functionName: string, args: readonly unknown[]): Promise<Hex> {
    return this.send(account, this.cfg.cerminRwaAddress, cerminRwaAbi, functionName, args);
  }

  /** Top up a user's gas (tBNB) from the operator when it runs low. */
  private async ensureGas(user: Address): Promise<void> {
    const bal = await this.publicClient.getBalance({ address: user });
    if (bal >= this.cfg.gasDripWei / 2n) return;
    await this.enqueue(this.operator.address, async () => {
      const wallet = createWalletClient({ account: this.operator, chain: this.chain, transport: http(this.cfg.rpcUrl) });
      const hash = await wallet.sendTransaction({ to: user, value: this.cfg.gasDripWei });
      await this.publicClient.waitForTransactionReceipt({ hash });
    });
  }

  private async ensureApprovals(account: PrivateKeyAccount): Promise<void> {
    const { must, musd } = await this.addrs();
    for (const token of [must, musd]) {
      const allowance = (await this.publicClient.readContract({
        address: token,
        abi: mockTokenAbi,
        functionName: 'allowance',
        args: [account.address, this.cfg.cerminRwaAddress],
      })) as bigint;
      if (allowance < maxUint256 / 2n) {
        await this.send(account, token, mockTokenAbi, 'approve', [this.cfg.cerminRwaAddress, maxUint256]);
      }
    }
  }

  private async tokenBalance(token: Address, owner: Address): Promise<bigint> {
    return (await this.publicClient.readContract({
      address: token,
      abi: mockTokenAbi,
      functionName: 'balanceOf',
      args: [owner],
    })) as bigint;
  }

  private async price(): Promise<number> {
    return num(await this.readRwa<bigint>('currentPrice'));
  }

  // ── Ledger seam ────────────────────────────────────────────────────────────
  async onboard(username: string): Promise<OnboardResult> {
    const slug = partyHintForUsername(username);
    const account = this.accountForSlug(slug);
    const key = account.address.toLowerCase();
    const created = !this.users[key];
    if (created) {
      this.users[key] = slug;
      this.saveUsers();
    }
    await this.ensureGas(account.address);
    await this.ensureApprovals(account);
    return { party: account.address, username, created };
  }

  async faucet(party: string): Promise<FaucetResult> {
    if (!party) throw new LedgerValidationError('party is required');
    const account = this.accountForParty(party);
    const { must } = await this.addrs();
    const bal = num(await this.tokenBalance(must, account.address));
    if (bal >= FAUCET_MUST) {
      throw new LedgerConflictError(`You already hold ${bal} mUST — the faucet is one claim per user.`);
    }
    await this.send(this.operator, must, mockTokenAbi, 'mint', [account.address, units(FAUCET_MUST)]);
    return { party: account.address, minted: FAUCET_MUST, mustBalance: round2(bal + FAUCET_MUST) };
  }

  async getPosition(party?: string): Promise<PositionView> {
    const borrower = (party ?? this.cfg.legacyBorrower) as Address | undefined;
    const price = await this.price();
    this.history.record(price);
    if (!borrower) {
      return {
        party: null,
        wallet: { mustBalance: 0 },
        collateral: null,
        loan: null,
        vault: null,
        policy: null,
        healthRatioBps: null,
        rescueEvents: [],
      };
    }
    const { must } = await this.addrs();
    const [mustRaw, loan, vault, policy, rescues] = await Promise.all([
      this.tokenBalance(must, borrower),
      this.readRwa<Tuple<[Address, bigint, bigint, bigint, bigint, string, boolean]>>('loans', [borrower]),
      this.readRwa<Tuple<[Address, bigint, boolean]>>('vaults', [borrower]),
      this.readRwa<Tuple<[Address, bigint, bigint, bigint, boolean, boolean]>>('policies', [borrower]),
      this.readRwa<
        readonly {
          loanId: string;
          description: string;
          amount: bigint;
          healthBefore: bigint;
          healthAfter: bigint;
          at: bigint;
        }[]
      >('getRescueEvents', [borrower]),
    ]);
    const mustBalance = round2(num(mustRaw));
    const [, principal, outstanding, rateBps, collateralRaw, loanId, loanActive] = loan;
    const vaultView = vault[2] ? { balance: round2(num(vault[1])) } : null;
    const policyView = policy[5]
      ? { triggerRatioBps: Number(policy[1]), targetRatioBps: Number(policy[2]), couponSweep: policy[4] }
      : null;
    const rescueEvents = [...rescues].reverse().map((e) => ({
      loanId: e.loanId,
      description: e.description,
      amount: round2(num(e.amount)),
      healthBefore: Number(e.healthBefore),
      healthAfter: Number(e.healthAfter),
      at: new Date(Number(e.at) * 1000).toISOString(),
    }));

    if (!loanActive) {
      return {
        party: borrower,
        wallet: { mustBalance },
        collateral:
          mustBalance > 0
            ? { instrumentId: INSTRUMENT_ID, amount: mustBalance, price, value: round2(mustBalance * price), nextCouponDate: NEXT_COUPON_DATE }
            : null,
        loan: null,
        vault: vaultView,
        policy: null,
        healthRatioBps: null,
        rescueEvents,
      };
    }
    const collateralAmount = num(collateralRaw);
    const out = num(outstanding);
    return {
      party: borrower,
      wallet: { mustBalance },
      collateral: {
        instrumentId: INSTRUMENT_ID,
        amount: collateralAmount,
        price,
        value: round2(collateralAmount * price),
        nextCouponDate: NEXT_COUPON_DATE,
      },
      loan: { loanId, principal: round2(num(principal)), outstanding: round2(out), rateBps: Number(rateBps) },
      vault: vaultView,
      policy: policyView,
      healthRatioBps: computeHealthRatioBps(collateralAmount * price, out),
      rescueEvents,
    };
  }

  async vaultTopUp(amount: number, party?: string): Promise<PositionView> {
    const amt = requirePositiveNumber(amount, 'amount');
    if (!party) throw new LedgerValidationError('X-Cermin-Party header is required');
    const account = this.accountForParty(party);
    const vault = await this.readRwa<Tuple<[Address, bigint, boolean]>>('vaults', [account.address]);
    if (!vault[2]) throw new LedgerValidationError('no Shadow Vault yet — borrow first');
    const { musd } = await this.addrs();
    if (num(await this.tokenBalance(musd, account.address)) < amt) {
      throw new LedgerValidationError('not enough mUSD in your wallet for this top-up');
    }
    await this.ensureGas(account.address);
    await this.sendRwa(account, 'topUpVault', [units(amt)]);
    return this.getPosition(account.address);
  }

  async vaultWithdraw(amount: number, party?: string): Promise<PositionView> {
    const amt = requirePositiveNumber(amount, 'amount');
    if (!party) throw new LedgerValidationError('X-Cermin-Party header is required');
    const account = this.accountForParty(party);
    const vault = await this.readRwa<Tuple<[Address, bigint, boolean]>>('vaults', [account.address]);
    if (!vault[2]) throw new LedgerValidationError('no Shadow Vault yet — borrow first');
    if (amt > num(vault[1])) throw new LedgerValidationError('amount exceeds vault balance');
    await this.ensureGas(account.address);
    await this.sendRwa(account, 'withdrawVault', [units(amt)]);
    return this.getPosition(account.address);
  }

  async borrow(req: BorrowRequest, party?: string): Promise<PositionView> {
    const collateralAmount = requirePositiveNumber(req.collateralAmount, 'collateralAmount');
    const principal = requirePositiveNumber(req.principal, 'principal');
    const triggerRatioBps = validateTriggerBps(req.triggerRatioBps);
    if (typeof req.couponSweep !== 'boolean') throw new LedgerValidationError('couponSweep must be a boolean');
    const vaultDeposit = req.vaultDeposit ?? 0;
    if (typeof vaultDeposit !== 'number' || !Number.isFinite(vaultDeposit) || vaultDeposit < 0) {
      throw new LedgerValidationError('vaultDeposit must be a non-negative number');
    }
    if (vaultDeposit > principal) throw new LedgerValidationError('vaultDeposit cannot exceed the borrowed principal');
    if (!party) throw new LedgerValidationError('X-Cermin-Party header is required');

    const account = this.accountForParty(party);
    const borrower = account.address;
    const loan = await this.readRwa<Tuple<[Address, bigint, bigint, bigint, bigint, string, boolean]>>('loans', [borrower]);
    if (loan[6]) throw new LedgerConflictError('You already have a live loan — repay it before borrowing again.');
    const { must } = await this.addrs();
    const have = num(await this.tokenBalance(must, borrower));
    if (have < collateralAmount) {
      throw new LedgerConflictError(
        `Not enough mUST to post as collateral — claim the faucet first (have ${have}, need ${collateralAmount}).`,
      );
    }

    await this.ensureGas(borrower);
    await this.ensureApprovals(account);
    const guard = this.cfg.guardAgentAddress;
    // Pool's private offer, then the borrower accepts (lock + disburse + Loan).
    await this.sendRwa(this.operator, 'createOffer', [
      borrower,
      guard,
      'loan-1',
      units(principal),
      BigInt(RATE_BPS),
      units(collateralAmount),
    ]);
    await this.sendRwa(account, 'acceptOffer', []);
    // Borrower's GuardPolicy + ShadowVault, both naming the Guard Agent.
    await this.sendRwa(account, 'setGuardPolicy', [
      guard,
      BigInt(triggerRatioBps),
      BigInt(triggerRatioBps + RESTORE_SPREAD_BPS),
      units(MAX_REPAY_PER_EVENT),
      req.couponSweep,
    ]);
    const vault = await this.readRwa<Tuple<[Address, bigint, boolean]>>('vaults', [borrower]);
    if (!vault[2]) {
      await this.sendRwa(account, 'openShadowVault', [guard, units(vaultDeposit)]);
    } else if (vaultDeposit > 0) {
      await this.sendRwa(account, 'topUpVault', [units(vaultDeposit)]);
    }
    return this.getPosition(borrower);
  }

  async simPrice(price: number, party?: string): Promise<PositionView> {
    requirePositiveNumber(price, 'price');
    const { feed } = await this.addrs();
    const instrument = toHex(INSTRUMENT_ID, { size: 32 });
    await this.send(this.operator, feed, rwaPriceFeedAbi, 'updatePrice', [instrument, units(price)]);
    this.history.record(price);
    // Pre-rescue position; the Guard Agent performs guardRepay on its own poll.
    return this.getPosition(party);
  }

  async getPriceHistory(): Promise<{ points: PricePoint[] }> {
    return this.history.getHistory();
  }
}
