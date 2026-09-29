import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadBangers } from "@remotion/google-fonts/Bangers";

// Load only the weights we use, in the latin subset, to keep the render lean.
const fraunces = loadFraunces("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

const manrope = loadManrope("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

// Comic display face — used ONLY for in-scene comic lettering / onomatopoeia
// (the panels' beat-slammed captions). Brand faces above stay for everything
// else. Bangers ships one weight (400) in the latin subset.
const bangers = loadBangers("normal", {
  weights: ["400"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

/** Display serif — matches the FE's `--font-display`. */
export const FONT_DISPLAY = fraunces.fontFamily;
/** Sans / body / labels — matches the FE's `--font-sans`. */
export const FONT_SANS = manrope.fontFamily;
/** Comic display — in-scene lettering & onomatopoeia only (NOT brand copy). */
export const FONT_COMIC = bangers.fontFamily;
