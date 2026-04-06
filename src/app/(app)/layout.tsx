import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/(app)/actions";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-accent">
              Food Optimizer
            </p>
            <p className="text-sm text-foreground-muted">
              Fase 1: autenticacao e onboarding
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="rounded-md px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-background-subtle hover:text-foreground"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <form action={signOutAction}>
              <Button type="submit" variant="secondary">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 pb-20">
        {children}
      </main>
    </div>
  );
}
