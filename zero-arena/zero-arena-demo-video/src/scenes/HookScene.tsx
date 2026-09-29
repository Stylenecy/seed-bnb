// HookScene — 13 seconds, 390 frames @ 30fps. Synced to vo-01-hook.mp3 (10.08s)
// with audio delayed 2s (60 frames) at the Main.tsx Sequence level — so the
// visual cascades alone first, then voice kicks in.
//
// PLAN §4 storyboard #1 (revised v3): cascading collage of X-snapshot
// style tweets. Each tweet uses the clean "screenshot tool" look from
// the user reference: NO card chrome, NO background, NO border. Just
// avatar + name + handle stacked, X logo top-right, big body text on
// black, "XX likes Y replies · x.com" footer. Five readable tweets
// stagger in across the frame with slight rotation; final overlay
// surfaces the framing — big numbers, zero proof.
//
// Frame budget:
//   0–15    bg
//   15–170  5 tweets stagger in (visual happens BEFORE voice starts)
//   60      audio kicks in: "Every day on the timeline..."
//   170–300 hold — voice describes the absurd numbers
//   300–330 tweets dim · red strike on hyped numbers (audio pause @ ~7s in audio)
//   320–350 "UNVERIFIED" diagonal ribbon + center caption ("None of it verifiable")
//   365–390 fade to black (after audio finishes at ~363f)

import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {fonts, theme} from '../theme';

// Match reference exactly: pure black background, no grid, no gradients.
const X_BG = '#000000';
const TEXT_BODY = '#e7e7e7';
const TEXT_NAME = '#ffffff';
const TEXT_MUTED = '#8b98a5'; // X handle / footer text
const VERIFIED_GOLD = '#facc15';
const SCAM_GREEN = '#22c55e';
const X_RED = theme.negReturn;

type Tweet = {
  name: string;
  handle: string;
  avatarBg: string;
  avatarChar: string;
  verified?: boolean;
  // Body text broken into segments — string for plain text, object for
  // highlighted (and strike-able) inline span.
  body: Array<string | {text: string; color: string}>;
  body2?: Array<string | {text: string; color: string}>;
  likes: string;
  replies: string;
  // Layout
  x: number;
  y: number;
  width: number;
  rotate: number;
  showAt: number;
};

