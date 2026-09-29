import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // BridgeAgent "moss" palette — between standard crypto-green and a flatter
        // institutional teal. Used for everything except the editorial accent.
        moss: {
          50: "#f1f6f3",
          100: "#dde8e0",
          200: "#bcd0c2",
          300: "#92b29c",
          400: "#699378",
          500: "#4d785f",
          600: "#3b5f4a",
          700: "#304c3c",
          800: "#283d31",
          900: "#22332a",
          950: "#0f1c15",
        },
        // Single tertiary spot — used only for the editorial italic in the
        // hero. Gives a faint paper/print warmth no crypto site has.
        bone: "#f5e9d2",
      },
      fontFamily: {
        // Body copy / numerals: JetBrains Mono. Trading-terminal cue.
        mono: [
          "JetBrains Mono Variable",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        // The one editorial flourish — Instrument Serif italic on a single
        // word in the hero. The unexpected typographic choice that makes
        // the page memorable.
        serif: ["Instrument Serif", "ui-serif", "Georgia", "serif"],
        // Display sans for the hero number — a strong neo-grotesque.
        display: [
          "GT America",
          "Söhne",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        // Custom display sizes for the hero agent number.
        "10xl": ["12rem", { lineHeight: "1", letterSpacing: "-0.04em" }],
        "11xl": ["16rem", { lineHeight: "0.9", letterSpacing: "-0.05em" }],
      },
      animation: {
        "pulse-soft": "pulse-soft 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ticker-rise": "ticker-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.92)" },
        },
        "ticker-rise": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
