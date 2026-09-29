import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LedgerConflictError, LedgerValidationError, MockLedger, partyHintForUsername } from '../src/ledger.ts';

// Demo numbers per STATE.md §2:
//   collateral 10,000 mUST @ 1.00 -> $10,000; loan principal 6,000 mUSD -> Health Ratio ~166%
//   trigger 13000 bps (130%), target 14500 bps (145%), maxRepayPerEvent 2,000, vault 1,500
//
// The default (no-party) borrower is the legacy pre-seeded demo scene; every
// distinct X-Cermin-Party is its own onboarded self-service user.

// --- legacy demo scene (no party header) -----------------------------------

test('legacy position reflects seeded demo numbers with correct Health Ratio', async () => {
  const ledger = new MockLedger();
  const position = await ledger.getPosition();

  assert.equal(position.party, null);
  assert.equal(position.wallet.mustBalance, 0);
  assert.equal(position.collateral?.instrumentId, 'mUST-2030');
  assert.equal(position.collateral?.amount, 10000);
  assert.equal(position.collateral?.price, 1.0);
  assert.equal(position.collateral?.value, 10000);

  assert.equal(position.loan?.principal, 6000);
  assert.equal(position.loan?.outstanding, 6000);
  assert.equal(position.loan?.rateBps, 500);

  assert.equal(position.vault?.balance, 1500);
  assert.equal(position.policy?.triggerRatioBps, 13000);
  assert.equal(position.policy?.targetRatioBps, 14500);

  // (10000 * 1.00) / 6000 = 1.66666... -> 16667 bps
  assert.equal(position.healthRatioBps, 16667);
  assert.deepEqual(position.rescueEvents, []);
});

test('sim price drop above trigger does not fire a rescue', async () => {
  const ledger = new MockLedger();
  const position = await ledger.simPrice(0.85);

  // (10000 * 0.85) / 6000 = 1.41666... -> 14167 bps, still >= 13000 trigger
  assert.equal(position.healthRatioBps, 14167);
  assert.equal(position.loan?.outstanding, 6000);
  assert.equal(position.vault?.balance, 1500);
  assert.deepEqual(position.rescueEvents, []);
});

test('sim price drop below trigger fires a rescue using the documented trigger math', async () => {
  const ledger = new MockLedger();
  const position = await ledger.simPrice(0.76);

  assert.equal(position.collateral?.price, 0.76);
  assert.equal(position.collateral?.value, 7600);

  // Rescue repays min(needed, maxRepayPerEvent, balance) = min(758.62, 2000, 1500) = 758.62
  assert.equal(position.loan?.outstanding, 5241.38);
  assert.equal(position.vault?.balance, 741.38);
  // Ratio restored to ~145% (14500 bps target)
  assert.equal(position.healthRatioBps, 14500);

  assert.equal(position.rescueEvents.length, 1);
  const event = position.rescueEvents[0];
  assert.equal(event.loanId, 'loan-1');
  assert.equal(event.amount, 758.62);
  assert.equal(event.healthBefore, 12667);
  assert.equal(event.healthAfter, 14500);
  assert.match(event.description, /Shadow Vault/);
});

test('a second price drop below trigger fires a second rescue on top of the first (newest first)', async () => {
  const ledger = new MockLedger();
  await ledger.simPrice(0.76); // first rescue: outstanding 5241.38, vault 741.38
  const position = await ledger.simPrice(0.5); // sharp further drop

  assert.equal(position.rescueEvents.length, 2);
  assert.ok(position.vault!.balance >= 0);
  // Newest first: index 0 is the second (capped by the remaining 741.38 balance).
  assert.ok(position.rescueEvents[0].amount <= 741.38);
});

test('sim price rejects non-positive price', async () => {
  const ledger = new MockLedger();
  await assert.rejects(() => ledger.simPrice(0), LedgerValidationError);
  await assert.rejects(() => ledger.simPrice(-1), LedgerValidationError);
});

test('vault topup / withdraw adjust the legacy vault balance', async () => {
  const ledger = new MockLedger();
  assert.equal((await ledger.vaultTopUp(500)).vault?.balance, 2000);
  assert.equal((await ledger.vaultWithdraw(500)).vault?.balance, 1500);
});

