import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDb } from "@/server/db";

export default async function HomePage(): Promise<never> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getDb().userProfile.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  redirect(profile ? "/dashboard" : "/onboarding");
}
