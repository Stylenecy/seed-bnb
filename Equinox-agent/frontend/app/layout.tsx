import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Space_Grotesk } from "next/font/google";
import { LenisProvider } from "@/components/landing/providers/lenis-provider";
// import { PrivyAppProvider } from "@/components/landing/providers/privy-provider";
// ^ Uncomment after installing Privy with pnpm (see PRIVY_SETUP.md).
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Equinox Agent — Self-repaying loans on BNB Chain",
  description:
    "Deposit BNB. Pick a risk profile. The agent borrows, lends, and uses the spread to pay off your debt. You manage nothing.",
  metadataBase: new URL("https://equinox.agent"),
  openGraph: {
    title: "Equinox Agent",
    description:
      "Self-repaying loans on BNB Chain. The spread does the work.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050504",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="relative min-h-screen flex flex-col overflow-x-hidden">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 bg-noise opacity-[0.05] mix-blend-overlay"
        />
        <LenisProvider>
          <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
        </LenisProvider>
      </body>
    </html>
  );
}
