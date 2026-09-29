import type { Metadata } from "next";

const SITE_URL = "https://musashi-agent.xyz";

export const metadata: Metadata = {
  title: "Dashboard — Token Scanner, Gate Pipeline & STRIKE Ledger",
  description:
    "Live MUSASHI 武蔵 dashboard on BNB Chain. Scan tokens across Ethereum, BSC, Polygon, Arbitrum, Base & 0G; run the 7-gate elimination pipeline; watch the bull/bear debate; publish ERC-7857 STRIKEs to ConvictionLog and download verifiable evidence from 0G Storage.",
  alternates: { canonical: `${SITE_URL}/dashboard` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/dashboard`,
    siteName: "MUSASHI 武蔵",
    title: "MUSASHI Dashboard — On-Chain Token Intelligence on BNB Chain",
    description:
      "Token scanner, 7-gate pipeline, adversarial debate, ConvictionLog STRIKEs and 0G Storage evidence — live on BNB Chain.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MUSASHI Dashboard — Token Intelligence on BNB Chain",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MUSASHI Dashboard — Token Intelligence on BNB Chain",
    description:
      "Scan, gate, debate, strike. The conviction-weighted dashboard on BNB Chain.",
    images: ["/og-image.png"],
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
