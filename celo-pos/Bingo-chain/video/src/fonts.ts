// Loads the exact five families the BINGOChain frontend uses, via
// @remotion/google-fonts so the renderer waits for them before capturing frames.
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadCondiment } from "@remotion/google-fonts/Condiment";
import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";

const opt = { ignoreTooManyRequestsWarning: true };

const anton = loadAnton("normal", opt);
const condiment = loadCondiment("normal", opt);
const hanken = loadHanken("normal", opt);
const geistMono = loadGeistMono("normal", opt);
const bricolage = loadBricolage("normal", opt);

export const fontVars: Record<string, string> = {
  "--font-anton": anton.fontFamily,
  "--font-condiment": condiment.fontFamily,
  "--font-sans": hanken.fontFamily,
  "--font-mono": geistMono.fontFamily,
  "--font-display": bricolage.fontFamily,
};