test('vault withdraw rejects amounts exceeding balance', async () => {
  const ledger = new MockLedger();
  await assert.rejects(() => ledger.vaultWithdraw(5000), LedgerValidationError);
});

test('vault topup/withdraw reject non-positive or non-numeric amounts', async () => {
  const ledger = new MockLedger();
  await assert.rejects(() => ledger.vaultTopUp(0), LedgerValidationError);
  await assert.rejects(() => ledger.vaultTopUp(-10), LedgerValidationError);
  // @ts-expect-error deliberately wrong runtime type to exercise the defensive check
  await assert.rejects(() => ledger.vaultTopUp('100'), LedgerValidationError);
});

// --- slugify ---------------------------------------------------------------

test('partyHintForUsername slugifies to cermin-u-<slug>', () => {
  assert.equal(partyHintForUsername('Alice'), 'cermin-u-alice');
  assert.equal(partyHintForUsername('  Bob Smith! '), 'cermin-u-bob-smith');
  assert.equal(partyHintForUsername('user@2030'), 'cermin-u-user-2030');
  assert.throws(() => partyHintForUsername('!!!'), LedgerValidationError);
});

// --- self-service: onboard -> faucet -> borrow -----------------------------

test('onboard is idempotent per username (returning user resolves the same party)', async () => {
  const ledger = new MockLedger();
  const first = await ledger.onboard('Alice');
  assert.equal(first.created, true);
  assert.match(first.party, /^cermin-u-alice::/);

  const again = await ledger.onboard('Alice');
  assert.equal(again.created, false);
  assert.equal(again.party, first.party);

  // A different name gets a different party.
  const bob = await ledger.onboard('Bob');
  assert.notEqual(bob.party, first.party);
});

test('a fresh onboarded user is empty (no loan, no mUST) until they claim the faucet', async () => {
  const ledger = new MockLedger();
  const { party } = await ledger.onboard('Alice');
  const empty = await ledger.getPosition(party);
  assert.equal(empty.party, party);
  assert.equal(empty.wallet.mustBalance, 0);
  assert.equal(empty.loan, null);
  assert.equal(empty.vault, null);
  assert.equal(empty.policy, null);
  assert.equal(empty.healthRatioBps, null);
});

test('faucet mints 10,000 mUST once and refuses a double claim (409)', async () => {
  const ledger = new MockLedger();
  const { party } = await ledger.onboard('Alice');
  const claim = await ledger.faucet(party);
  assert.equal(claim.minted, 10000);
  assert.equal(claim.mustBalance, 10000);
  assert.equal((await ledger.getPosition(party)).wallet.mustBalance, 10000);

  await assert.rejects(() => ledger.faucet(party), LedgerConflictError);
});

test('borrow originates a loan + GuardPolicy (target = trigger + 1500) + funded ShadowVault', async () => {
  const ledger = new MockLedger();
  const { party } = await ledger.onboard('Alice');
  await ledger.faucet(party);
  const pos = await ledger.borrow(
    { collateralAmount: 10000, principal: 6000, triggerRatioBps: 13000, couponSweep: true, vaultDeposit: 1500 },
    party,
  );

  assert.equal(pos.collateral?.amount, 10000);
  assert.equal(pos.loan?.principal, 6000);
  assert.equal(pos.loan?.outstanding, 6000);
  assert.equal(pos.policy?.triggerRatioBps, 13000);
  assert.equal(pos.policy?.targetRatioBps, 14500); // trigger + 1500
  assert.equal(pos.policy?.couponSweep, true);
  assert.equal(pos.vault?.balance, 1500); // abstract reserve — not drawn from faucet mUST
  assert.equal(pos.healthRatioBps, 16667);
  assert.equal(pos.wallet.mustBalance, 0); // the full 10000 faucet is locked as collateral
});

