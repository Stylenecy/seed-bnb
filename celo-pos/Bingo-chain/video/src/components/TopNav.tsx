import { staticFile } from "remotion";
import { cn } from "../lib/cn";
import { ConnectButton } from "./ConnectButton";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/arenas", label: "Arenas" },
  { href: "/competition", label: "Cup" },
  { href: "/how-to-play", label: "How to play" },
  { href: "/profile", label: "Profile" },
];

/** Desktop sticky header — adapted from apps/web/components/TopNav.tsx. `active`
 *  is the current route so the matching tab glows neon. */
export function TopNav({ active }: { active: string }) {
  return (
    <header className="sticky top-0 z-40 block">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <span className="flex items-center gap-2.5">
          <img src={staticFile("logo.png")} alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
          <span className="font-anton text-xl uppercase tracking-tight">
            <span className="text-gradient-gold">BINGO</span>
            <span className="text-foreground">Chain</span>
          </span>
        </span>
        <nav className="liquid-glass rounded-full px-8 py-3">
          <ul className="flex items-center gap-7">
            {TABS.map(({ href, label }) => {
              const isActive = href === "/" ? active === "/" : active.startsWith(href);
              return (
                <li key={href}>
                  <span
                    className={cn(
                      "font-anton text-[13px] uppercase tracking-wide transition-colors",
                      isActive ? "text-neon" : "text-cream/80",
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        </nav>
        <ConnectButton />
      </div>
    </header>
  );
}