// 5 absurd-brag tweets — exaggerated of the AI-trading-shill genre.
const TWEETS: Tweet[] = [
  {
    name: 'Alpha Wolf',
    handle: '@alphawolf_eth',
    avatarBg: '#7c3aed',
    avatarChar: 'A',
    verified: true,
    body: [
      'my GPT-5 trader just hit ',
      {text: '+847% ROI', color: SCAM_GREEN},
      ' this quarter 🚀',
    ],
    body2: ['absolutely unstoppable. dm me for access'],
    likes: '12.4K',
    replies: '3.1K',
    x: 70,
    y: 50,
    width: 700,
    rotate: -3,
    showAt: 15,
  },
  {
    name: 'CryptoChad',
    handle: '@cryptochad99',
    avatarBg: '#ea580c',
    avatarChar: 'C',
    body: [
      'turned $1k into ',
      {text: '$42,890 in 11 days', color: SCAM_GREEN},
      ' 💎',
    ],
    body2: ['my agent never sleeps, never loses. trust me bro'],
    likes: '8.7K',
    replies: '2.4K',
    x: 1140,
    y: 30,
    width: 700,
    rotate: 4,
    showAt: 35,
  },
  {
    name: 'MoonShot AI',
    handle: '@moonshot_ai',
    avatarBg: '#0ea5e9',
    avatarChar: 'M',
    verified: true,
    body: [
      'our proprietary agent: ',
      {text: '91.4% win rate', color: SCAM_GREEN},
      ', ',
      {text: 'Sharpe 4.7', color: SCAM_GREEN},
      '.',
    ],
    body2: ['backtest results just dropped. zero overfit ✨'],
    likes: '24.1K',
    replies: '7.2K',
    x: 410,
    y: 410,
    width: 760,
    rotate: -2,
    showAt: 70,
  },
  {
    name: 'Yield Farm CEO',
    handle: '@yieldfarm_ceo',
    avatarBg: '#a855f7',
    avatarChar: 'Y',
    verified: true,
    body: [
      'launching $AGENT token next week — ',
      {text: '50× projected EOY', color: SCAM_GREEN},
      '.',
    ],
    body2: ['audited results coming soon™. wagmi 🚀'],
    likes: '32.1K',
    replies: '9.8K',
    x: 110,
    y: 720,
    width: 700,
    rotate: 3,
    showAt: 110,
  },
  {
    name: 'Signal King',
    handle: '@signalking',
    avatarBg: '#16a34a',
    avatarChar: 'K',
    body: [
      'my algo never loses. ',
      {text: '100% win rate', color: SCAM_GREEN},
      ' for ',
      {text: '365 days straight', color: SCAM_GREEN},
      '.',
    ],
    body2: ['the future of trading is here 👑'],
    likes: '15.6K',
    replies: '5.1K',
    x: 1140,
    y: 720,
    width: 700,
    rotate: -4,
    showAt: 145,
  },
];

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Audio sync: VO 10.08s = ~303f, delayed by 60f at composition level.
  // Effective audio range: f60-363. "None of it verifiable" lands ~f315-360.
  // UNVERIFIED stamp + strike timed to that beat. Scene = 390f.

  // Dim begins right before the punch line (audio pause @ ~7s in audio = f270 video).
  const dimOp = interpolate(frame, [300, 330], [0, 0.55], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const strikeProgress = interpolate(frame, [305, 340], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // "UNVERIFIED" stamp ribbon — lands as voice says "None of it verifiable".
  const stampOp = interpolate(frame, [320, 350], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stampScale = interpolate(frame, [320, 350], [1.15, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Fade to black at end (after audio finishes at ~f363).
  const finalFade = interpolate(frame, [365, 390], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: X_BG, overflow: 'hidden'}}>
      {TWEETS.map((tweet, i) => (
        <TweetSnapshot
          key={i}
          tweet={tweet}
          frame={frame}
          strikeProgress={strikeProgress}
        />
      ))}

      {/* Red dim overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(248, 113, 113, ${dimOp * 0.12})`,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />

      {/* UNVERIFIED stamp + center caption */}
      {frame >= 320 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: stampOp,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Diagonal "UNVERIFIED" ribbon — large, semi-transparent */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `rotate(-12deg) scale(${stampScale})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 24,
            }}
          >
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 96,
                fontWeight: 800,
                color: X_RED,
                opacity: 0.18,
                letterSpacing: 4,
                whiteSpace: 'nowrap',
              }}
            >
              UNVERIFIED · UNVERIFIED · UNVERIFIED · UNVERIFIED
            </div>
          </div>

          {/* Center call-out card */}
          <div
            style={{
              position: 'relative',
              transform: `scale(${stampScale})`,
              background: 'rgba(0, 0, 0, 0.92)',
              border: `1px solid ${X_RED}`,
              padding: '28px 56px',
              borderRadius: 4,
              textAlign: 'center',
              boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px ${X_RED}33`,
            }}
          >
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 16,
                color: X_RED,
                letterSpacing: 4,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              · evidence ·
            </div>
            <div
              style={{
                fontFamily: fonts.sans,
                fontSize: 56,
                fontWeight: 700,
                color: theme.text,
                letterSpacing: -1.4,
                lineHeight: 1.05,
              }}
            >
              Big numbers. <span style={{color: X_RED}}>Zero proof.</span>
            </div>
          </div>
        </div>
      )}

      {/* Fade to black */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#000',
          opacity: finalFade,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

// ─── tweet snapshot (clean X-screenshot style) ───────────────────────────

const TweetSnapshot: React.FC<{
  tweet: Tweet;
  frame: number;
  strikeProgress: number;
}> = ({tweet, frame, strikeProgress}) => {
  const {showAt} = tweet;
  const op = interpolate(frame, [showAt, showAt + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(frame, [showAt, showAt + 18], [0.92, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Subtle drift after landing
  const driftPhase = (frame - showAt) * 0.025;
  const drift = Math.sin(driftPhase) * 1.5;

  // After frame 300, dim slightly (synced with audio pause before punch line)
  const dim = interpolate(frame, [300, 330], [1, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: tweet.x,
        top: tweet.y + drift,
        width: tweet.width,
        opacity: op * dim,
        transform: `rotate(${tweet.rotate}deg) scale(${scale})`,
        transformOrigin: 'center center',
        fontFamily: fonts.sans,
      }}
    >
      {/* Header: avatar + name+handle + X logo top-right */}
      <div style={{display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative'}}>
        {/* Avatar */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 56,
            background: tweet.avatarBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 24,
            flexShrink: 0,
          }}
        >
          {tweet.avatarChar}
        </div>

        {/* Name + handle (stacked, no slashes). Subtle blur on both so no
            real account is coincidentally identifiable — body + numbers
            stay sharp because the satire is in the numbers, not the names. */}
        <div style={{flex: 1, minWidth: 0, paddingTop: 2}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
            <span
              style={{
                color: TEXT_NAME,
                fontWeight: 700,
                fontSize: 22,
                lineHeight: 1.1,
                filter: 'blur(1.6px)',
              }}
            >
              {tweet.name}
            </span>
            {tweet.verified && <VerifiedBadge />}
          </div>
          <div
            style={{
              color: TEXT_MUTED,
              fontSize: 16,
              marginTop: 4,
              lineHeight: 1.1,
              filter: 'blur(3px)',
            }}
          >
            {tweet.handle}
          </div>
        </div>

        {/* X logo top-right */}
        <div style={{flexShrink: 0, paddingTop: 6}}>
          <XLogo />
        </div>
      </div>

      {/* Body text — big, white, multi-line, with highlighted spans */}
      <div
        style={{
          marginTop: 20,
          color: TEXT_BODY,
          fontSize: 22,
          lineHeight: 1.4,
          fontWeight: 400,
        }}
      >
        {tweet.body.map((seg, i) =>
          typeof seg === 'string' ? (
            <span key={i}>{seg}</span>
          ) : (
            <HighlightWithStrike key={i} text={seg.text} color={seg.color} strikeProgress={strikeProgress} />
          ),
        )}
      </div>

      {tweet.body2 && (
        <div
          style={{
            marginTop: 14,
            color: TEXT_BODY,
            fontSize: 22,
            lineHeight: 1.4,
          }}
        >
          {tweet.body2.map((seg, i) =>
            typeof seg === 'string' ? (
              <span key={i}>{seg}</span>
            ) : (
              <HighlightWithStrike key={i} text={seg.text} color={seg.color} strikeProgress={strikeProgress} />
            ),
          )}
        </div>
      )}

      {/* Footer: likes/replies left, x.com right */}
      <div
        style={{
          marginTop: 22,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: TEXT_MUTED,
          fontSize: 15,
        }}
      >
        <div style={{display: 'flex', gap: 16}}>
          <span>{tweet.likes} likes</span>
          <span>{tweet.replies} replies</span>
        </div>
        <span>x.com</span>
      </div>
    </div>
  );
};

// Inline highlight with red strike-through that draws after frame 175.
const HighlightWithStrike: React.FC<{
  text: string;
  color: string;
  strikeProgress: number;
}> = ({text, color, strikeProgress}) => {
  return (
    <span
      style={{
        color,
        fontWeight: 600,
        position: 'relative',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          height: 2.5,
          width: `${strikeProgress * 100}%`,
          background: X_RED,
          transform: 'translateY(-50%)',
          boxShadow: `0 0 6px ${X_RED}`,
          pointerEvents: 'none',
        }}
      />
    </span>
  );
};

// ─── X logo + verified badge ─────────────────────────────────────────────

const XLogo: React.FC = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="#ffffff" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const VerifiedBadge: React.FC = () => (
  <svg width={18} height={18} viewBox="0 0 22 22" fill={VERIFIED_GOLD} aria-hidden>
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
  </svg>
);
