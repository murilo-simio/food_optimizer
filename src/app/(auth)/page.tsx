"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status !== "loading" && session?.user?.id) {
			fetch(`/api/profile?userId=${session.user.id}`)
				.then((res) => res.json())
				.then((data) => {
					if (data.onboardingComplete) {
						router.push("/dashboard");
					} else {
						router.push("/onboarding");
					}
				})
				.catch(() => router.push("/onboarding"));
		}
	}, [session, status, router]);

	if (status === "loading") {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (!session) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	return null;
}
