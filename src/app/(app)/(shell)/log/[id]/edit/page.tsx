import { PeriodLogForm } from "@/components/period-log-form";
import { todayInTimezone } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";
import { loadAppUser } from "@/lib/user-data";
import { notFound } from "next/navigation";

export default async function EditLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, profile } = await loadAppUser();
  const log = await prisma.periodLog.findFirst({ where: { id, userId } });
  if (!log) notFound();

  const symptoms = Array.isArray(log.symptoms) ? (log.symptoms as string[]) : [];
  const today = todayInTimezone(profile.timezone);

  return (
    <div className="mx-auto max-w-sm px-1 py-4 animate-fade-up">
      <PeriodLogForm
        mode="edit"
        logId={log.id}
        today={today}
        defaultStart={log.periodStartDate}
        defaultEnd={log.periodEndDate}
        defaultMood={log.mood}
        defaultNotes={log.notes}
        defaultSymptoms={symptoms}
        cancelHref="/history"
      />
    </div>
  );
}
