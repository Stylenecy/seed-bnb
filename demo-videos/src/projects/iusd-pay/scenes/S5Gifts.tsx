import React from "react";
import { AbsoluteFill, Img, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Caption,
  clamp,
  CoinDot,
  ComicPanel,
  ComicText,
  Halftone,
  INK,
  InkFrame,
  Pulse,
  Sfx,
  SpeedBurst,
  useSceneClock,
} from "../../../kit";
import { C, gift, type GiftColor } from "../theme";
import { BAR } from "../timeline";

/**
 * S5 · GIFT BOXES (bars 20–24) — the app's own gift-box art on a pay-card
 * comic page. Whips in on bar 20.
 *   bar 20 b0–b3  four boxes slam in, one per beat
 *   bar 21 b0     the gold box drops in centre; wobbles on every beat
 *   bar 22 b0     lid pops (open1) → b1 wide open (open2) + "POP!" + coin fountain
 *   bar 23 BREAK  three fact captions pop on b0/b1/b2 (24 designs · sponsored claim · 0.5%)
 */
const SIDE: { c: GiftColor; x: number; y: number; r: number }[] = [
  { c: "0_red", x: 330, y: 610, r: -8 },
  { c: "6_teal", x: 610, y: 470, r: 6 },
  { c: "7_pink", x: 1310, y: 470, r: -6 },
  { c: "4_blue", x: 1590, y: 610, r: 8 },
];

export const S5Gifts: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b } = useSceneClock();
  const k = BAR.gifts; // 20

  const goldIn = spring({ frame: frame - b(k + 1), fps, config: { damping: 9, stiffness: 180, mass: 0.8 } });
  // Wobble impulse on each beat of bar 21.
  let wob = 0;
  for (let i = 0; i < 4; i++) {
    const d = frame - b(k + 1, i);
    if (d >= 0 && d < 14) wob = Math.sin(d * 1.4) * 9 * Math.exp(-d / 6) * (i % 2 ? -1 : 1);
  }
  const stage = frame >= b(k + 2, 1) ? "open2" : frame >= b(k + 2) ? "open1" : "box";
  const openPunch = interpolate(frame, [b(k + 2), b(k + 2) + 4, b(k + 2) + 12], [1, 1.18, 1], clamp);

  // Coin fountain from the open box (bar 22 b1 → bar 23).
  const coins: React.ReactNode[] = [];
  const t0 = b(k + 2, 1);
  if (frame >= t0) {
    for (let i = 0; i < 16; i++) {
      const t = (frame - t0 - i * 0.8) / 30;
      if (t < 0) continue;
      const vx = (random(`gx${i}`) - 0.5) * 900;
      const vy = -700 - random(`gy${i}`) * 500;
      const x = 960 + vx * t;
      const y = 520 + vy * t + 900 * t * t;
      if (y > 1150) continue;
      coins.push(<CoinDot key={i} cx={x} cy={y} r={20 + random(`gr${i}`) * 14} rotate={t * 400 * (i % 2 ? 1 : -1)} scaleX={Math.abs(Math.cos(t * 8 + i))} />);
    }
  }

  return (
    <AbsoluteFill style={{ background: "#0d0d0f" }}>
      <Halftone opacity={0.06} gap={18} />
      <Pulse intensity={1.1} shake={0.7}>
        <ComicPanel at={0} x={70} y={70} w={1780} h={940} rot={-0.6} bg="#FFD3A1" bg2="#FF8FB1" halftone={0.14} borderW={8} shadow={16}>
          {/* sunburst behind the centre box */}
          <svg width={1780} height={940} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 18 }).map((_, i) => {
              const a0 = (i / 18) * Math.PI * 2 + frame * 0.004;
              const a1 = a0 + Math.PI / 18;
              const R = 1400;
              const cx = 890;
              const cy = 470;
              return (
                <polygon
                  key={i}
                  points={`${cx},${cy} ${cx + Math.cos(a0) * R},${cy + Math.sin(a0) * R} ${cx + Math.cos(a1) * R},${cy + Math.sin(a1) * R}`}
                  fill="#fff"
                  opacity={0.18}
                />
              );
            })}
          </svg>
        </ComicPanel>

        {/* four side boxes, one per beat of bar 20 */}
        {SIDE.map((s, i) => {
          const at = b(k, i);
          const p = spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 220, mass: 0.6 } });
          if (frame < at) return null;
          const bob = Math.sin((frame - at) / 9 + i) * 6;
          return (
            <Img
              key={s.c}
              src={gift("box", s.c)}
              style={{
                position: "absolute",
                left: s.x - 130,
                top: s.y - 130 + bob + (1 - p) * -300,
                width: 260,
                height: 260,
                objectFit: "contain",
                transform: `rotate(${s.r}deg) scale(${0.5 + 0.5 * p})`,
                filter: `drop-shadow(8px 10px 0 ${INK})`,
              }}
            />
          );
        })}

        {/* the gold hero box */}
        {frame >= b(k + 1) ? (
          <Img
            src={gift(stage, "10_gold")}
            style={{
              position: "absolute",
              left: 960 - 190,
              top: 560 - 190 + (1 - goldIn) * -500,
              width: 380,
              height: 380,
              objectFit: "contain",
              transform: `rotate(${wob}deg) scale(${(0.6 + 0.4 * goldIn) * openPunch})`,
              filter: `drop-shadow(10px 12px 0 ${INK}) drop-shadow(0 0 40px rgba(240,185,11,0.6))`,
            }}
          />
        ) : null}

        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {coins}
        </svg>
      </Pulse>

      <ComicText text="Gift boxes" from={b(k)} x={960} y={190} size={130} rotate={-3} skewX={-6} fill="#fff" stagger={1} />
      <SpeedBurst cx={960} cy={520} from={b(k + 2)} count={20} inner={200} spread={560} color="#fff" opacity={0.7} width={8} seed="pop" fade />
      <ComicText text="POP!" from={b(k + 2, 1)} x={1330} y={400} size={180} rotate={12} fill={C.yellow} variant="onomatopoeia" echoColor={C.pink} />
      <ComicText text="Wrap USDT in a gift." from={b(k + 2, 2)} x={960} y={860} size={78} rotate={-2} fill="#fff" exitAt={b(k + 3) - 6} />

      {/* bar 23 break — the facts */}
      <Caption at={b(k + 3)} x={150} y={880} size={34} bg={C.yellow} rot={-2}>
        24 box designs registered on-chain
      </Caption>
      <Caption at={b(k + 3, 1)} x={760} y={930} size={34} bg="#fff" rot={1.5}>
        Claims sponsored by the relayer
      </Caption>
      <Caption at={b(k + 3, 2)} x={1360} y={870} size={34} bg="#A8EC8E" rot={-1}>
        Auto 0.5% fee
      </Caption>

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      {[0, 1, 2, 3].map((i) => (
        <Sfx key={i} name="tick" at={b(k, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 1)} volume={0.7} />
      <Sfx name="impact" at={b(k + 2)} volume={0.8} />
      <Sfx name="chime" at={b(k + 2, 1)} volume={0.7} />
      <Sfx name="tick" at={b(k + 3)} volume={0.5} />
      <Sfx name="tick" at={b(k + 3, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
