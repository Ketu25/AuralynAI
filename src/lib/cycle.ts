import {
  addDays,
  differenceInCalendarDays,
  min as minDate,
  parseISO,
  subDays,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export type CyclePhase = "menstrual" | "follicular" | "ovulation" | "luteal";

export type PeriodLogInput = {
  periodStartDate: string;
  periodEndDate: string | null;
};

export type CycleSummary = {
  asOf: string;
  timezone: string;
  lastPeriodStart: string | null;
  cycleDayEstimate: number | null;
  phaseEstimate: CyclePhase | null;
  nextPeriodEstimate: {
    date: string;
    method: string;
    confidence: "low" | "medium" | "high";
    isIrregular: boolean;
  } | null;
  fertileWindowEstimate: {
    start: string;
    end: string;
    label: string;
  } | null;
  averageCycleLength: number | null;
  averagePeriodLength: number | null;
  message: string | null;
};

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function mean(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  return Math.sqrt(mean(nums.map((x) => (x - m) ** 2)));
}

/** YYYY-MM-DD in user's timezone */
export function todayInTimezone(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
}

export function computeIntervals(sortedStarts: string[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < sortedStarts.length; i++) {
    out.push(
      differenceInCalendarDays(
        parseISO(sortedStarts[i]!),
        parseISO(sortedStarts[i - 1]!),
      ),
    );
  }
  return out;
}

export function estimateAverageCycleLength(
  intervals: number[],
  defaultCycleLength: number,
): { value: number; confidence: "low" | "medium" | "high"; isIrregular: boolean } {
  if (intervals.length === 0) {
    return { value: defaultCycleLength, confidence: "low", isIrregular: false };
  }
  const lastN = intervals.slice(-6);
  const cv = lastN.length >= 3 ? stdDev(lastN) / mean(lastN) : 0;
  const isIrregular = cv > 0.2;

  let value: number;
  let confidence: "low" | "medium" | "high";

  if (intervals.length >= 3) {
    value = Math.round(median(lastN));
    confidence = isIrregular ? "medium" : "high";
  } else if (intervals.length === 2) {
    value = Math.round((mean(intervals) + defaultCycleLength) / 2);
    confidence = "medium";
  } else {
    value = Math.round((intervals[0]! + defaultCycleLength) / 2);
    confidence = "low";
  }

  value = Math.max(21, Math.min(45, value));
  return { value, confidence, isIrregular };
}

export function averageBleedingDays(logs: PeriodLogInput[], fallback: number): number {
  const lengths: number[] = [];
  for (const log of logs) {
    if (log.periodEndDate) {
      const d =
        differenceInCalendarDays(
          parseISO(log.periodEndDate),
          parseISO(log.periodStartDate),
        ) + 1;
      if (d > 0 && d <= 14) lengths.push(d);
    }
  }
  if (lengths.length === 0) return fallback;
  return Math.round(mean(lengths.slice(-6)));
}

export function computeCycleSummary(
  logs: PeriodLogInput[],
  options: {
    timezone: string;
    defaultCycleLength: number;
    defaultPeriodLength: number;
  },
): CycleSummary {
  const asOf = todayInTimezone(options.timezone);
  const sorted = [...logs].sort((a, b) =>
    a.periodStartDate.localeCompare(b.periodStartDate),
  );
  const starts = sorted.map((l) => l.periodStartDate);
  const lastStart = starts.length ? starts[starts.length - 1]! : null;

  if (!lastStart) {
    return {
      asOf,
      timezone: options.timezone,
      lastPeriodStart: null,
      cycleDayEstimate: null,
      phaseEstimate: null,
      nextPeriodEstimate: null,
      fertileWindowEstimate: null,
      averageCycleLength: null,
      averagePeriodLength: null,
      message: "Log your first period to see your cycle data here.",
    };
  }

  const intervals = computeIntervals(starts);
  const { value: avgCycle, confidence, isIrregular } = estimateAverageCycleLength(
    intervals,
    options.defaultCycleLength,
  );
  const avgPeriod = averageBleedingDays(sorted, options.defaultPeriodLength);
  const menstrualDays = Math.min(Math.max(avgPeriod, 3), 7);

  const rawCycleDay =
    differenceInCalendarDays(parseISO(asOf), parseISO(lastStart)) + 1;
  const cycleDayEstimate = Math.max(1, rawCycleDay);

  const nextDate = addDays(parseISO(lastStart), avgCycle);
  const nextPeriodEstimate = {
    date: formatInTimeZone(nextDate, options.timezone, "yyyy-MM-dd"),
    method:
      intervals.length >= 3
        ? "median_of_recent_cycles"
        : "blend_with_profile_default",
    confidence,
    isIrregular,
  };

  const L = avgCycle;
  const ovulationCenter = subDays(parseISO(nextPeriodEstimate.date), 14);
  const fertileStart = subDays(ovulationCenter, 5);
  const fertileEnd = addDays(ovulationCenter, 1);

  const phaseEstimate = inferPhase(
    cycleDayEstimate,
    L,
    menstrualDays,
    lastStart,
    asOf,
  );

  return {
    asOf,
    timezone: options.timezone,
    lastPeriodStart: lastStart,
    cycleDayEstimate,
    phaseEstimate,
    nextPeriodEstimate,
    fertileWindowEstimate: {
      start: formatInTimeZone(fertileStart, options.timezone, "yyyy-MM-dd"),
      end: formatInTimeZone(fertileEnd, options.timezone, "yyyy-MM-dd"),
      label:
        "Based on cycle timing only — not a substitute for ovulation tests or medical guidance.",
    },
    averageCycleLength: avgCycle,
    averagePeriodLength: avgPeriod,
    message: isIrregular
      ? "Your logged cycles vary quite a bit. Treat predictions as extra-rough and keep logging for better context."
      : null,
  };
}

function inferPhase(
  cycleDay: number,
  cycleLength: number,
  menstrualDays: number,
  lastStart: string,
  asOf: string,
): CyclePhase {
  const bleedingEndDay = Math.min(menstrualDays, cycleLength);
  if (cycleDay <= bleedingEndDay) return "menstrual";

  const nextPeriod = addDays(parseISO(lastStart), cycleLength);
  const ovulationDay = subDays(nextPeriod, 14);
  const ovStart = subDays(ovulationDay, 2);
  const ovEnd = addDays(ovulationDay, 2);
  const today = parseISO(asOf);

  if (today >= ovStart && today <= ovEnd) return "ovulation";

  if (today < ovStart) return "follicular";
  return "luteal";
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** month is 1–12 (human calendar month) */
export function calendarMonthBounds(year: number, month: number): {
  start: string;
  end: string;
} {
  const dim = new Date(year, month, 0).getDate();
  const start = `${year}-${pad2(month)}-01`;
  const end = `${year}-${pad2(month)}-${pad2(dim)}`;
  return { start, end };
}

export type CalendarDayMark = {
  date: string;
  kind: "period_logged" | "predicted_period" | "fertile_estimate";
};

export function buildCalendarMarks(
  logs: PeriodLogInput[],
  summary: CycleSummary,
  rangeStart: string,
  rangeEnd: string,
): CalendarDayMark[] {
  const marks: CalendarDayMark[] = [];
  const inRange = (d: string) => d >= rangeStart && d <= rangeEnd;

  for (const log of logs) {
    let d = parseISO(log.periodStartDate);
    const end = log.periodEndDate
      ? parseISO(log.periodEndDate)
      : minDate([parseISO(rangeEnd), parseISO(summary.asOf)]);
    while (d <= end) {
      const key = formatInTimeZone(d, "UTC", "yyyy-MM-dd");
      if (inRange(key)) marks.push({ date: key, kind: "period_logged" });
      d = addDays(d, 1);
    }
  }

  if (summary.lastPeriodStart && summary.nextPeriodEstimate) {
    const pred = parseISO(summary.nextPeriodEstimate.date);
    const predStr = formatInTimeZone(pred, "UTC", "yyyy-MM-dd");
    if (inRange(predStr)) {
      marks.push({ date: predStr, kind: "predicted_period" });
    }
  }

  if (summary.fertileWindowEstimate) {
    let d = parseISO(summary.fertileWindowEstimate.start);
    const end = parseISO(summary.fertileWindowEstimate.end);
    while (d <= end) {
      const key = formatInTimeZone(d, "UTC", "yyyy-MM-dd");
      if (inRange(key)) marks.push({ date: key, kind: "fertile_estimate" });
      d = addDays(d, 1);
    }
  }

  return marks;
}
