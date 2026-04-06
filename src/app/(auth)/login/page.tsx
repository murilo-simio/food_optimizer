"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const res = await signIn("credentials", {
			email,
			password,
			redirect: false,
		});

		setLoading(false);

		if (res?.error) {
			setError(res.error);
			return;
		}

		router.push("/onboarding");
		router.refresh();
	}

	return (
		<div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
			<div className="w-full max-w-sm">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold font-mono text-accent">
						FO
					</h1>
					<p className="text-foreground-muted text-sm mt-1">
						Food Optimizer
					</p>
				</div>

				<h2 className="text-xl font-bold mb-6">Entrar</h2>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					{error && (
						<div className="text-error text-sm bg-error/10 border border-error/20 rounded-sm px-3 py-2">
							{error}
						</div>
					)}

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="email"
							className="text-sm font-medium"
						>
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
							placeholder="seu@email.com"
							required
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="password"
							className="text-sm font-medium"
						>
							Senha
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-foreground-muted focus:border-accent transition-colors"
							placeholder="••••••"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="bg-accent text-foreground-inverse font-medium rounded-sm px-4 py-2 text-sm hover:brightness-110 transition-colors min-h-[44px] disabled:opacity-50 mt-2"
					>
						{loading ? "Entrando..." : "Entrar"}
					</button>
				</form>

				<p className="text-foreground-muted text-sm text-center mt-6">
					Não tem uma conta?{" "}
					<Link
						href="/register"
						className="text-accent hover:brightness-110"
					>
						Cadastre-se
					</Link>
				</p>
			</div>
		</div>
	);
}
