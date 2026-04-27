import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const [user, profile, logs, privacy] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, createdAt: true },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.periodLog.findMany({
      where: { userId },
      orderBy: { periodStartDate: "desc" },
    }),
    prisma.privacySettings.findUnique({ where: { userId } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user: { email: user?.email, createdAt: user?.createdAt },
    profile,
    privacy,
    periodLogs: logs,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="auralyn-cycle-export.json"`,
    },
  });
}
