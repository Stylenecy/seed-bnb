import { PlayerAvatar } from "./PlayerAvatar";
import { Button } from "./Button";
import { shortAddress } from "../lib/identicon";
import { ME, MY_NAME } from "../lib/mock";

/** Adapted from apps/web/components/ProfileEditor.tsx — static, filled-in form. */
export function ProfileEditor() {
  return (
    <section className="glass space-y-4 rounded-xl p-5">
      <div className="flex items-center gap-4">
        <PlayerAvatar address={ME} size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-anton text-lg uppercase text-cream">{MY_NAME}</p>
          <p className="font-mono text-xs text-muted-foreground">{shortAddress(ME)}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="cursor-pointer rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-cream">
              Change photo
            </span>
            <span className="text-xs text-muted-foreground">Remove</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Display name</label>
        <div className="flex h-11 w-full items-center rounded-lg border border-border bg-card/60 px-3.5 text-sm text-foreground">
          {MY_NAME}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Bio</label>
        <div className="flex min-h-[64px] w-full rounded-lg border border-border bg-card/60 px-3.5 py-2.5 text-sm text-foreground">
          Sealing boards, calling lines. Strategy over luck. 🟢
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button>Save profile</Button>
        <span className="text-sm text-state-open">Saved ✓</span>
      </div>
    </section>
  );
}
