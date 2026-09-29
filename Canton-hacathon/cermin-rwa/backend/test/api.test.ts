import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { createApp } from '../src/index.ts';
import { MockLedger } from '../src/ledger.ts';

async function startServer(): Promise<{ baseUrl: string; server: Server }> {
  const app = createApp(new MockLedger());
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('expected server to bind to a port');
  }
  return { baseUrl: `http://127.0.0.1:${address.port}`, server };
}

function stopServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readJson(res: Response): Promise<any> {
  return res.json();
}

function post(baseUrl: string, path: string, body: unknown, party?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (party) headers['X-Cermin-Party'] = party;
  return fetch(`${baseUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
}

test('GET /api/position returns the binding response shape with demo numbers (legacy scene)', async () => {
  const { baseUrl, server } = await startServer();
  try {
    const res = await fetch(`${baseUrl}/api/position`);
    assert.equal(res.status, 200);
    const body = await readJson(res);

    assert.deepEqual(Object.keys(body).sort(), [
      'collateral',
      'healthRatioBps',
      'loan',
      'party',
      'policy',
      'rescueEvents',
      'vault',
      'wallet',
    ]);
    assert.equal(body.party, null);
    assert.equal(body.wallet.mustBalance, 0);
    assert.equal(body.collateral.amount, 10000);
    assert.equal(body.loan.outstanding, 6000);
    assert.equal(body.vault.balance, 1500);
    assert.equal(body.healthRatioBps, 16667);
    assert.deepEqual(body.rescueEvents, []);
  } finally {
    await stopServer(server);
  }
});

test('POST /api/onboard returns a party; a returning username resolves the same party', async () => {
  const { baseUrl, server } = await startServer();
  try {
    const res = await post(baseUrl, '/api/onboard', { username: 'Alice' });
    assert.equal(res.status, 200);
    const body = await readJson(res);
    assert.match(body.party, /^cermin-u-alice::/);
    assert.equal(body.created, true);

    const again = await readJson(await post(baseUrl, '/api/onboard', { username: 'Alice' }));
    assert.equal(again.party, body.party);
    assert.equal(again.created, false);
  } finally {
    await stopServer(server);
  }
});

test('POST /api/onboard rejects an empty username with 400', async () => {
  const { baseUrl, server } = await startServer();
  try {
    assert.equal((await post(baseUrl, '/api/onboard', {})).status, 400);
    assert.equal((await post(baseUrl, '/api/onboard', { username: '   ' })).status, 400);
  } finally {
    await stopServer(server);
  }
});

test('POST /api/faucet mints to the header party and refuses a double claim with 409', async () => {
  const { baseUrl, server } = await startServer();
  try {
    const { party } = await readJson(await post(baseUrl, '/api/onboard', { username: 'Alice' }));

    const claim = await post(baseUrl, '/api/faucet', {}, party);
    assert.equal(claim.status, 200);
    assert.equal((await readJson(claim)).mustBalance, 10000);

    const again = await post(baseUrl, '/api/faucet', {}, party);
    assert.equal(again.status, 409);
    assert.match((await readJson(again)).error, /one claim per user/i);
  } finally {
    await stopServer(server);
  }
});

test('POST /api/faucet without a party header returns 400', async () => {
  const { baseUrl, server } = await startServer();
  try {
    assert.equal((await post(baseUrl, '/api/faucet', {})).status, 400);
  } finally {
    await stopServer(server);
  }
});

test('POST /api/onboard rate-limits repeated requests from the same IP with 429', async () => {
  const { baseUrl, server } = await startServer();
  try {
    for (let i = 0; i < 5; i++) {
      const res = await post(baseUrl, '/api/onboard', { username: `user-${i}` });
      assert.equal(res.status, 200, `request ${i} should succeed`);
    }
    const sixth = await post(baseUrl, '/api/onboard', { username: 'user-6' });
    assert.equal(sixth.status, 429);
  } finally {
    await stopServer(server);
  }
});

test('full self-service journey: onboard -> faucet -> borrow -> per-user position', async () => {
  const { baseUrl, server } = await startServer();
  try {
    const { party } = await readJson(await post(baseUrl, '/api/onboard', { username: 'Alice' }));
    await post(baseUrl, '/api/faucet', {}, party);

    const borrowRes = await post(
      baseUrl,
      '/api/borrow',
      { collateralAmount: 10000, principal: 6000, triggerRatioBps: 13000, couponSweep: true, vaultDeposit: 1500 },
      party,
    );
    assert.equal(borrowRes.status, 200);
    const pos = await readJson(borrowRes);
    assert.equal(pos.party, party);
    assert.equal(pos.loan.outstanding, 6000);
    assert.equal(pos.policy.targetRatioBps, 14500);
    assert.equal(pos.vault.balance, 1500);
    assert.equal(pos.healthRatioBps, 16667);

    // A second borrow for the same party is a 409.
    const dup = await post(
      baseUrl,
      '/api/borrow',
      { collateralAmount: 10000, principal: 6000, triggerRatioBps: 13000, couponSweep: true },
      party,
    );
    assert.equal(dup.status, 409);

    // The per-user GET reflects the same borrower.
    const getRes = await fetch(`${baseUrl}/api/position`, { headers: { 'X-Cermin-Party': party } });
    assert.equal((await readJson(getRes)).party, party);
  } finally {
    await stopServer(server);
  }
});

test('borrow before the faucet is claimed returns 409', async () => {
  const { baseUrl, server } = await startServer();
  try {
    const { party } = await readJson(await post(baseUrl, '/api/onboard', { username: 'Bob' }));
    const res = await post(
      baseUrl,
      '/api/borrow',
      { collateralAmount: 10000, principal: 6000, triggerRatioBps: 13000, couponSweep: false },
      party,
    );
    assert.equal(res.status, 409);
  } finally {
    await stopServer(server);
  }
});

test('a global price drop rescues two independent users, each seeing only their own view', async () => {
  const { baseUrl, server } = await startServer();
  try {
    const alice = (await readJson(await post(baseUrl, '/api/onboard', { username: 'Alice' }))).party;
    const bob = (await readJson(await post(baseUrl, '/api/onboard', { username: 'Bob' }))).party;
    for (const p of [alice, bob]) {
      await post(baseUrl, '/api/faucet', {}, p);
      await post(baseUrl, '/api/borrow', { collateralAmount: 10000, principal: 6000, triggerRatioBps: 13000, couponSweep: false, vaultDeposit: 1500 }, p);
    }

    // Price move is global; the returned view is the caller's own.
    const aliceView = await readJson(await post(baseUrl, '/api/sim/price', { price: 0.76 }, alice));
    assert.equal(aliceView.party, alice);
    assert.equal(aliceView.rescueEvents.length, 1);
    assert.equal(aliceView.healthRatioBps, 14500);

    const bobView = await readJson(
      await fetch(`${baseUrl}/api/position`, { headers: { 'X-Cermin-Party': bob } }),
    );
    assert.equal(bobView.party, bob);
    assert.equal(bobView.rescueEvents.length, 1);
    assert.equal(bobView.healthRatioBps, 14500);
  } finally {
    await stopServer(server);
  }
});

test('POST /api/sim/price rejects a non-positive price with 400', async () => {
  const { baseUrl, server } = await startServer();
  try {
    const res = await post(baseUrl, '/api/sim/price', { price: -1 });
    assert.equal(res.status, 400);
    assert.match((await readJson(res)).error, /positive/);
  } finally {
    await stopServer(server);
  }
});

test('POST /api/vault/topup and /api/vault/withdraw adjust the legacy vault balance', async () => {
  const { baseUrl, server } = await startServer();
  try {
    const topupRes = await post(baseUrl, '/api/vault/topup', { amount: 300 });
    assert.equal(topupRes.status, 200);
    assert.equal((await readJson(topupRes)).vault.balance, 1800);

    const withdrawRes = await post(baseUrl, '/api/vault/withdraw', { amount: 1800 });
    assert.equal(withdrawRes.status, 200);
    assert.equal((await readJson(withdrawRes)).vault.balance, 0);
  } finally {
    await stopServer(server);
  }
});

test('POST /api/vault/withdraw rejects an amount exceeding balance with 400', async () => {
  const { baseUrl, server } = await startServer();
  try {
    const res = await post(baseUrl, '/api/vault/withdraw', { amount: 999999 });
    assert.equal(res.status, 400);
  } finally {
    await stopServer(server);
  }
});

test('malformed JSON body is rejected with 400, not a 500 crash', async () => {
  const { baseUrl, server } = await startServer();
  try {
    const res = await fetch(`${baseUrl}/api/sim/price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not valid json',
    });
    assert.equal(res.status, 400);
  } finally {
    await stopServer(server);
  }
});

