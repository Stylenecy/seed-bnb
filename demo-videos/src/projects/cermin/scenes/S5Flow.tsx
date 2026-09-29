import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Camera,
  clamp,
  CoinDot,
  ComicPanel,
  ComicText,
  fadeUp,
  Halftone,
  INK,
  InkFrame,
  Person,
  PremiumBg,
  Pulse,
  Robot,
  Sfx,
  SpeedBurst,
  steppedCount,
  useBeatPunch,
  useSceneClock,
  Vault,
} from "../../../kit";
import type { CamKey } from "../../../kit";
import { C, CHAIN, F, SCREEN } from "../theme";
import { BAR } from "../timeline";
import { ACTIVITY, CARDS, CropShot, HERO, HERO_DIP, RealTag, TxChip } from "../ui";

/**
 * S5 · LIVE FLOW (bars 24–35). The REAL Cermin dashboard on REAL BSC TESTNET
 * (scripts/cermin/live.mjs, 2026-09-27): a live vault driven through the UI,
 * the testnet MockPriceFeed moved by its owner, skim called as the keeper.
 * Every tx chip is the real hash of that step. One beat of the story per bar:
 *   24 open ($1,200 Shadow, ICR 200%) → cards b2     25 the rules (Strategy card)
 *   26 PUMP: mock feed $120k → $132k (+10%)            27 SKIM → debt 2,640, Shadow $1,320
 *   28 DIP: $132k → $90k, ICR 136% "Defend now"        29 DEFEND (UI) → ICR 140%, debt 2,571
 *   30 camera on the gauge: safe, far from liquidation 31 activity feed (on-chain events)
 *   32 permissionless: defend() has no owner check      33 WITHDRAW 100 MUSD
 *   34 CLOSE → debt 0, 0.04 tBNB returned
 */
const HX = 220;
const HY = 150;
const HW = 1480;
const HK = HW / HERO.sw;
const DY = 520; // detail slot top

const Delta: React.FC<{ at: number; label: string; from: string; to: string; color: string }> = ({ at, label, from, to, color }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 14,
        padding: "12px 22px",
        background: "#fffaf0",
        border: `4px solid ${INK}`,
        boxShadow: `6px 6px 0 ${INK}`,
        fontFamily: F.sans,
        fontWeight: 800,
        fontSize: 30,
        color: INK,
        whiteSpace: "nowrap",
        ...fadeUp(f, at, 8, 18),
      }}
    >
      <span style={{ fontFamily: F.comic, fontSize: 30, letterSpacing: "0.04em", color: C.ink2 }}>{label}</span>
      <span>{from}</span>
      <span style={{ color }}>→ {to}</span>
    </div>
  );
};

/** Comic price board: a mock-feed price that ticks on the beats. */
const PriceBoard: React.FC<{ at: number; ticks: number[]; values: number[]; up: boolean; punch: number }> = ({ at, ticks, values, up, punch }) => {
  const f = useCurrentFrame();
  const v = steppedCount(f, ticks, values);
  const col = up ? "#8fe39f" : C.dangerHi;
  return (
    <ComicPanel at={at} x={220} y={DY + 10} w={900} h={420} rot={up ? -1.5 : 1.5} bg={up ? "#DDEBCF" : "#F4D5C0"} bg2={up ? "#A9C98F" : "#E8A07A"} from={up ? "up" : "down"} punch={punch}>
      <div style={{ padding: "34px 44px" }}>
        <div style={{ fontFamily: F.comic, fontSize: 40, color: INK, letterSpacing: "0.04em" }}>BNB / USD · TESTNET MOCK FEED</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 6 }}>
          <span style={{ fontFamily: F.comic, fontSize: 150, color: "#fff", WebkitTextStroke: `6px ${INK}`, paintOrder: "stroke", textShadow: `8px 8px 0 ${INK}` }}>
            ${Math.round(v).toLocaleString("en-US")}
          </span>
          <span style={{ fontFamily: F.comic, fontSize: 110, color: col, WebkitTextStroke: `5px ${INK}`, paintOrder: "stroke" }}>{up ? "▲" : "▼"}</span>
        </div>
        <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 26, color: INK }}>
          MockPriceFeed.setPrice — the owner-settable testnet feed used to drive skim &amp; defend
        </div>
      </div>
    </ComicPanel>
  );
};

