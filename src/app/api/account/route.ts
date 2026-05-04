import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (body?.confirm !== "DELETE MY DATA") {
    return NextResponse.json(
      { error: 'Send JSON body: { "confirm": "DELETE MY DATA" }' },
      { status: 400 },
    );
  }
  await prisma.periodLog.deleteMany({ where: { userId: user.id } });
  await prisma.privacySettings.deleteMany({ where: { userId: user.id } });
  await prisma.userProfile.deleteMany({ where: { userId: user.id } });
  await createAdminClient().auth.admin.deleteUser(user.id);
  return NextResponse.json({ ok: true });
}
