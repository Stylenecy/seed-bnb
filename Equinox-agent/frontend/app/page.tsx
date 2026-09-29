import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/sections/hero";
import { HowAuralis } from "@/components/landing/sections/how-auralis";
import { WhatYouCanDo } from "@/components/landing/sections/what-you-can-do";
import { SecurityIntegrations } from "@/components/landing/sections/security-integrations";
import { FAQ } from "@/components/landing/sections/faq";
import { Academy } from "@/components/landing/sections/academy";
import { StartCTA } from "@/components/landing/sections/start-cta";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="relative flex-1">
        <Hero />
        <HowAuralis />
        <WhatYouCanDo />
        <SecurityIntegrations />
        <FAQ />
        <Academy />
        <StartCTA />
      </main>
      <Footer />
    </>
  );
}
