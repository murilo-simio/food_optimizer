"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === "loading") return;

		if (session) {
			router.push("/onboarding");
		} else {
			router.push("/login");
		}
	}, [session, status, router]);

	return null;
}
