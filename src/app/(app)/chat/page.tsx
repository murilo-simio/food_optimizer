"use client";

import { MessageSquareText } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getProtectedPageState } from "@/lib/auth-redirect";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const protectedPageState = getProtectedPageState(status, !!session?.user);

  useEffect(() => {
    if (protectedPageState === "redirect") {
      router.push("/login");
    }
  }, [protectedPageState, router]);

  if (protectedPageState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (protectedPageState === "redirect" || !session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-bold">Chat</h1>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl px-4 py-6 pb-24">
        <div className="flex min-h-[240px] w-full flex-col items-center justify-center rounded-md border border-dashed border-border bg-background-elevated px-6 text-center">
          <MessageSquareText className="mb-4 h-10 w-10 text-foreground-muted" />
          <p className="text-sm font-medium">Tela vazia por enquanto</p>
          <p className="mt-1 text-xs text-foreground-muted">
            O chat da NutrIA entra aqui no próximo passo.
          </p>
        </div>
      </main>
    </div>
  );
}
