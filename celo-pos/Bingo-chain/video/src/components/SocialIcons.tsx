import { Mail } from "lucide-react";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** Copied from apps/web/components/landing/SocialIcons.tsx (anchor → div). */
export function SocialIcons({
  orientation = "vertical",
  className = "",
}: {
  orientation?: "vertical" | "horizontal";
  className?: string;
}) {
  return (
    <div className={`flex ${orientation === "vertical" ? "flex-col" : "flex-row"} gap-3 ${className}`}>
      <div className="liquid-glass flex size-14 items-center justify-center rounded-[1rem] text-cream">
        <Mail className="size-5" />
      </div>
      <div className="liquid-glass flex size-14 items-center justify-center rounded-[1rem] text-cream">
        <XIcon />
      </div>
    </div>
  );
}
