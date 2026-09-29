import { cn } from "@/lib/cn";
import { Badge } from "./badge";

type Props = {
  eyebrow?: string;
  title: string;
  italic?: string;
  body?: string;
  align?: "left" | "center";
  tone?: "violet" | "emerald";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  italic,
  body,
  align = "left",
  tone = "violet",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && (
        <div data-anim="fade-up">
          <Badge tone={tone}>{eyebrow}</Badge>
        </div>
      )}
      <h2
        data-anim="fade-up"
        className={cn(
          "display max-w-3xl text-[clamp(2rem,4.4vw,3.6rem)] font-semibold text-fg"
        )}
      >
        {title}
        {italic && (
          <>
            {" "}
            <span className="serif-display text-gradient">{italic}</span>
          </>
        )}
      </h2>
      {body && (
        <p
          data-anim="fade-up"
          className="max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg"
        >
          {body}
        </p>
      )}
    </div>
  );
}