export const S5Flow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.flow; // 24

  // Hero card (real dashboard) swaps on the story beats.
  const HEROES = [
    { at: 0, src: SCREEN.openTop, box: HERO },
    { at: b(k + 3), src: SCREEN.skimTop, box: HERO },
    { at: b(k + 4, 2), src: SCREEN.dipTop, box: HERO_DIP },
    { at: b(k + 5), src: SCREEN.defendTop, box: HERO },
  ];
  let hero = HEROES[0]!;
  for (const h of HEROES) if (frame >= h.at) hero = h;
  const heroFlash = HEROES.slice(1).reduce((m, h) => (frame >= h.at ? Math.max(m, interpolate(frame, [h.at, h.at + 4], [0.6, 0], clamp)) : m), 0);
  const heroIn = spring({ frame, fps, config: { damping: 14, stiffness: 160, mass: 0.8 } });
  const heroOut = interpolate(frame, [b(k + 10) - 4, b(k + 10) + 4], [1, 0], clamp);
  const danger = frame >= b(k + 4, 2) && frame < b(k + 5);
  const shake = danger ? Math.sin(frame * 2.3) * 6 * interpolate(frame, [b(k + 4, 2), b(k + 5)], [1, 0.3], clamp) : 0;

  const pumpPunch = useBeatPunch(beatsIn(k + 2, k + 3), 0.03, 5);
  const dipPunch = useBeatPunch(beatsIn(k + 4, k + 5), 0.03, 5);
  const permPunch = useBeatPunch(beatsIn(k + 8, k + 9), 0.025, 5);
  const closePunch = useBeatPunch(beatsIn(k + 10, k + 11), 0.025, 5);

  // Detail slot content windows.
  const inWin = (a: number, z: number) => frame >= a && frame < z;
  const cardsWin = inWin(b(k, 2), b(k + 2));
  const activityWin = inWin(b(k + 7), b(k + 8));
  const withdrawWin = inWin(b(k + 9), b(k + 10));

  // Gauge / liquidation zone on the hero card (content px).
  const gauge = { x: HX + (1283 - HERO.sx) * HK, y: HY + (480 - HERO.sy) * HK };
  const cam: CamKey[] = [
    { frame: 0, x: 960, y: 540, scale: 1 },
    { frame: b(k + 6) - 2, x: 960, y: 540, scale: 1 },
    { frame: b(k + 6, 1), x: gauge.x + 60, y: gauge.y + 60, scale: 1.7 },
    { frame: b(k + 6, 3), x: gauge.x + 90, y: gauge.y + 60, scale: 1.75 },
    { frame: b(k + 7), x: 960, y: 540, scale: 1 },
  ];

  const botX = interpolate(frame, [b(k + 5), b(k + 5, 1)], [2100, 1640], clamp);
  const closeT = interpolate(frame, [b(k + 10, 1), b(k + 10, 2)], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base="#110e0b" glowA={danger ? "rgba(255,106,82,0.28)" : "rgba(199,122,58,0.22)"} glowB="rgba(240,185,11,0.12)" glow="top" floor={0.3} />
      <Halftone opacity={0.035} gap={22} color={C.amberHi} />

      <Camera keyframes={cam}>
        <Pulse intensity={0.45} shake={0} glow={false}>
          <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
            {/* HERO — real dashboard vault card */}
            {heroOut > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: HX,
                  top: HY,
                  opacity: heroOut * interpolate(heroIn, [0, 0.3], [0, 1], clamp),
                  transform: `translateY(${(1 - heroIn) * -60}px) scale(${0.96 + 0.04 * heroIn})`,
                  boxShadow: danger ? "0 0 0 4px rgba(255,106,82,0.8), 0 0 80px rgba(255,106,82,0.45)" : "0 30px 90px -30px rgba(0,0,0,0.8), 0 0 60px rgba(199,122,58,0.2)",
                  borderRadius: 30,
                }}
              >
                <CropShot src={hero.src} {...hero.box} w={HW} radius={30}>
                  <AbsoluteFill style={{ background: "#fff", opacity: heroFlash }} />
                </CropShot>
              </div>
            ) : null}

            {/* DETAIL SLOT */}
            {cardsWin ? (
              <div style={{ position: "absolute", left: HX, top: DY, ...fadeUp(frame, b(k, 2), 10, 40) }}>
                <CropShot src={SCREEN.openCards} {...CARDS} w={HW} radius={26} />
                {frame >= b(k + 1, 1) ? (
                  <div
                    style={{
                      position: "absolute",
                      left: (1212 - CARDS.sx) * HK,
                      top: (440 - CARDS.sy) * HK,
                      width: 190 * HK,
                      height: 150 * HK,
                      borderRadius: 18,
                      border: "4px solid #F0B90B",
                      boxShadow: "0 0 30px rgba(240,185,11,0.6)",
                      transform: `scale(${interpolate(frame, [b(k + 1, 1), b(k + 1, 1) + 6], [1.3, 1], clamp)})`,
                    }}
                  />
                ) : null}
              </div>
            ) : null}
            {activityWin ? (
              <div style={{ position: "absolute", left: HX, top: DY, ...fadeUp(frame, b(k + 7), 10, 40) }}>
                <CropShot src={SCREEN.defendActivity} {...ACTIVITY} sh={332} w={HW} radius={26} />
              </div>
            ) : null}
            {withdrawWin ? (
              <div style={{ position: "absolute", left: HX, top: DY, ...fadeUp(frame, b(k + 9), 10, 40) }}>
                <CropShot src={SCREEN.withdrawActivity} {...ACTIVITY} w={HW} radius={26}>
                  {frame >= b(k + 9, 1) ? (
                    <div
                      style={{
                        position: "absolute",
                        left: 20,
                        right: 20,
                        top: (586 - ACTIVITY.sy) * HK,
                        height: 70 * HK,
                        borderRadius: 14,
                        border: "4px solid #F0B90B",
                        boxShadow: "0 0 28px rgba(240,185,11,0.55)",
                      }}
                    />
                  ) : null}
                </CropShot>
              </div>
            ) : null}
          </AbsoluteFill>
        </Pulse>
      </Camera>

      <div style={{ position: "absolute", left: HX, top: 84 }}>
        <RealTag>REAL CERMIN DASHBOARD · LIVE ON BSC TESTNET · price moves via the testnet mock feed</RealTag>
      </div>

      {/* 24 — open */}
      {inWin(b(k), b(k, 2)) ? (
        <div style={{ position: "absolute", left: HX, top: DY + 30, ...fadeUp(frame, b(k, 1), 8, 20) }}>
          <Delta at={b(k, 1)} label="VAULT LIVE" from="0.04 BNB locked" to="$1,200 Shadow" color={C.success} />
        </div>
      ) : null}
      {/* 25 — rules */}
      <ComicText text="THE RULES" from={b(k + 1, 1)} x={1540} y={DY + 480} size={84} rotate={-5} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2) - 2} />

      {/* 26 — pump */}
      {inWin(b(k + 2), b(k + 3)) ? (
        <>
          <PriceBoard at={b(k + 2)} ticks={[b(k + 2), b(k + 2, 1), b(k + 2, 2), b(k + 2, 3)]} values={[120000, 124000, 128000, 132000]} up punch={pumpPunch} />
          <div style={{ position: "absolute", left: 1170, top: DY + 90 }}>
            <TxChip label="setPrice" hash={CHAIN.tx.priceUp} at={b(k + 2, 2)} />
          </div>
          <ComicText text="PUMP! +10%" from={b(k + 2, 1)} x={1450} y={DY + 330} size={110} rotate={-6} fill="#8fe39f" variant="onomatopoeia" echoColor={INK} />
        </>
      ) : null}

      {/* 27 — skim */}
      {inWin(b(k + 3), b(k + 4)) ? (
        <>
          <SpeedBurst cx={960} cy={760} from={b(k + 3)} count={18} inner={140} spread={420} color="#F0B90B" opacity={0.5} seed="skim" fade />
          <ComicText text="SKIMMED!" from={b(k + 3)} x={700} y={700} size={170} rotate={-7} skewX={-6} fill="#F0B90B" variant="onomatopoeia" echoColor={C.amber} />
          <div style={{ position: "absolute", left: 1120, top: DY + 90, display: "flex", flexDirection: "column", gap: 22, alignItems: "flex-start" }}>
            <Delta at={b(k + 3, 1)} label="DEBT" from="2,400" to="2,640 MUSD" color={C.amber} />
            <Delta at={b(k + 3, 2)} label="SHADOW" from="$1,200" to="$1,320" color={C.success} />
            <TxChip label="skim" hash={CHAIN.tx.skim} at={b(k + 3, 3)} />
          </div>
        </>
      ) : null}

      {/* 28 — dip */}
      {inWin(b(k + 4), b(k + 5)) ? (
        <>
          <PriceBoard at={b(k + 4)} ticks={[b(k + 4), b(k + 4, 1), b(k + 4, 2), b(k + 4, 3)]} values={[132000, 118000, 104000, 90000]} up={false} punch={dipPunch} />
          <div style={{ position: "absolute", left: 1170, top: DY + 90 }}>
            <TxChip label="setPrice" hash={CHAIN.tx.priceDown} at={b(k + 4, 1)} tone={C.dangerHi} />
          </div>
          <ComicText text="UH-OH!" from={b(k + 4, 2)} x={1460} y={DY + 330} size={140} rotate={6} fill={C.dangerHi} variant="onomatopoeia" echoColor={INK} />
        </>
      ) : null}

      {/* 29 — defend */}
      {inWin(b(k + 5), b(k + 6)) ? (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <Robot x={botX} y={DY + 250} s={1.5} flame={0.6 + 0.4 * Math.sin(frame * 1.3)} fill="#D8CDBB" visor="#F0B90B" />
          </svg>
          <SpeedBurst cx={640} cy={760} from={b(k + 5)} count={18} inner={140} spread={420} color={C.successHi} opacity={0.5} seed="def" fade />
          <ComicText text="DEFENDED!" from={b(k + 5)} x={640} y={690} size={160} rotate={-6} skewX={-6} fill={C.successHi} variant="onomatopoeia" echoColor={INK} />
          <div style={{ position: "absolute", left: 300, top: DY + 290, display: "flex", gap: 22, alignItems: "center" }}>
            <Delta at={b(k + 5, 1)} label="ICR" from="136%" to="140%" color={C.success} />
            <Delta at={b(k + 5, 2)} label="DEBT" from="2,640" to="2,571" color={C.success} />
          </div>
          <div style={{ position: "absolute", left: 300, top: DY + 400 }}>
            <TxChip label="defend" hash={CHAIN.tx.defend} at={b(k + 5, 3)} />
          </div>
        </>
      ) : null}

      {/* 30 — safe */}
      {inWin(b(k + 6), b(k + 7)) ? (
        <div style={{ position: "absolute", left: 120, top: 720, width: 900, ...fadeUp(frame, b(k + 6, 1), 10, 20) }}>
          <div style={{ fontFamily: F.display, fontSize: 64, color: C.text, lineHeight: 1.1 }}>
            Back on its <i style={{ color: C.successHi }}>defense line</i> —
            <br />
            liquidation is $70,714.
          </div>
        </div>
      ) : null}
      <ComicText text="HELD!" from={b(k + 6, 2)} x={1560} y={860} size={150} rotate={-6} fill={C.successHi} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 7) - 2} />

      {/* 31 — activity */}
      <ComicText text="ON-CHAIN!" from={b(k + 7, 2)} x={1500} y={DY + 40} size={100} rotate={6} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 8) - 2} />

      {/* 32 — permissionless */}
      {inWin(b(k + 8), b(k + 9)) ? (
        <ComicPanel at={b(k + 8)} x={220} y={DY - 10} w={1480} h={450} rot={-1} bg="#FFE9A8" bg2="#F0B90B" from="down" punch={permPunch}>
          <svg width={1480} height={450} viewBox="0 0 1480 450" style={{ position: "absolute", inset: 0 }}>
            <Person x={170} y={300} s={1.05} body={C.amber} mood="happy" pose="point" wave={Math.sin(frame * 0.4) * 6} />
            <Person x={360} y={310} s={0.95} body="#5c7a8e" skin="#E8B89A" mood="wink" pose="cheer" wave={Math.sin(frame * 0.5) * 8} />
            <Robot x={560} y={250} s={1.05} flame={0.6 + 0.4 * Math.sin(frame * 1.3)} fill="#D8CDBB" visor="#F0B90B" />
          </svg>
          <div style={{ position: "absolute", left: 720, top: 70, width: 720 }}>
            <div style={{ fontFamily: F.comic, fontSize: 64, color: INK, letterSpacing: "0.02em", lineHeight: 1 }}>PERMISSIONLESS DEFENSE</div>
            <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: INK, marginTop: 16, lineHeight: 1.3 }}>
              <span style={{ fontFamily: F.mono, background: "#fffaf0", border: `3px solid ${INK}`, padding: "2px 10px" }}>defend()</span> has no owner check. The
              keeper bot calls it on its own; so can anyone else.
            </div>
          </div>
        </ComicPanel>
      ) : null}
      <ComicText text="ANYONE!" from={b(k + 8, 2)} x={1500} y={DY + 430} size={120} rotate={-6} fill="#fff" variant="onomatopoeia" echoColor={C.amber} exitAt={b(k + 9) - 2} />

      {/* 33 — withdraw */}
      {withdrawWin ? (
        <>
          <ComicText text="SENT!" from={b(k + 9, 1)} x={1540} y={DY + 30} size={120} rotate={6} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} />
          <div style={{ position: "absolute", left: HX, top: 990, display: "flex", gap: 22, alignItems: "center" }}>
            <TxChip label="withdrawSpendable(100)" hash={CHAIN.tx.withdraw} at={b(k + 9, 2)} />
            <div style={{ fontFamily: F.sans, fontSize: 26, color: C.textDim, ...fadeUp(frame, b(k + 9, 3), 8, 10) }}>100 MUSD to any address · BNB untouched</div>
          </div>
        </>
      ) : null}

      {/* 34 — close */}
      {frame >= b(k + 10) ? (
        <>
          <ComicPanel at={b(k + 10)} x={220} y={150} w={1480} h={760} rot={0.8} bg="#F7E9CB" bg2="#E8C99A" from="scale" punch={closePunch}>
            <svg width={1480} height={760} viewBox="0 0 1480 760" style={{ position: "absolute", inset: 0 }}>
              <Vault x={420} y={400} s={1.9} dial={closeT * 360} open={closeT} label="VAULT" />
              {closeT > 0 ? (
                <CoinDot cx={420 + closeT * 760} cy={380 - Math.sin(closeT * Math.PI) * 200 - closeT * 80} r={70} label="BNB" rotate={closeT * 360} />
              ) : null}
              <Person x={1180} y={500} s={1.7} body={C.amber} mood={closeT >= 1 ? "happy" : "neutral"} pose={closeT >= 1 ? "cheer" : "stand"} wave={Math.sin(frame * 0.5) * 8} />
            </svg>
            <div style={{ position: "absolute", left: 40, top: 30, fontFamily: F.comic, fontSize: 58, color: INK, letterSpacing: "0.02em" }}>close() → DEBT 0</div>
            <div style={{ position: "absolute", left: 40, bottom: 34, fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: INK }}>
              Debt repaid · all 0.04 tBNB returned · 100 MUSD remainder back to the owner
            </div>
          </ComicPanel>
          <ComicText text="RETURNED!" from={b(k + 10, 2)} x={1180} y={250} size={130} rotate={-6} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 960, display: "flex", justifyContent: "center" }}>
            <TxChip label="close" hash={CHAIN.tx.close} at={b(k + 10, 3)} />
          </div>
        </>
      ) : null}

      <InkFrame inset={22} width={4} opacity={0.55} color={C.cream} innerColor="#F0B90B" />

      <Sfx name="impact" at={b(k)} volume={0.6} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.6} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`pu${i}`} name="tick" at={b(k + 2, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 3)} volume={0.85} />
      <Sfx name="chime" at={b(k + 3, 2)} volume={0.5} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`dn${i}`} name="tick" at={b(k + 4, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 4, 2)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 5, 1)} volume={0.5} />
      <Sfx name="impact" at={b(k + 5)} volume={0.9} />
      <Sfx name="chime" at={b(k + 6, 2)} volume={0.5} />
      <Sfx name="whoosh" at={b(k + 7)} volume={0.45} />
      <Sfx name="impact" at={b(k + 8)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 9)} volume={0.45} />
      <Sfx name="tick" at={b(k + 9, 1)} volume={0.7} />
      <Sfx name="impact" at={b(k + 10)} volume={0.8} />
      <Sfx name="chime" at={b(k + 10, 2)} volume={0.6} />
    </AbsoluteFill>
  );
};
