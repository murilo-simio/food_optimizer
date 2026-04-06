import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps): React.JSX.Element {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-border bg-background-subtle px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
