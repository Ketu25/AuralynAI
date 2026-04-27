import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function loadAppUser() {
  const session = await requireSession();
  const userId = session.user.id;
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });
  if (!profile) redirect("/login");
  return { session, profile, userId };
}

export async function loadPeriodLogs(userId: string) {
  return prisma.periodLog.findMany({
    where: { userId },
    orderBy: { periodStartDate: "desc" },
  });
}
