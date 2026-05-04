import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  const [profile, logs, privacy] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.periodLog.findMany({
      where: { userId },
      orderBy: { periodStartDate: "desc" },
    }),
    prisma.privacySettings.findUnique({ where: { userId } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user: { email: user.email, createdAt: user.created_at },
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