test('borrow with a vault deposit within remaining mUST, and 409 when a loan already exists', async () => {
  const ledger = new MockLedger();
  const { party } = await ledger.onboard('Carol');
  await ledger.faucet(party); // 10000 mUST
  // Post 8000 as collateral, keep 2000 for the vault deposit.
  const pos = await ledger.borrow(
    { collateralAmount: 8000, principal: 5000, triggerRatioBps: 12000, couponSweep: false, vaultDeposit: 2000 },
    party,
  );
  assert.equal(pos.collateral?.amount, 8000);
  assert.equal(pos.vault?.balance, 2000); // abstract reserve, not drawn from mUST
  assert.equal(pos.wallet.mustBalance, 2000); // 10000 faucet - 8000 locked collateral
  assert.equal(pos.policy?.targetRatioBps, 13500); // 12000 + 1500

  // A second borrow for the same party is refused.
  await assert.rejects(
    () => ledger.borrow({ collateralAmount: 8000, principal: 5000, triggerRatioBps: 12000, couponSweep: false }, party),
    LedgerConflictError,
  );
});

test('borrow refuses when the user has not claimed the faucet', async () => {
  const ledger = new MockLedger();
  const { party } = await ledger.onboard('Dave');
  await assert.rejects(
    () => ledger.borrow({ collateralAmount: 10000, principal: 6000, triggerRatioBps: 13000, couponSweep: false }, party),
    LedgerConflictError,
  );
});

test('borrow rejects invalid fields', async () => {
  const ledger = new MockLedger();
  const { party } = await ledger.onboard('Erin');
  await ledger.faucet(party);
  await assert.rejects(
    () => ledger.borrow({ collateralAmount: 0, principal: 6000, triggerRatioBps: 13000, couponSweep: false }, party),
    LedgerValidationError,
  );
  await assert.rejects(
    // @ts-expect-error deliberately wrong runtime type
    () => ledger.borrow({ collateralAmount: 10000, principal: 6000, triggerRatioBps: 'high', couponSweep: false }, party),
    LedgerValidationError,
  );
  await assert.rejects(
    // @ts-expect-error deliberately wrong runtime type
    () => ledger.borrow({ collateralAmount: 10000, principal: 6000, triggerRatioBps: 13000, couponSweep: 'yes' }, party),
    LedgerValidationError,
  );
});

// --- multi-user isolation + independent guard rescues ----------------------

test('two users borrow independently; a price drop rescues BOTH, each seeing only their own position', async () => {
  const ledger = new MockLedger();
  const alice = (await ledger.onboard('Alice')).party;
  const bob = (await ledger.onboard('Bob')).party;
  await ledger.faucet(alice);
  await ledger.faucet(bob);

  // Different amounts + different strategies.
  await ledger.borrow({ collateralAmount: 10000, principal: 6000, triggerRatioBps: 13000, couponSweep: true, vaultDeposit: 0 }, alice);
  await ledger.borrow({ collateralAmount: 10000, principal: 7000, triggerRatioBps: 12000, couponSweep: false, vaultDeposit: 0 }, bob);
  // Fund each vault so a rescue has something to draw on.
  await ledger.vaultTopUp(1500, alice);
  await ledger.vaultTopUp(1500, bob);

  // A single global price move breaches both loans; both are rescued.
  const afterAlice = await ledger.simPrice(0.76, alice);
  const afterBob = await ledger.getPosition(bob);

  // Alice: 12667 < 13000 trigger -> rescued to 14500.
  assert.equal(afterAlice.rescueEvents.length, 1);
  assert.equal(afterAlice.healthRatioBps, 14500);
  assert.equal(afterAlice.loan?.outstanding, 5241.38);
  // Bob: 7600/7000 = 10857 < 12000 trigger -> rescued to his own target 13500.
  assert.equal(afterBob.rescueEvents.length, 1);
  assert.equal(afterBob.healthRatioBps, 13500);

  // Isolation: each view carries ONLY its own party, loan and single rescue —
  // never the other user's outstanding, and never each other's rescue events.
  assert.equal(afterAlice.party, alice);
  assert.equal(afterBob.party, bob);
  assert.notEqual(afterAlice.loan?.outstanding, afterBob.loan?.outstanding);
  assert.equal(afterAlice.rescueEvents.length, 1);
  assert.equal(afterBob.rescueEvents.length, 1);
});
