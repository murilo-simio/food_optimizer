import * as React from "react";

import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({
  className,
  ...props
}: TextareaProps): React.JSX.Element {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-md border border-border bg-background-subtle px-3 py-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
