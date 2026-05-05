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

  // Hot path for returning users: one read, zero writes.
  // Upsert only fires on the very first request for a brand-new account.
  let profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, timezone: "UTC" },
      update: {},
    });
  }

  return { user, profile, userId: user.id };
});

export async function loadPeriodLogs(userId: string) {
  return prisma.periodLog.findMany({
    where: { userId },
    orderBy: { periodStartDate: "desc" },
  });
}
