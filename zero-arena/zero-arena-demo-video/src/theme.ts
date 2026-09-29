// Locked palette per PLAN.md §2 — no gradients, single emerald accent,
// numerical metrics get red/green; everything else is neutral.

export const theme = {
  // Surfaces
  bg: '#0a0a0f',
  bgElev: '#14141c',
  bgPanel: '#1c1c26',
  border: '#2a2a38',
  borderSoft: '#1f1f2a',

  // Text
  text: '#fafafa',
  textMuted: '#9a9aa8',
  textDim: '#5e5e6e',

  // Single accent — appears on AT MOST one element per frame.
  accent: '#34d399',
  accentDim: '#1f8c5e',

  // Numerical-only colors — never on UI chrome.
  posReturn: '#34d399',
  negReturn: '#f87171',

  // macOS traffic lights (only inside MacTerminal title bar).
  trafficClose: '#ff5f57',
  trafficMin: '#febc2e',
  trafficMax: '#28c840',
};

export const fonts = {
  sans: `"Inter", system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`,
  mono: `"JetBrains Mono", ui-monospace, Menlo, Monaco, Consolas, "Courier New", monospace`,
};
