export type OnboardingStep = 'connect' | 'faucet' | 'borrow' | 'protected';

const STEPS: { id: OnboardingStep; label: string }[] = [
  { id: 'connect', label: 'Connect' },
  { id: 'faucet', label: 'Faucet' },
  { id: 'borrow', label: 'Borrow' },
  { id: 'protected', label: 'Protected' },
];

interface OnboardingStepperProps {
  current: OnboardingStep;
}

/** Backend-mode-only orientation: where a new visitor is in the real on-chain
 * setup (self-service party -> faucet -> borrow -> Guard Agent watching), so
 * they always know what's next instead of discovering it screen by screen. */
export function OnboardingStepper({ current }: OnboardingStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <ol aria-label="Setup progress" className="mb-8 flex items-center justify-center">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step.id} className="flex items-center">
            <span
              aria-current={active ? 'step' : undefined}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                active ? 'bg-gold text-on-gold' : done ? 'text-sage' : 'text-foreground-faint'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-on-gold' : done ? 'bg-sage' : 'bg-hairline-strong'}`}
              />
              {step.label}
            </span>
            {i < STEPS.length - 1 && <span aria-hidden="true" className="h-px w-4 bg-hairline-strong sm:w-6" />}
          </li>
        );
      })}
    </ol>
  );
}
