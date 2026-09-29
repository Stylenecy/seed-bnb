import { cn } from "@/lib/cn";

type Props = {
  className?: string;
};

export function GradientMesh({ className }: Props) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute -top-32 left-1/2 size-[680px] -translate-x-1/2 rounded-full bg-violet/20 blur-[140px]" />
      <div className="absolute top-40 -left-32 size-[520px] rounded-full bg-emerald/15 blur-[140px]" />
      <div className="absolute top-10 -right-24 size-[520px] rounded-full bg-cyan/15 blur-[160px]" />
    </div>
  );
}
