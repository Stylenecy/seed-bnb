import { PlayerAvatar } from "./PlayerAvatar";
import { ME, MY_NAME } from "../lib/mock";

/** Connected state of apps/web/components/ConnectButton.tsx — a secondary glass
 *  button with avatar + display name (the demo wallet is always connected). */
export function ConnectButton() {
  return (
    <button className="glass glass-hover inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-sm font-semibold text-gold-300 transition-all">
      <PlayerAvatar address={ME} size={18} />
      {MY_NAME}
    </button>
  );
}
