import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { useRevealOnScroll } from "../lib/use-reveal-on-scroll";

type RevealSectionProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right";
};

export function RevealSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
  ...rest
}: RevealSectionProps) {
  const { ref, isVisible } = useRevealOnScroll<HTMLDivElement>();

  const classes = [
    "reveal-section",
    `reveal-${direction}`,
    isVisible ? "reveal-visible" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={ref}
      className={classes}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}
