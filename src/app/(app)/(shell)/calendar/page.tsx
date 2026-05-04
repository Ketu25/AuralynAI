import { CalendarGrid } from "@/components/calendar-grid";
import {
  buildCalendarMarks,
  calendarMonthBounds,
  computeCycleSummary,
  todayInTimezone,
} from "@/lib/cycle";
import { loadAppUser, loadPeriodLogs } from "@/lib/user-data";
import Link from "next/link";

type Kind = "period_logged" | "predicted_period" | "fertile_estimate";

function asLogs(rows: { periodStartDate: string; periodEndDate: string | null }[]) {
  return rows.map((r) => ({ periodStartDate: r.periodStartDate, periodEndDate: r.periodEndDate }));
}

function buildLogByDate(
  rows: { id: string; periodStartDate: string; periodEndDate: string | null }[],
  todayStr: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    const endStr = row.periodEndDate ?? todayStr;
    let cur = row.periodStartDate;
    while (cur <= endStr) {
      if (!out[cur]) out[cur] = row.id;
      const [y, m, d] = cur.split("-").map(Number);
      const next = new Date(y!, m! - 1, d! + 1);
      cur = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    }
  }
  return out;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const { profile, userId } = await loadAppUser();
  const sp = await searchParams;
  const todayStr = todayInTimezone(profile.timezone);
  const [ty, tm] = todayStr.split("-").map(Number);
  const year = Math.min(2100, Math.max(1970, Number(sp.y ?? ty) || ty!));
  const month = Math.min(12, Math.max(1, Number(sp.m ?? tm) || tm!));

  const rows = await loadPeriodLogs(userId);
  const logs = asLogs(rows);
  const summary = computeCycleSummary(logs, {
    timezone: profile.timezone,
    defaultCycleLength: profile.defaultCycleLength,
    defaultPeriodLength: profile.defaultPeriodLength,
  });
  const { start, end } = calendarMonthBounds(year, month);
  const marks = buildCalendarMarks(logs, summary, start, end);

  const markMap: Record<string, Kind> = {};
  for (const m of marks) markMap[m.date] = m.kind;

  const logByDate = buildLogByDate(rows, todayStr);

  const dim = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay();
  const cells: (number | null)[] = [...Array(firstDow).fill(null)];
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const label = new Date(year, month - 1, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const prev = new Date(year, month - 2, 1);
  const next = new Date(year, month, 1);
  const prevQ = `?y=${prev.getFullYear()}&m=${prev.getMonth() + 1}`;
  const nextQ = `?y=${next.getFullYear()}&m=${next.getMonth() + 1}`;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-800/50">
          Your cycle calendar
        </p>
        <h1 className="font-serif text-4xl font-semibold text-rose-950 tracking-tight leading-none">
          {label}
        </h1>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/calendar${prevQ}`}
          className="rounded-full border border-rose-200 bg-white/70 px-5 py-2 text-sm font-medium text-rose-900 backdrop-blur-sm hover:bg-rose-50 transition-colors duration-150"
        >
          ← Prev
        </Link>
        <Link
          href={`/calendar${nextQ}`}
          className="rounded-full border border-rose-200 bg-white/70 px-5 py-2 text-sm font-medium text-rose-900 backdrop-blur-sm hover:bg-rose-50 transition-colors duration-150"
        >
          Next →
        </Link>
      </div>

      {/* Calendar grid — key forces remount on navigation, replaying stagger animation */}
      <CalendarGrid
        key={`${year}-${month}`}
        year={year}
        month={month}
        cells={cells}
        markMap={markMap}
        logByDate={logByDate}
        todayStr={todayStr}
      />

      {/* Legend — pill swatches */}
      <div className="flex flex-wrap gap-2.5">
        <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-rose-800 shadow-sm backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-rose-400" aria-hidden="true" />
          Logged period
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-rose-800 shadow-sm backdrop-blur-sm">
          <svg width="5" height="7" viewBox="0 0 5 7" fill="rgba(244, 63, 94, 0.65)" aria-hidden="true">
            <path d="M2.5 0C2.5 0 5 2.8 5 4.2A2.5 2.5 0 0 1 0 4.2C0 2.8 2.5 0 2.5 0Z" />
          </svg>
          Next period
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
          Fertile window
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-amber-700 shadow-sm backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-amber-400 ring-2 ring-amber-300/50" aria-hidden="true" />
          Today
        </span>
      </div>
    </div>
  );
}
