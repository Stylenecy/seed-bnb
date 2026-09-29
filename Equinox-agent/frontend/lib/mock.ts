export type Member = {
  id: string;
  name: string;
  address: string;
  joinedAt: string;
  reputation: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  badges: string[];
  voteWeight: number;
  depositConsistency: number;
  groupsActive: number;
};

export type DepositRecord = {
  id: string;
  round: number;
  member: string;
  amount: number;
  timestamp: string;
  status: "paid" | "missed";
};

export type ReviewerVote = {
  reviewer: string;
  weight: number;
  verdict: "APPROVE" | "REJECT" | "PENDING";
  confidence: number;
  reasoning: string;
};

export type WithdrawalRequest = {
  id: string;
  groupId: string;
  requester: string;
  amount: number;
  reason: string;
  reasonCategory: "scheduled" | "emergency" | "early";
  status: "voting" | "fast-track" | "approved" | "rejected" | "auto-rejected" | "executed";
  submittedAt: string;
  deadline: string;
  prevalidation: {
    confidence: number;
    verdict: "PASS" | "REJECT";
    route: "HYBRID_FAST_TRACK" | "NORMAL" | "AUTO_REJECT";
    checks: { label: string; value: string; weight: string; ok: boolean }[];
    reasoningCid: string;
  };
  votes: ReviewerVote[];
};

export type Group = {
  id: string;
  name: string;
  description: string;
  contributionAmount: number;
  roundPeriodDays: number;
  currentRound: number;
  totalRounds: number;
  membersCount: number;
  treasuryBalance: number;
  nextRoundAt: string;
  status: "active" | "completed" | "paused";
  founder: string;
  createdAt: string;
};

export const me: Member = {
  id: "m_me",
  name: "Dewi",
  address: "5GrwvaEFnzHkM5cyq8sQ4QvqasdfXyXzPq9k4mP7t3Bxh7c4",
  joinedAt: "2026-01-04",
  reputation: 812,
  tier: "Platinum",
  badges: ["Consistent Payer", "Trusted Member", "Cross-Group Veteran"],
  voteWeight: 1.18,
  depositConsistency: 100,
  groupsActive: 2,
};

export const members: Member[] = [
  me,
  {
    id: "m_alice",
    name: "Alice",
    address: "5FHneW46xGXgs5AT...4MZX",
    joinedAt: "2025-12-15",
    reputation: 887,
    tier: "Platinum",
    badges: ["Group Founder", "Trusted Member", "Dispute-Free"],
    voteWeight: 1.2,
    depositConsistency: 100,
    groupsActive: 3,
  },
  {
    id: "m_bob",
    name: "Bob",
    address: "5DAAnrj7VHTznn2A...kFta",
    joinedAt: "2026-01-02",
    reputation: 645,
    tier: "Gold",
    badges: ["Consistent Payer"],
    voteWeight: 1.05,
    depositConsistency: 92,
    groupsActive: 1,
  },
  {
    id: "m_charlie",
    name: "Charlie",
    address: "5HGjWAeFD9z6Fjz9...8sLT",
    joinedAt: "2026-01-04",
    reputation: 521,
    tier: "Gold",
    badges: ["Consistent Payer"],
    voteWeight: 1.0,
    depositConsistency: 88,
    groupsActive: 2,
  },
  {
    id: "m_eko",
    name: "Eko",
    address: "5CiPPseXPECbkjWC...hnyD",
    joinedAt: "2026-01-04",
    reputation: 392,
    tier: "Silver",
    badges: [],
    voteWeight: 0.9,
    depositConsistency: 75,
    groupsActive: 1,
  },
];

