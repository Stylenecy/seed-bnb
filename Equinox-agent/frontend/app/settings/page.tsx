"use client";

import { useState } from "react";
import { Copy, Check, LogOut, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { mockUser } from "@/data/mock";
import { shortAddress } from "@/lib/format";

const NOTIFY = [
  { key: "defense", label: "Defense alerts", hint: "When HF crosses your threshold.", def: true },
  { key: "spread", label: "Spread milestones", hint: "Every 5% of debt repaid.", def: false },
  { key: "mode", label: "Mode adjustments", hint: "When agent rebalances allocation.", def: true },
];

const CURRENCIES = ["USD", "IDR", "EUR"];
const THEMES = ["Light", "Dark"];

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [theme, setTheme] = useState("Dark");

  const copy = async () => {
    await navigator.clipboard.writeText(mockUser.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[820px] space-y-8">
        <header>
          <h1 className="text-[28px] font-medium tracking-[-0.015em] text-ink-50">
            Settings
          </h1>
          <p className="mt-1 text-[13px] text-ink-400">
            Personal preferences. Only you can see these.
          </p>
        </header>

        <Section title="Account" intro="Identity for this device.">
          <Row k="Email" v={mockUser.email} hint="From your login provider" />
          <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4 last:border-0">
            <div className="min-w-0">
              <div className="text-[13.5px] text-ink-100">BNB Chain address</div>
              <div className="mt-1 font-mono text-[11.5px] text-ink-400">
                {shortAddress(mockUser.walletAddress, 10, 8)}
              </div>
            </div>
            <button
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[12px] text-ink-100 hover:bg-white/[0.05]"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <Row k="Session" v="Wallet session · expires in 11h 42m" />
        </Section>

        <Section
          title="Notifications"
          intro="Email + in-app. Off by default for low-signal events."
        >
          {NOTIFY.map((n) => (
            <div
              key={n.key}
              className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4 last:border-0"
            >
              <div>
                <div className="text-[13.5px] text-ink-100">{n.label}</div>
                <div className="mt-1 text-[11.5px] text-ink-400">{n.hint}</div>
              </div>
              <Toggle defaultOn={n.def} label={n.label} />
            </div>
          ))}
        </Section>

        <Section title="Display" intro="Visual & locale.">
          <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
            <div>
              <div className="text-[13.5px] text-ink-100">Currency</div>
              <div className="mt-1 text-[11.5px] text-ink-400">
                Used across cards, modals, and exports.
              </div>
            </div>
            <Pills value={currency} onChange={setCurrency} options={CURRENCIES} />
          </div>
          <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
            <div>
              <div className="text-[13.5px] text-ink-100">Theme</div>
              <div className="mt-1 text-[11.5px] text-ink-400">
                Light mode is coming soon. Currently Dark only.
              </div>
            </div>
            <Pills
              value={theme}
              onChange={setTheme}
              options={THEMES}
              disabled={["Light"]}
            />
          </div>
          <Row k="Language" v="English (Indonesian coming soon)" />
        </Section>

        <Section title="Advanced" intro="Power-user options.">
          <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4 last:border-0 opacity-60">
            <div>
              <div className="text-[13.5px] text-ink-100">Pro Mode</div>
              <div className="mt-1 text-[11.5px] text-ink-400">
                Manual rebalance, custom routing, deeper analytics. Coming soon.
              </div>
            </div>
            <Toggle disabled label="Pro mode" />
          </div>
        </Section>

        <section className="overflow-hidden rounded-3xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/[0.04]">
          <div className="border-b border-[var(--color-danger)]/20 px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-[var(--color-danger)]" />
              <h2 className="text-[14px] font-medium text-ink-50">
                Danger zone
              </h2>
            </div>
            <p className="mt-1 text-[12.5px] text-ink-400">
              Irreversible. Make sure you understand the consequences.
            </p>
          </div>
          <div className="divide-y divide-[var(--color-danger)]/15">
            <DangerRow
              k="Close all positions"
              hint="Unwinds everything and returns collateral. Spread captured stays in your Shadow wallet."
              cta="Close all"
            />
            <DangerRow
              k="Delete account"
              hint="Removes your profile from Equinox. You'll need to re-onboard to use the agent again."
              cta="Delete"
            />
          </div>
        </section>

        <div className="flex items-center justify-between border-t border-white/[0.05] pt-6">
          <span className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-ink-500">
            v0.1.0 · build a7c4d2
          </span>
          <Button variant="outline" size="sm" className="!h-9">
            <LogOut size={13} />
            Log out
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-[16px] font-medium tracking-[-0.005em] text-ink-50">
          {title}
        </h2>
        <p className="mt-0.5 text-[12.5px] text-ink-400">{intro}</p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[var(--bg-card)]/55">
        {children}
      </div>
    </section>
  );
}

function Row({ k, v, hint }: { k: string; v: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4 last:border-0">
      <div>
        <div className="text-[13.5px] text-ink-100">{k}</div>
        {hint && <div className="mt-1 text-[11.5px] text-ink-400">{hint}</div>}
      </div>
      <span className="text-[13px] text-ink-300">{v}</span>
    </div>
  );
}

function Pills({
  value,
  onChange,
  options,
  disabled = [],
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: string[];
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
      {options.map((opt) => {
        const active = opt === value;
        const isDisabled = disabled.includes(opt);
        return (
          <button
            key={opt}
            disabled={isDisabled}
            onClick={() => onChange(opt)}
            className={`rounded-full px-3 py-1.5 text-[12px] transition-colors ${
              active ? "bg-white/[0.06] text-ink-50" : "text-ink-300 hover:text-ink-100"
            } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function DangerRow({
  k,
  hint,
  cta,
}: {
  k: string;
  hint: string;
  cta: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <div className="text-[13.5px] text-ink-100">{k}</div>
        <div className="mt-1 text-[11.5px] text-ink-400 max-w-md">{hint}</div>
      </div>
      <button className="rounded-full border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3.5 py-2 text-[12.5px] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/20">
        {cta}
      </button>
    </div>
  );
}
