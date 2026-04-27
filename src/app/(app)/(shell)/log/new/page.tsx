import { PeriodLogForm } from "@/components/period-log-form";
import { todayInTimezone } from "@/lib/cycle";
import { loadAppUser } from "@/lib/user-data";

export default async function NewLogPage() {
  const { profile } = await loadAppUser();
  const today = todayInTimezone(profile.timezone);

  return (
    <div className="mx-auto max-w-sm px-1 py-4 animate-fade-up">
      <PeriodLogForm
        mode="create"
        today={today}
        defaultStart={today}
        cancelHref="/dashboard"
      />
    </div>
  );
}