export const groups: Group[] = [
  {
    id: "g_rt03",
    name: "Arisan Tetangga RT 03",
    description: "Monthly neighborhood pot · Kebayoran Baru",
    contributionAmount: 100,
    roundPeriodDays: 30,
    currentRound: 3,
    totalRounds: 5,
    membersCount: 5,
    treasuryBalance: 1500,
    nextRoundAt: "2026-06-04",
    status: "active",
    founder: "5FHneW46xGXgs5AT...4MZX",
    createdAt: "2026-01-04",
  },
  {
    id: "g_design",
    name: "Designer Pool",
    description: "Indie designers — quarterly tooling fund",
    contributionAmount: 250,
    roundPeriodDays: 90,
    currentRound: 2,
    totalRounds: 4,
    membersCount: 6,
    treasuryBalance: 3000,
    nextRoundAt: "2026-07-22",
    status: "active",
    founder: "5GrwvaEFnzHkM5cyq8sQ4Q",
    createdAt: "2025-11-22",
  },
  {
    id: "g_keluarga",
    name: "Arisan Keluarga Besar",
    description: "Extended family savings · ten siblings",
    contributionAmount: 200,
    roundPeriodDays: 30,
    currentRound: 8,
    totalRounds: 10,
    membersCount: 10,
    treasuryBalance: 1600,
    nextRoundAt: "2026-06-12",
    status: "active",
    founder: "5DAAnrj7VHTznn2A...kFta",
    createdAt: "2025-08-12",
  },
];

export const deposits: DepositRecord[] = [
  { id: "d1", round: 1, member: "Alice", amount: 100, timestamp: "2026-01-04", status: "paid" },
  { id: "d2", round: 1, member: "Bob", amount: 100, timestamp: "2026-01-04", status: "paid" },
  { id: "d3", round: 1, member: "Charlie", amount: 100, timestamp: "2026-01-04", status: "paid" },
  { id: "d4", round: 1, member: "Dewi", amount: 100, timestamp: "2026-01-04", status: "paid" },
  { id: "d5", round: 1, member: "Eko", amount: 100, timestamp: "2026-01-05", status: "paid" },
  { id: "d6", round: 2, member: "Alice", amount: 100, timestamp: "2026-02-04", status: "paid" },
  { id: "d7", round: 2, member: "Bob", amount: 100, timestamp: "2026-02-04", status: "paid" },
  { id: "d8", round: 2, member: "Charlie", amount: 100, timestamp: "2026-02-06", status: "paid" },
  { id: "d9", round: 2, member: "Dewi", amount: 100, timestamp: "2026-02-04", status: "paid" },
  { id: "d10", round: 2, member: "Eko", amount: 100, timestamp: "2026-02-11", status: "paid" },
  { id: "d11", round: 3, member: "Alice", amount: 100, timestamp: "2026-03-04", status: "paid" },
  { id: "d12", round: 3, member: "Bob", amount: 100, timestamp: "2026-03-04", status: "paid" },
  { id: "d13", round: 3, member: "Charlie", amount: 100, timestamp: "2026-03-04", status: "paid" },
  { id: "d14", round: 3, member: "Dewi", amount: 100, timestamp: "2026-03-04", status: "paid" },
  { id: "d15", round: 3, member: "Eko", amount: 100, timestamp: "2026-03-04", status: "paid" },
];

