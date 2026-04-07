"use client";

import { SessionProvider } from "@/components/auth/session-provider";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SessionProvider>
			<div className="min-h-screen bg-background pb-20">{children}</div>
			<BottomNav />
		</SessionProvider>
	);
}
