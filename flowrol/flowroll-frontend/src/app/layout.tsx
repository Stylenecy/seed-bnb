// import "@/polyfills"  

import type { Metadata } from "next";
import { Roboto, Roboto_Mono, Raleway, Montserrat } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

// Global typography configuration
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-roboto-mono",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-raleway",
  display: "swap",
});

// App-wide SEO and branding
export const metadata: Metadata = {
  title: "Flowroll",
  description: "DeFi payroll protocol on BNB Chain. Self-funding payroll via yield-bearing deposits.",
  icons: {
    icon: "/flowroll_logo.png",
    apple: "/flowroll_logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${roboto.variable} ${robotoMono.variable} ${raleway.variable} ${montserrat.variable}`}
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* Global context providers and toast system */}
          <Providers>{children}</Providers>
          
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              className: "font-sans text-base md:text-lg",
              style: {
                borderRadius: "1rem",
                padding: "16px",
              },
              descriptionClassName: "text-slate-500",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}