test('GET /api/price-history returns a synthetic 30-day backfill plus the seeded observed price', async () => {
  const { baseUrl, server } = await startServer();
  try {
    const res = await fetch(`${baseUrl}/api/price-history`);
    assert.equal(res.status, 200);
    const body = await readJson(res);
    assert.ok(Array.isArray(body.points));
    // MockLedger seeds price 1.0 at construction, so this is populated even
    // before any /api/position or /api/sim/price call.
    assert.equal(body.points.length, 31); // 30 synthetic days + 1 observed
    assert.ok(body.points.slice(0, 30).every((p: { synthetic?: boolean }) => p.synthetic === true));
    const last = body.points[body.points.length - 1];
    assert.equal(last.synthetic, undefined);
    assert.equal(last.price, 1.0);
  } finally {
    await stopServer(server);
  }
});

test('GET /api/price-history dedupes repeated GET /api/position reads at the same price', async () => {
  const { baseUrl, server } = await startServer();
  try {
    await fetch(`${baseUrl}/api/position`);
    await fetch(`${baseUrl}/api/position`);
    await fetch(`${baseUrl}/api/position`);
    const body = await readJson(await fetch(`${baseUrl}/api/price-history`));
    assert.equal(body.points.length, 31); // still just the one observed point
  } finally {
    await stopServer(server);
  }
});

test('GET /api/price-history grows (and reflects the new price) after a genuine price move', async () => {
  const { baseUrl, server } = await startServer();
  try {
    await post(baseUrl, '/api/sim/price', { price: 0.76 });
    const body = await readJson(await fetch(`${baseUrl}/api/price-history`));
    assert.equal(body.points.length, 32); // +1 observed tick
    const last = body.points[body.points.length - 1];
    assert.equal(last.price, 0.76);
    assert.equal(last.synthetic, undefined);
  } finally {
    await stopServer(server);
  }
});

test('unknown /api route returns 404', async () => {
  const { baseUrl, server } = await startServer();
  try {
    const res = await fetch(`${baseUrl}/api/nope`);
    assert.equal(res.status, 404);
  } finally {
    await stopServer(server);
  }
});
