import { HealthDisclaimer } from "@/components/disclaimer";
import { CyclePhaseCard } from "@/components/cycle-phase-card";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { differenceInCalendarDays, parseISO } from "date-fns";
import {
  buildCalendarMarks,
  calendarMonthBounds,
  computeCycleSummary,
  todayInTimezone,
} from "@/lib/cycle";
import { loadAppUser, loadPeriodLogs } from "@/lib/user-data";

function asLogArray(
  logs: { periodStartDate: string; periodEndDate: string | null }[],
) {
  return logs.map((l) => ({
    periodStartDate: l.periodStartDate,
    periodEndDate: l.periodEndDate,
  }));
}

function phaseLabel(phase: string | null) {
  if (!phase) return "—";
  const map: Record<string, string> = {
    menstrual: "Menstrual",
    follicular: "Follicular",
    ovulation: "Mid-cycle",
    luteal: "Luteal",
  };
  return map[phase] ?? phase;
}

export default async function DashboardPage() {
  const { profile, userId } = await loadAppUser();
  const rows = await loadPeriodLogs(userId);
  const logs = asLogArray(rows);
  const summary = computeCycleSummary(logs, {
    timezone: profile.timezone,
    defaultCycleLength: profile.defaultCycleLength,
    defaultPeriodLength: profile.defaultPeriodLength,
  });

  const todayStr = todayInTimezone(profile.timezone);
  const [y, m] = todayStr.split("-").map(Number);
  const { start, end } = calendarMonthBounds(y, m);
  const marks = buildCalendarMarks(logs, summary, start, end);
  const daysUntilNextPeriod = summary.nextPeriodEstimate
    ? differenceInCalendarDays(
        parseISO(summary.nextPeriodEstimate.date),
        parseISO(todayStr),
      )
    : null;

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-800/80">
            Hello{profile.displayName ? `, ${profile.displayName}` : ""}
          </p>
          <h1 className="text-3xl font-semibold text-rose-950">Your calm overview</h1>
        </div>
        <Link
          href="/log/new"
          className="inline-flex items-center justify-center rounded-full bg-rose-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-rose-800 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
        >
          Log period
        </Link>
      </div>

      {summary.message ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-950">
          {summary.message}
        </div>
      ) : null}

      {summary.phaseEstimate && summary.cycleDayEstimate && summary.averageCycleLength && summary.averagePeriodLength ? (
        <CyclePhaseCard
          phase={summary.phaseEstimate}
          cycleDay={summary.cycleDayEstimate}
          cycleLength={summary.averageCycleLength}
          periodLength={summary.averagePeriodLength}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-3d-subtle rounded-3xl border border-rose-100 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-rose-800/60">Cycle day</p>
          <p className="mt-2 text-3xl font-semibold text-rose-950">
            {summary.cycleDayEstimate ?? "—"}
          </p>
        </div>
        <div className="card-3d-subtle rounded-3xl border border-rose-100 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-rose-800/60">Current phase</p>
          <p className="mt-2 text-lg font-semibold text-rose-950">{phaseLabel(summary.phaseEstimate)}</p>
        </div>
        <div className="card-3d-subtle rounded-3xl border border-rose-100 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-rose-800/60">Next period</p>
          <p className="mt-2 text-lg font-semibold text-rose-950">
            {summary.nextPeriodEstimate?.date ? formatDate(summary.nextPeriodEstimate.date) : "—"}
          </p>
          {daysUntilNextPeriod !== null ? (
            <p className="mt-1 text-sm text-rose-900/80">
              {daysUntilNextPeriod >= 0
                ? `${daysUntilNextPeriod} day${daysUntilNextPeriod === 1 ? "" : "s"} remaining`
                : `${Math.abs(daysUntilNextPeriod)} day${Math.abs(daysUntilNextPeriod) === 1 ? "" : "s"} late`}
            </p>
          ) : null}
          {summary.nextPeriodEstimate ? (
            <p className="mt-1 text-xs text-rose-800/70">
              Confidence: {summary.nextPeriodEstimate.confidence}
              {summary.nextPeriodEstimate.isIrregular ? " · cycles vary" : ""}
            </p>
          ) : null}
        </div>
        <div className="card-3d-subtle rounded-3xl border border-sage-100 bg-sage-100/40 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-sage-600">Fertile window</p>
          <p className="mt-2 text-sm font-medium text-rose-950">
            {summary.fertileWindowEstimate
              ? `${formatDate(summary.fertileWindowEstimate.start)} → ${formatDate(summary.fertileWindowEstimate.end)}`
              : "—"}
          </p>
          <p className="mt-2 text-xs text-sage-600">{summary.fertileWindowEstimate?.label}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-rose-950">This month</h2>
          <MiniCalendar year={y} month={m} marks={marks} />
          <Link href="/calendar" className="text-sm font-medium text-rose-800 underline-offset-4 hover:underline">
            Open full calendar
          </Link>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-rose-950">Recent logs</h2>
          <ul className="space-y-2">
            {rows.slice(0, 5).map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-sm transition-colors duration-150 hover:bg-rose-50/50"
              >
                <span>
                  {formatDate(r.periodStartDate)}
                  {r.periodEndDate ? ` → ${formatDate(r.periodEndDate)}` : " (ongoing)"}
                </span>
                <Link href={`/log/${r.id}/edit`} className="text-rose-800 hover:underline">
                  Edit
                </Link>
              </li>
            ))}
            {rows.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-4 py-6 text-center text-sm text-rose-800/80">
                No logs yet — add your last period when you are ready.
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <HealthDisclaimer />
    </div>
  );
}

function MiniCalendar({
  year,
  month,
  marks,
}: {
  year: number;
  month: number;
  marks: { date: string; kind: string }[];
}) {
  const dim = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay();
  const markSet = new Map(marks.map((m) => [m.date, m.kind]));
  const cells: (number | null)[] = [...Array(firstDow).fill(null)];
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const label = new Date(year, month - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="rounded-3xl border border-rose-100 bg-white/90 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="w-6" />
        <p className="text-sm font-semibold text-rose-950">{label}</p>
        <Link
          href="/calendar"
          title="Edit period logs"
          className="flex h-6 w-6 items-center justify-center rounded-full text-rose-800/50 transition-colors duration-150 hover:bg-rose-100 hover:text-rose-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L3.63 9.896a.75.75 0 0 0-.19.33l-.707 2.475a.75.75 0 0 0 .918.918l2.476-.707a.75.75 0 0 0 .33-.19l7.382-7.382a1.75 1.75 0 0 0 0-2.475l-.351-.351Z" />
          </svg>
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-rose-800/70">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={`${d}-${i}`} className="py-1 font-medium">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} />;
          const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const kind = markSet.get(key);
          const bg =
            kind === "period_logged"
              ? "bg-rose-300 text-rose-950"
              : kind === "predicted_period"
                ? "bg-rose-100 text-rose-900 ring-1 ring-rose-300"
                : kind === "fertile_estimate"
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-cream text-rose-900/80";
          return (
            <div key={key} className={`rounded-xl py-2 ${bg}`}>
              {d}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-rose-800/80">
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-300" /> Logged
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-100 ring-1 ring-rose-300" /> Predicted
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-200" /> Fertile window
        </span>
      </div>
    </div>
  );
}
