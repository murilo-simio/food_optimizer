export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background-elevated p-6 shadow-sm shadow-black/30">
        {children}
      </div>
    </main>
  );
}
