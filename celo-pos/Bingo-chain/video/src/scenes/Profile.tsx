import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/PageHeader";
import { ProfileEditor } from "../components/ProfileEditor";
import { PlayerStatsCard } from "../components/PlayerStatsCard";
import { LancePanel } from "../components/LancePanel";

/** /profile — your record: editor, stats + achievements, and the $LANCE wallet. */
export function Profile() {
  return (
    <AppShell active="/profile">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-5 px-6 py-8">
        <PageHeader eyebrow="Your record" title="Profile" accent="stats" />

        <div className="grid grid-cols-2 items-start gap-5">
          <div className="space-y-5">
            <ProfileEditor />
            <PlayerStatsCard />
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">$LANCE wallet</h2>
              <LancePanel />
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
