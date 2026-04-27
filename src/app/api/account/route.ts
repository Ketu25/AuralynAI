import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (body?.confirm !== "DELETE MY DATA") {
    return NextResponse.json(
      { error: 'Send JSON body: { "confirm": "DELETE MY DATA" }' },
      { status: 400 },
    );
  }
  await prisma.user.delete({ where: { id: session.user.id } });
  return NextResponse.json({ ok: true });
}
