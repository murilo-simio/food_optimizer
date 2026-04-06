"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

export default function ProfilePage() {
	const { data: session } = useSession();

	if (!session?.user) {
		return null;
	}

	return (
		<div className="px-4 py-4 max-w-2xl mx-auto">
			<h1 className="text-xl font-bold mb-6">Perfil</h1>

			<div className="bg-background-elevated border border-border rounded-md p-4 mb-4">
				<p className="text-xs text-foreground-muted">Nome</p>
				<p className="text-base font-medium">{session.user.name}</p>
			</div>

			<div className="bg-background-elevated border border-border rounded-md p-4 mb-4">
				<p className="text-xs text-foreground-muted">Email</p>
				<p className="text-base font-medium">{session.user.email}</p>
			</div>

			<div className="mt-8">
				<button
					onClick={() => signOut({ callbackUrl: "/login" })}
					className="w-full border border-error text-error font-medium rounded-sm px-4 py-2 text-sm hover:bg-error/10 transition-colors min-h-[44px]"
				>
					Sair da conta
				</button>
			</div>
		</div>
	);
}
