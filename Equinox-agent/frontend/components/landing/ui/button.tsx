import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  withArrow?: boolean;
  external?: boolean;
};

export function Button({
  href,
  children,
  variant = "primary",
  className,
  withArrow = false,
  external = false,
}: Props) {
  const isHash = href.startsWith("#");
  const Component = isHash ? "a" : Link;
  const externalProps =
    external || /^https?:/.test(href) ? { target: "_blank", rel: "noreferrer" } : {};

  const base = "group inline-flex items-center gap-3 px-6 py-3 text-sm font-medium will-change-transform hover:-translate-y-[1px] active:translate-y-0";

  if (variant === "primary") {
    return (
      <Component
        href={href as never}
        {...externalProps}
        className={cn("btn-pill-light", base, className)}
      >
        <span>{children}</span>
        {withArrow && (
          <span aria-hidden className="grid size-8 place-items-center rounded-full bg-bg text-fg transition-transform duration-300 group-hover:translate-x-0.5">
            <ArrowUpRight className="size-4" />
          </span>
        )}
      </Component>
    );
  }

  if (variant === "secondary") {
    return (
      <Component
        href={href as never}
        {...externalProps}
        className={cn("btn-pill-dark", base, className)}
      >
        <span className="text-gradient font-medium">{children}</span>
        {withArrow && (
          <ArrowUpRight className="size-4 text-fg-muted transition-transform duration-300 group-hover:translate-x-0.5" />
        )}
      </Component>
    );
  }

  return (
    <Component
      href={href as never}
      {...externalProps}
      className={cn(
        "inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg",
        className
      )}
    >
      <span>{children}</span>
    </Component>
  );
}

type IconButtonProps = {
  href?: string;
  onClick?: () => void;
  label: string;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
};

export function IconButton({
  href,
  onClick,
  label,
  className,
  children,
  external,
}: IconButtonProps) {
  if (href) {
    const isHash = href.startsWith("#");
    const Component = isHash ? "a" : Link;
    const externalProps =
      external || /^https?:/.test(href) ? { target: "_blank", rel: "noreferrer" } : {};
    return (
      <Component
        href={href as never}
        aria-label={label}
        {...externalProps}
        className={cn("btn-arrow", className)}
      >
        {children}
      </Component>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn("btn-arrow", className)}
    >
      {children}
    </button>
  );
}
