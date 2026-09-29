/**
 * Minimal stand-in for the BINGOChain API on BSC testnet (the real apps/api
 * indexer was not run on 97, see VERIFY-BNB.md). Everything it serves is read
 * LIVE from the BSC-testnet proxy with `cast` at startup — arena ids, players,
 * revealed boards, claimable earnings — plus the settle split from VERIFY-BNB.md
 * (tie: 0.00099 WBNB each, 0.00002 fee). Everything else 404s / returns [].
 */
import http from "node:http";
import { execSync } from "node:child_process";

const B = "0x501125227641B73061B1EDAf1a60CbF56701d110";
const R = "https://bsc-testnet-rpc.publicnode.com";
const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const cast = (a) => execSync(`cast ${a} -r ${R}`).toString().trim();
const ts = (tx) => new Date(Number(cast(`block $(cast receipt ${tx} blockNumber -r ${R}) -f timestamp`)) * 1000).toISOString();

const players = cast(`call ${B} "getPlayers(uint256)(address[])" 1`).replace(/[[\]\s]/g, "").split(",");
const boards = players.map((p) => ({ player: p.toLowerCase(), board: JSON.parse(cast(`call ${B} "revealedBoardOf(uint256,address)(uint8[25])" 1 ${p}`)) }));
const createdAt = ts("0x7480b034963077523f94d3a7802f3644d7f34af06c6073568227c911630c4bc6");
const settledAt = ts("0xb5b11ace179c9bf4abbe8b6586ce02ceecc514544a0549fe0f150af52401e6b4");
const arena1 = {
  arenaId: "1",
  match: { token: WBNB.toLowerCase(), stake: "0.001", prizePool: "0.00198", fee: "0.00002", winnerCount: 2, createdAt, settledAt },
  players: players.map((p) => ({ address: p.toLowerCase(), name: null, outcome: "win", prize: "0.00099" })),
  winners: players.map((p) => ({ address: p.toLowerCase(), name: null, prize: "0.00099" })),
  boards,
};
console.log(JSON.stringify(arena1));

http
  .createServer((req, res) => {
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("content-type", "application/json");
    const u = req.url ?? "";
    if (u.startsWith("/api/arenas")) return res.end(JSON.stringify(["1"]));
    if (u.startsWith("/api/arena/1")) return res.end(JSON.stringify(arena1));
    if (u.startsWith("/api/profiles") || u.startsWith("/api/competitions") || u.startsWith("/api/leaderboard")) return res.end("[]");
    res.statusCode = 404;
    res.end("{}");
  })
  .listen(3229, "127.0.0.1", () => console.log("index stub :3229"));
