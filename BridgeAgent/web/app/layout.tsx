import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BridgeAgent · live on BNB Chain",
  description:
    "Autonomous, non-custodial perps trading anchored on BNB Chain. Every settled trade is verifiably on-chain via ERC-8004 + TradeJournal. No dashboard, no custody, no trust required.",
  metadataBase: new URL("https://bridgeagent.vercel.app"),
  openGraph: {
    title: "BridgeAgent · live on BNB Chain",
    description:
      "Every trade verifiably on-chain. ERC-8004 identity + append-only TradeJournal. Read it without permission.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