export const requests: WithdrawalRequest[] = [
  {
    id: "r_038",
    groupId: "g_rt03",
    requester: "Dewi",
    amount: 500,
    reason: "Medical emergency — anak masuk IGD malam ini, butuh deposit rumah sakit.",
    reasonCategory: "emergency",
    status: "fast-track",
    submittedAt: "2026-05-18T14:00:00Z",
    deadline: "2026-05-19T02:00:00Z",
    prevalidation: {
      confidence: 0.92,
      verdict: "PASS",
      route: "HYBRID_FAST_TRACK",
      reasoningCid: "bafybeib3xjt7c4ufgmkqaqd2h7c4",
      checks: [
        { label: "Deposit consistency", value: "100% · 3/3 rounds", weight: "25%", ok: true },
        { label: "Reputation score", value: "812 / 1000", weight: "25%", ok: true },
        { label: "Cross-group history", value: "2 groups · clean", weight: "15%", ok: true },
        { label: "Reason plausibility", value: "Medical · verified", weight: "15%", ok: true },
        { label: "Emergency flag", value: "Hospital timestamp match", weight: "10%", ok: true },
        { label: "Outstanding debts", value: "None", weight: "10%", ok: true },
      ],
    },
    votes: [
      {
        reviewer: "Alice",
        weight: 1.2,
        verdict: "APPROVE",
        confidence: 0.88,
        reasoning:
          "Deposit pattern matches member's typical cadence; emergency claim consistent with onchain timestamp; reputation in top tier.",
      },
      {
        reviewer: "Bob",
        weight: 1.05,
        verdict: "APPROVE",
        confidence: 0.81,
        reasoning:
          "Cross-group lookup clean. Reason hash plausible. No outstanding debts.",
      },
      {
        reviewer: "Charlie",
        weight: 1.0,
        verdict: "APPROVE",
        confidence: 0.74,
        reasoning:
          "Light flag on amount vs. average withdrawal — overridden by reputation score 812.",
      },
      {
        reviewer: "Eko",
        weight: 0.9,
        verdict: "PENDING",
        confidence: 0,
        reasoning: "Agent reasoning in progress — awaiting LLM response.",
      },
    ],
  },
  {
    id: "r_037",
    groupId: "g_rt03",
    requester: "Bob",
    amount: 500,
    reason: "Scheduled Round 2 recipient.",
    reasonCategory: "scheduled",
    status: "executed",
    submittedAt: "2026-02-04T10:00:00Z",
    deadline: "2026-02-05T10:00:00Z",
    prevalidation: {
      confidence: 0.96,
      verdict: "PASS",
      route: "HYBRID_FAST_TRACK",
      reasoningCid: "bafy…7t3b",
      checks: [
        { label: "Deposit consistency", value: "100%", weight: "25%", ok: true },
        { label: "Reputation score", value: "645 / 1000", weight: "25%", ok: true },
        { label: "Scheduled recipient", value: "Round 2 match", weight: "20%", ok: true },
        { label: "Outstanding debts", value: "None", weight: "10%", ok: true },
      ],
    },
    votes: [
      { reviewer: "Alice", weight: 1.2, verdict: "APPROVE", confidence: 0.92, reasoning: "Scheduled. Auto-approve baseline." },
      { reviewer: "Charlie", weight: 1.0, verdict: "APPROVE", confidence: 0.9, reasoning: "Match." },
      { reviewer: "Dewi", weight: 1.18, verdict: "APPROVE", confidence: 0.88, reasoning: "Match." },
      { reviewer: "Eko", weight: 0.9, verdict: "APPROVE", confidence: 0.82, reasoning: "Match." },
    ],
  },
  {
    id: "r_036",
    groupId: "g_rt03",
    requester: "5HnewMember…",
    amount: 1000,
    reason: "Need cash. Trust me.",
    reasonCategory: "early",
    status: "auto-rejected",
    submittedAt: "2026-04-22T07:00:00Z",
    deadline: "2026-04-22T07:00:10Z",
    prevalidation: {
      confidence: 0.12,
      verdict: "REJECT",
      route: "AUTO_REJECT",
      reasoningCid: "bafy…rej9",
      checks: [
        { label: "Deposit consistency", value: "0 / 1 round", weight: "25%", ok: false },
        { label: "Reputation score", value: "0 / 1000", weight: "25%", ok: false },
        { label: "Cross-group history", value: "No history", weight: "15%", ok: false },
        { label: "Reason plausibility", value: "Vague — insufficient detail", weight: "15%", ok: false },
        { label: "Group age (member)", value: "2 days", weight: "10%", ok: false },
      ],
    },
    votes: [],
  },
];

export function getGroup(id: string) {
  return groups.find((g) => g.id === id);
}

export function getRequest(id: string) {
  return requests.find((r) => r.id === id);
}

export function requestsForGroup(groupId: string) {
  return requests.filter((r) => r.groupId === groupId);
}

export const activity = [
  {
    id: "a1",
    type: "vote",
    actor: "Alice",
    summary: "voted APPROVE on request #038",
    timestamp: "12 min ago",
    href: "/app/groups/g_rt03/requests/r_038",
  },
  {
    id: "a2",
    type: "request",
    actor: "Dewi",
    summary: "submitted withdrawal #038 · 500 POT · emergency",
    timestamp: "1 hour ago",
    href: "/app/groups/g_rt03/requests/r_038",
  },
  {
    id: "a3",
    type: "deposit",
    actor: "Eko",
    summary: "deposited 100 POT for Round 3",
    timestamp: "3 days ago",
    href: "/app/groups/g_rt03",
  },
  {
    id: "a4",
    type: "badge",
    actor: "Dewi",
    summary: "earned Cross-Group Veteran badge",
    timestamp: "1 week ago",
    href: "/app/profile",
  },
  {
    id: "a5",
    type: "execution",
    actor: "Treasury",
    summary: "released 500 POT to Bob for request #037",
    timestamp: "3 weeks ago",
    href: "/app/groups/g_rt03/requests/r_037",
  },
];
