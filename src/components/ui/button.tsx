import * as React from "react";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60",
        variant === "primary" &&
          "bg-accent text-[hsl(var(--foreground-inverse))] hover:bg-accent-hover",
        variant === "secondary" &&
          "border border-border bg-background-elevated text-foreground hover:bg-background-subtle",
        variant === "ghost" &&
          "text-foreground-muted hover:bg-background-subtle hover:text-foreground",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
