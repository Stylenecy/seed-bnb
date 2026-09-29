import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  as: Tag = "div",
  interactive = false,
  ...rest
}: {
  className?: string;
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  interactive?: boolean;
} & React.HTMLAttributes<HTMLElement>) {
  const Component = Tag as React.ElementType;
  return (
    <Component
      {...rest}
      className={cn(
        "relative rounded-2xl border border-white/[0.06] bg-[var(--bg-card)]/60",
        "backdrop-blur-[2px]",
        interactive &&
          "transition-colors duration-300 hover:border-white/15 hover:bg-[var(--bg-card)]/80",
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-6 pb-3", className)}>{children}</div>;
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("px-6 pb-6", className)}>{children}</div>;
}

export function Hairline({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-white/[0.06]", className)} />;
}
