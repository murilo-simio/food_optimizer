"use server";

import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";

export async function signOutAction(): Promise<void> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await signOut({
    redirectTo: "/login",
  });
}
