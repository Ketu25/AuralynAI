import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// React.cache deduplicates this within a single render pass, so layouts,
// shell layouts, and pages that all call requireUser() or loadAppUser() share
// one getUser() network call instead of making three separate round-trips.
export const requireUser = cache(async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
});

export const loadAppUser = cache(async function loadAppUser() {
  const user = await requireUser();

  // Each upsert maps to INSERT … ON CONFLICT DO UPDATE — atomic on its own,
  // so no $transaction needed (also avoids pgbouncer transaction-mode issues).
  const [profile] = await Promise.all([
    prisma.userProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, timezone: "UTC" },
      update: {},
    }),
    prisma.privacySettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    }),
  ]);

  return { user, profile, userId: user.id };
});

export async function loadPeriodLogs(userId: string) {
  return prisma.periodLog.findMany({
    where: { userId },
    orderBy: { periodStartDate: "desc" },
  });
}
