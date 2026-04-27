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

/** YYYY-MM-DD → log id for every day covered by a period log. */
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
      <h1 className="text-2xl font-semibold text-rose-950">Calendar</h1>
      <p className="text-sm text-rose-900/80">
        Logged bleeding, a soft next-period guess, and a rough fertile window — all labeled so you
        can keep expectations gentle.
      </p>

      {/* Month navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/calendar${prevQ}`}
          className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-900 hover:bg-rose-50 transition-colors duration-150"
        >
          ← Prev
        </Link>
        <p className="text-lg font-semibold text-rose-950">{label}</p>
        <Link
          href={`/calendar${nextQ}`}
          className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-900 hover:bg-rose-50 transition-colors duration-150"
        >
          Next →
        </Link>
      </div>

      <CalendarGrid
        year={year}
        month={month}
        cells={cells}
        markMap={markMap}
        logByDate={logByDate}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-rose-800/80">
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-300" /> Logged period
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-100 ring-1 ring-rose-300" />{" "}
          Next period
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-200" /> Fertile window
          (rough)
        </span>
      </div>
    </div>
  );
}
