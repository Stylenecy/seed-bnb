// The BINGOChain team. Each role becomes one agent member on the shared board
// (Coworking workspace "bingochain", project BINGO) with its own API key.
// `taskTypes` is what that worker pulls from `whatsNext`, `focus` is its turf.
// Add a worker = add a row, re-run `bw bootstrap` then `bw kits`.

export const PROJECT = {
  key: 'BINGO',
  name: 'Bingochain',
  description:
    'Daily collaborative dev + growth of BINGOChain - contracts, web (MiniPay), api, testing, marketing, docs, economy. All coordination happens here.',
};

export const ROSTER = [
  { role: 'contracts', displayName: 'Smart Contract Engineer', taskTypes: ['code', 'code_audit'], focus: 'contracts/ (Foundry, commit-reveal arena, $LANCE settle, slashing, 1% fee + gas reserve)' },
  { role: 'frontend',  displayName: 'Frontend / MiniApp Engineer', taskTypes: ['code', 'design', 'bug'], focus: 'apps/web (Next.js, MiniPay auto-connect, gasless sign, arena UI)' },
  { role: 'backend',   displayName: 'Backend / API Engineer', taskTypes: ['code', 'bug', 'devops'], focus: 'apps/api (bingochain-api on Railway)' },
  { role: 'tester',    displayName: 'QA & Game Tester', taskTypes: ['qa', 'bug'], focus: 'arena lifecycle tests, scripts/play-mainnet.mjs stress, the player wallets/' },
  { role: 'marketing', displayName: 'Marketing & Growth', taskTypes: ['marketing', 'content'], focus: 'launch posts, MiniPay Discover listing, socials, referral program' },
  { role: 'devrel',    displayName: 'Content & Docs', taskTypes: ['documentation', 'content'], focus: 'README, docs/, demo video, player guides' },
  { role: 'security',  displayName: 'Security Auditor', taskTypes: ['code_audit'], focus: 'contracts (commit-reveal, slashing, payout rounding) + api' },
  { role: 'economy',   displayName: 'Game & Economy Designer', taskTypes: ['research', 'design', 'data_analysis'], focus: 'arena params (stake, 2-6 players, gas reserve), $LANCE economy, referral payout' },
];

export const roleByName = (displayName) => ROSTER.find((r) => r.displayName === displayName);

// Starter backlog - real, repo-grounded BINGOChain work. `owner` is a roster
// role (the assignee) or 'owner' (the orchestrator). `col` defaults to 'todo';
// 'in_progress' marks a standing task that never closes.
export const BACKLOG = [
  { owner: 'contracts', type: 'code',          priority: 3, title: 'Invariant test: pot conservation on settle', description: 'Add a Foundry invariant that the pot always splits exactly into 1% protocol fee + winner payout + gas-reserve rollover, with no wei lost or minted across the full commit-reveal-settle lifecycle.' },
  { owner: 'frontend',  type: 'code',          priority: 3, title: 'Verify MiniPay auto-connect + gasless sign on the live arena flow', description: 'Confirm mandatory MiniPay auto-connect and the gasless (gas-reserve-sponsored) sign path work end-to-end on create/commit/call/claim/reveal. Fix any break.' },
  { owner: 'backend',   type: 'code',          priority: 2, title: 'Add an arena lifecycle health/metrics endpoint to bingochain-api', description: 'Expose arena counts by phase (open/committing/playing/revealing/settled) + last-block-indexed, so we can monitor live arenas and catch stuck games.' },
  { owner: 'tester',    type: 'qa',            priority: 3, title: 'Expand play-mainnet stress harness + document arena failure modes', description: 'Extend scripts/play-mainnet.mjs wave mode coverage (timeouts, refusal-to-reveal, false BINGO) and write a failure-mode doc. Do NOT spend real funds in CI - dry-run / Sepolia only.' },
  { owner: 'marketing', type: 'marketing',     priority: 3, title: 'Draft the MiniPay Discover listing submission', description: 'Prepare the Discover submission: app URL, 360px screenshot spec, ToS + Privacy links, Add Cash deeplink, no EIP-5792. Follow the MiniPay Discover checklist.' },
  { owner: 'marketing', type: 'content',       priority: 2, title: 'Write 3 launch posts for the next arena season', description: 'Three short posts (X/Farcaster) for the next BINGOChain arena season. Plain ASCII only - no em/en-dashes (AI tell). Lead with the provably-fair commit-reveal hook.' },
  { owner: 'devrel',    type: 'documentation', priority: 2, title: 'Refresh README economics + write a 60s demo video script', description: 'Update the README economics section to current arena params and draft a 60-second demo video script (create -> commit -> play -> reveal -> settle).' },
  { owner: 'security',  type: 'code_audit',    priority: 3, title: 'Re-review commit-reveal slashing + payout rounding', description: 'Audit the slash path (mismatched hash / refusal to reveal) and payout rounding (1% fee + gas-reserve rollover) for value leaks or griefing. Report findings, no fixes.' },
  { owner: 'economy',   type: 'research',      priority: 1, title: 'Tune arena params + $LANCE redemption impact', description: 'Analyze min stake (1 CELO), player count (2-6), and gas-reserve sizing vs real play data; model the $LANCE redemption impact. Recommend params, do not change contracts.' },
  { owner: 'owner',     type: 'generic',       priority: 4, col: 'in_progress', title: 'Daily standup', description: 'Every worker posts yesterday / today / blockers as a comment here at the start of its session. Keep this task open.' },
];
