"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  children: React.ReactNode;
}

export function SubmitButton({
  children,
}: SubmitButtonProps): React.JSX.Element {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Salvando..." : children}
    </Button>
  );
}
