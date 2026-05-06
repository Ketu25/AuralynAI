"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const periodLogSchema = z.object({
  periodStartDate: dateStr,
  periodEndDate: z
    .union([dateStr, z.literal(""), z.null()])
    .transform((v) => (v === "" || v == null ? null : v)),
  symptoms: z.array(z.string()).optional(),
  mood: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

function optionalDateField(formData: FormData, key: string): string {
  const v = formData.get(key);
  if (v == null) return "";
  const s = String(v).trim();
  return s === "" ? "" : s;
}

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

async function findOverlappingLogs(
  userId: string,
  startDate: string,
  endDate: string | null,
  excludeId?: string | null,
) {
  const effectiveEnd = endDate ?? new Date().toISOString().split("T")[0]!;
  return prisma.periodLog.findMany({
    where: {
      userId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      periodStartDate: { lte: effectiveEnd },
      OR: [{ periodEndDate: { gte: startDate } }, { periodEndDate: null }],
    },
    orderBy: { periodStartDate: "asc" },
  });
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signUpAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already exists")
    ) {
      return { error: "An account with this email already exists." };
    }
    return { error: error.message };
  }

  // If Supabase email confirmation is enabled, session is null until confirmed.
  if (!data.session) {
    return {
      message: "Check your email and click the confirmation link, then sign in.",
    };
  }

  redirect("/onboarding");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export async function completeOnboardingAction(formData: FormData) {
  const userId = await requireUserId();
  const displayName = String(formData.get("displayName") ?? "").trim() || null;
  const timezone = String(formData.get("timezone") ?? "UTC");
  const defaultCycleLength = Number(formData.get("defaultCycleLength") ?? 28);
  const defaultPeriodLength = Number(formData.get("defaultPeriodLength") ?? 5);

  await prisma.userProfile.update({
    where: { userId },
    data: {
      displayName,
      timezone,
      defaultCycleLength: Math.min(45, Math.max(21, Math.round(defaultCycleLength))),
      defaultPeriodLength: Math.min(14, Math.max(2, Math.round(defaultPeriodLength))),
      onboardingCompleted: true,
    },
  });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// ── Period logs ───────────────────────────────────────────────────────────────

export async function createPeriodLogAction(_prev: unknown, formData: FormData) {
  const userId = await requireUserId();
  const symptoms = formData.getAll("symptom").map(String);
  const raw = {
    periodStartDate: String(formData.get("periodStartDate") ?? "").trim(),
    periodEndDate: optionalDateField(formData, "periodEndDate"),
    symptoms,
    mood: formData.get("mood") ? String(formData.get("mood")) : null,
    notes: formData.get("notes") ? String(formData.get("notes")) : null,
  };
  const parsed = periodLogSchema.safeParse(raw);
  if (!parsed.success) return { error: "Please check your dates and try again." };
  const { periodStartDate, periodEndDate, symptoms: sym, mood, notes } = parsed.data;
  if (periodEndDate && periodEndDate < periodStartDate) {
    return { error: "End date cannot be before start date." };
  }

  const overlapping = await findOverlappingLogs(userId, periodStartDate, periodEndDate);
  const [primary, ...extras] = overlapping;

  if (primary) {
    await prisma.periodLog.update({
      where: { id: primary.id },
      data: { periodStartDate, periodEndDate: periodEndDate ?? null, symptoms: sym ?? [], mood: mood ?? null, notes: notes ?? null },
    });
    if (extras.length > 0) {
      await prisma.periodLog.deleteMany({ where: { id: { in: extras.map((e) => e.id) } } });
    }
  } else {
    await prisma.periodLog.create({
      data: { userId, periodStartDate, periodEndDate: periodEndDate ?? null, symptoms: sym ?? [], mood: mood ?? null, notes: notes ?? null },
    });
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function updatePeriodLogAction(_prev: unknown, formData: FormData) {
  const userId = await requireUserId();
  const logId = String(formData.get("logId") ?? "");
  if (!logId) return { error: "Missing log." };
  const symptoms = formData.getAll("symptom").map(String);
  const raw = {
    periodStartDate: String(formData.get("periodStartDate") ?? "").trim(),
    periodEndDate: optionalDateField(formData, "periodEndDate"),
    symptoms,
    mood: formData.get("mood") ? String(formData.get("mood")) : null,
    notes: formData.get("notes") ? String(formData.get("notes")) : null,
  };
  const parsed = periodLogSchema.safeParse(raw);
  if (!parsed.success) return { error: "Please check your dates and try again." };
  const { periodStartDate, periodEndDate, symptoms: sym, mood, notes } = parsed.data;
  if (periodEndDate && periodEndDate < periodStartDate) {
    return { error: "End date cannot be before start date." };
  }

  // updateMany enforces ownership via userId in the WHERE clause — no separate
  // findFirst needed. Returns count=0 if the log doesn't exist or belongs to
  // a different user.
  const { count } = await prisma.periodLog.updateMany({
    where: { id: logId, userId },
    data: { periodStartDate, periodEndDate: periodEndDate ?? null, symptoms: sym ?? [], mood: mood ?? null, notes: notes ?? null },
  });
  if (count === 0) return { error: "Log not found." };

  const nowOverlapping = await findOverlappingLogs(userId, periodStartDate, periodEndDate, logId);
  if (nowOverlapping.length > 0) {
    await prisma.periodLog.deleteMany({ where: { id: { in: nowOverlapping.map((l) => l.id) } } });
  }

  revalidatePath("/", "layout");
  redirect("/history");
}

export async function deletePeriodLogAction(_prev: unknown, formData: FormData) {
  const userId = await requireUserId();
  const logId = String(formData.get("logId") ?? "");
  if (!logId) return { error: "Missing log." };
  await prisma.periodLog.deleteMany({ where: { id: logId, userId } });
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function upsertCalendarPeriodAction(_prev: unknown, formData: FormData) {
  const userId = await requireUserId();
  const startDate = String(formData.get("periodStartDate") ?? "").trim();
  const endDate = String(formData.get("periodEndDate") ?? "").trim() || null;
  const logId = String(formData.get("logId") ?? "").trim() || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return { error: "Invalid start date." };
  if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return { error: "Invalid end date." };
  if (endDate && endDate < startDate) return { error: "End date is before start date." };

  const overlapping = await findOverlappingLogs(userId, startDate, endDate);
  const primary = overlapping.find((l) => l.id === logId) ?? overlapping[0] ?? null;
  const extras = overlapping.filter((l) => l.id !== primary?.id);

  if (primary) {
    await prisma.periodLog.update({
      where: { id: primary.id },
      data: { periodStartDate: startDate, periodEndDate: endDate },
    });
    if (extras.length > 0) {
      await prisma.periodLog.deleteMany({ where: { id: { in: extras.map((e) => e.id) } } });
    }
  } else {
    await prisma.periodLog.create({
      data: { userId, periodStartDate: startDate, periodEndDate: endDate, symptoms: [], mood: null, notes: null },
    });
  }

  revalidatePath("/", "layout");
  redirect("/calendar");
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function updatePrivacyAction(formData: FormData) {
  const userId = await requireUserId();
  await prisma.privacySettings.upsert({
    where: { userId },
    create: {
      userId,
      analyticsOptIn: formData.get("analyticsOptIn") === "on",
      reminderOptIn: formData.get("reminderOptIn") === "on",
    },
    update: {
      analyticsOptIn: formData.get("analyticsOptIn") === "on",
      reminderOptIn: formData.get("reminderOptIn") === "on",
    },
  });
  revalidatePath("/settings");
}

export async function updateProfilePrefsAction(formData: FormData) {
  const userId = await requireUserId();
  await prisma.userProfile.update({
    where: { userId },
    data: {
      timezone: String(formData.get("timezone") ?? "UTC"),
      defaultCycleLength: Math.min(45, Math.max(21, Math.round(Number(formData.get("defaultCycleLength") ?? 28)))),
      defaultPeriodLength: Math.min(14, Math.max(2, Math.round(Number(formData.get("defaultPeriodLength") ?? 5)))),
    },
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
