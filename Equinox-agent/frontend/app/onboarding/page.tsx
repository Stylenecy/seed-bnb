import { Navbar } from "@/components/landing/navbar";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <>
      <Navbar />
      <div className="relative min-h-screen overflow-hidden bg-bg px-5 pt-24 sm:px-8 sm:pt-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-dot-grid opacity-[0.14]"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent, black 12%, black 75%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 12%, black 75%, transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-12%] h-[520px] w-[520px] rounded-full blur-[110px]"
          style={{
            background:
              "radial-gradient(circle, rgba(145,129,245,0.32), rgba(67,97,252,0.12) 50%, transparent 75%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-20%] left-[-14%] h-[420px] w-[420px] rounded-full blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,122,144,0.18), transparent 70%)",
          }}
        />
        <div className="relative">
          <OnboardingWizard />
        </div>
      </div>
    </>
  );
}
