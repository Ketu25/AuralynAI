"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

/** Empty optional date fields come through as "" or missing — normalize so Zod always sees "" or YYYY-MM-DD. */
function optionalDateField(formData: FormData, key: string): string {
  const v = formData.get(key);
  if (v == null) return "";
  const s = String(v).trim();
  return s === "" ? "" : s;
}

function requireUserId() {
  return auth().then((s) => {
    if (!s?.user?.id) throw new Error("Unauthorized");
    return s.user.id;
  });
}

/**
 * Returns all period logs for `userId` whose date range overlaps [startDate, endDate].
 * A null endDate is treated as "today (UTC)" for the overlap check.
 * Pass `excludeId` to skip the log currently being edited.
 */
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
      // Existing log must start on or before our range ends
      periodStartDate: { lte: effectiveEnd },
      // Existing log must end on or after our range starts (or be ongoing)
      OR: [{ periodEndDate: { gte: startDate } }, { periodEndDate: null }],
    },
    orderBy: { periodStartDate: "asc" },
  });
}

export async function signUpAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };
  const passwordHash = await hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: {
        create: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
        },
      },
      privacy: { create: {} },
    },
  });
  redirect("/login?created=1");
}

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
    // Update the earliest overlapping log rather than creating a duplicate.
    await prisma.periodLog.update({
      where: { id: primary.id },
      data: {
        periodStartDate,
        periodEndDate: periodEndDate ?? null,
        symptoms: sym ?? [],
        mood: mood ?? null,
        notes: notes ?? null,
      },
    });
    // Remove any additional overlapping logs that are now redundant.
    if (extras.length > 0) {
      await prisma.periodLog.deleteMany({ where: { id: { in: extras.map((e) => e.id) } } });
    }
  } else {
    await prisma.periodLog.create({
      data: {
        userId,
        periodStartDate,
        periodEndDate: periodEndDate ?? null,
        symptoms: sym ?? [],
        mood: mood ?? null,
        notes: notes ?? null,
      },
    });
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function updatePeriodLogAction(_prev: unknown, formData: FormData) {
  const userId = await requireUserId();
  const logId = String(formData.get("logId") ?? "");
  if (!logId) return { error: "Missing log." };
  const log = await prisma.periodLog.findFirst({ where: { id: logId, userId } });
  if (!log) return { error: "Log not found." };
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
  await prisma.periodLog.update({
    where: { id: logId },
    data: {
      periodStartDate,
      periodEndDate: periodEndDate ?? null,
      symptoms: sym ?? [],
      mood: mood ?? null,
      notes: notes ?? null,
    },
  });

  // After the date change, remove any other logs that now overlap with this one.
  const nowOverlapping = await findOverlappingLogs(userId, periodStartDate, periodEndDate, logId);
  if (nowOverlapping.length > 0) {
    await prisma.periodLog.deleteMany({
      where: { id: { in: nowOverlapping.map((l) => l.id) } },
    });
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

  // Find all logs that overlap the selected range, regardless of the UI hint.
  const overlapping = await findOverlappingLogs(userId, startDate, endDate);

  // Prefer the log the UI identified (logId), fall back to the earliest overlapping one.
  const primary =
    overlapping.find((l) => l.id === logId) ?? overlapping[0] ?? null;
  const extras = overlapping.filter((l) => l.id !== primary?.id);

  if (primary) {
    await prisma.periodLog.update({
      where: { id: primary.id },
      data: { periodStartDate: startDate, periodEndDate: endDate },
    });
    // Remove any additional overlapping logs that are now redundant.
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
      defaultCycleLength: Math.min(
        45,
        Math.max(21, Math.round(Number(formData.get("defaultCycleLength") ?? 28))),
      ),
      defaultPeriodLength: Math.min(
        14,
        Math.max(2, Math.round(Number(formData.get("defaultPeriodLength") ?? 5))),
      ),
    },
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
