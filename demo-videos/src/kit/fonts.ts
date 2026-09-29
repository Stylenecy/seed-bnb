import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadBangers } from "@remotion/google-fonts/Bangers";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

/**
 * Shared type system. Projects pick display/sans per their brand in theme.ts
 * (e.g. `sans: FONTS.inter` when the product's frontend uses Inter).
 *   display — Fraunces (serif, editorial headlines)
 *   sans    — Manrope / Inter (body, labels, UI)
 *   comic   — Bangers (ONLY comic lettering + onomatopoeia)
 *   mono    — JetBrains Mono (addresses, hashes, gas)
 */
const opts = { subsets: ["latin"] as ["latin"], ignoreTooManyRequestsWarning: true };

const fraunces = loadFraunces("normal", { weights: ["400", "500", "600", "700", "900"], ...opts });
loadFraunces("italic", { weights: ["400", "500"], ...opts });
const manrope = loadManrope("normal", { weights: ["400", "500", "600", "700", "800"], ...opts });
const inter = loadInter("normal", { weights: ["300", "400", "500", "600", "700", "800"], ...opts });
const bangers = loadBangers("normal", { weights: ["400"], ...opts });
const mono = loadMono("normal", { weights: ["400", "500", "600", "700"], ...opts });

export const FONTS = {
  display: fraunces.fontFamily,
  manrope: manrope.fontFamily,
  inter: inter.fontFamily,
  comic: bangers.fontFamily,
  mono: mono.fontFamily,
} as const;
