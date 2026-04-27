import type { CyclePhase } from "@/lib/cycle";

const PHASE_META: Record<
  CyclePhase,
  {
    label: string;
    shortLabel: string;
    description: string;
    countdownLabel: (d: number) => string;
    activeStart: string;
    activeEnd: string;
    glowColor: string;
    bgClass: string;
    borderClass: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  menstrual: {
    label: "Menstrual Phase",
    shortLabel: "Menstrual",
    description:
      "Your body is shedding the uterine lining. Rest, warmth, and gentle movement tend to feel supportive.",
    countdownLabel: (d) => (d > 0 ? `${d} DAYS REMAINING` : "LAST DAY OF PHASE"),
    activeStart: "#fda4af",
    activeEnd: "#e11d48",
    glowColor: "rgba(225, 29, 72, 0.45)",
    bgClass: "bg-rose-50/70",
    borderClass: "border-rose-200/70",
    badgeClass: "bg-rose-100 text-rose-800",
    dotClass: "bg-rose-500",
  },
  follicular: {
    label: "Follicular Phase",
    shortLabel: "Follicular",
    description:
      "Energy often rises gradually as your body prepares for ovulation — a natural time for new starts.",
    countdownLabel: (d) => (d > 0 ? `OVULATION IN ${d}` : "OVULATION TODAY"),
    activeStart: "#86efac",
    activeEnd: "#16a34a",
    glowColor: "rgba(22, 163, 74, 0.4)",
    bgClass: "bg-emerald-50/60",
    borderClass: "border-emerald-200/60",
    badgeClass: "bg-emerald-100 text-emerald-800",
    dotClass: "bg-emerald-500",
  },
  ovulation: {
    label: "Ovulation Phase",
    shortLabel: "Ovulation",
    description:
      "Mid-cycle window — a rough timing guide only. Individual variation is common and normal.",
    countdownLabel: (d) => (d > 0 ? `LUTEAL IN ${d}` : "LUTEAL STARTS SOON"),
    activeStart: "#d8b4fe",
    activeEnd: "#9333ea",
    glowColor: "rgba(147, 51, 234, 0.4)",
    bgClass: "bg-violet-50/50",
    borderClass: "border-violet-200/60",
    badgeClass: "bg-violet-100 text-violet-800",
    dotClass: "bg-violet-500",
  },
  luteal: {
    label: "Luteal Phase",
    shortLabel: "Luteal",
    description:
      "Your body winds toward the next cycle. Steady routines and self-compassion help most.",
    countdownLabel: (d) => (d > 0 ? `PERIOD IN ${d}` : "PERIOD SOON"),
    activeStart: "#fde68a",
    activeEnd: "#d97706",
    glowColor: "rgba(217, 119, 6, 0.45)",
    bgClass: "bg-amber-50/50",
    borderClass: "border-amber-200/60",
    badgeClass: "bg-amber-100 text-amber-800",
    dotClass: "bg-amber-500",
  },
};

function buildSegments(cycleLength: number, periodLength: number) {
  const menEnd = Math.min(Math.max(periodLength, 3), 7);
  const ovCenter = Math.max(cycleLength - 14, menEnd + 3);
  const ovStart = Math.max(menEnd + 1, ovCenter - 2);
  const ovEnd = Math.min(ovCenter + 2, cycleLength - 2);

  return [
    { phase: "menstrual" as CyclePhase, start: 1, end: menEnd },
    { phase: "follicular" as CyclePhase, start: menEnd + 1, end: ovStart - 1 },
    { phase: "ovulation" as CyclePhase, start: ovStart, end: ovEnd },
    { phase: "luteal" as CyclePhase, start: ovEnd + 1, end: cycleLength },
  ];
}

// SVG canvas dimensions
const W = 480;
const H = 90;
const PAD_X = 12;
const SAMPLES = 240;

function waveY(t: number): number {
  // Smooth arch: low at edges, peaks at center, with subtle secondary wave
  return H * 0.78 - H * 0.44 * Math.sin(Math.PI * t) + H * 0.09 * Math.sin(2 * Math.PI * t);
}

function buildAllPoints(): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    pts.push([PAD_X + t * (W - 2 * PAD_X), waveY(t)]);
  }
  return pts;
}

function ptsStr(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

export function CyclePhaseCard({
  phase,
  cycleDay,
  cycleLength,
  periodLength,
}: {
  phase: CyclePhase;
  cycleDay: number;
  cycleLength: number;
  periodLength: number;
}) {
  const meta = PHASE_META[phase];
  const segments = buildSegments(cycleLength, periodLength);
  const currentSeg = segments.find((s) => s.phase === phase)!;
  const daysLeft = Math.max(0, currentSeg.end - cycleDay);

  const allPts = buildAllPoints();
  const todayIdx = Math.min(SAMPLES, Math.max(0, Math.round(((cycleDay - 1) / cycleLength) * SAMPLES)));
  const dot = allPts[todayIdx]!;
  const pastPts = allPts.slice(0, todayIdx + 1);
  const futurePts = allPts.slice(todayIdx);

  const midDay = Math.round(cycleLength / 2);
  const gradId = `wave-grad-${phase}`;
  const glowId = `dot-glow-${phase}`;

  return (
    <div className={`card-3d rounded-3xl border ${meta.borderClass} ${meta.bgClass} p-6 shadow-sm overflow-hidden`}>
      {/* ── Header ──────────────────────────────────── */}
      <div className="text-center mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-800/50 mb-1.5">
          Cycle day {cycleDay}
        </p>
        <h2 className="text-3xl font-bold text-rose-950 tracking-tight leading-none">
          {meta.label}
        </h2>
        <p
          className="mt-2 text-xs font-bold tracking-widest"
          style={{ color: meta.activeEnd }}
        >
          {meta.countdownLabel(daysLeft)}
        </p>
      </div>

      {/* ── Wave arc SVG ────────────────────────────── */}
      <div className="-mx-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2={dot[0].toFixed(1)} y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={meta.activeStart} stopOpacity="0.65" />
              <stop offset="100%" stopColor={meta.activeEnd} />
            </linearGradient>
            <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Future portion — soft, muted */}
          {futurePts.length > 1 && (
            <polyline
              points={ptsStr(futurePts)}
              fill="none"
              stroke="rgba(156, 120, 130, 0.18)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Past portion — colored gradient */}
          {pastPts.length > 1 && (
            <polyline
              points={ptsStr(pastPts)}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Glow halo behind dot */}
          <circle
            cx={dot[0]}
            cy={dot[1]}
            r="10"
            fill={meta.glowColor}
            filter={`url(#${glowId})`}
          />

          {/* Current day dot */}
          <circle
            cx={dot[0]}
            cy={dot[1]}
            r="5.5"
            fill="white"
            stroke={meta.activeEnd}
            strokeWidth="2.5"
          />
        </svg>

        {/* Day labels */}
        <div className="flex justify-between px-3 mt-0.5 text-xs text-rose-800/40 select-none">
          <span>Day 1</span>
          <span>Day {midDay}</span>
          <span>Day {cycleLength}</span>
        </div>
      </div>

      {/* ── Phase pills ─────────────────────────────── */}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {segments.map((seg) => {
          const m = PHASE_META[seg.phase];
          const isActive = seg.phase === phase;
          return (
            <span
              key={seg.phase}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                isActive ? m.badgeClass : "border border-rose-100 text-rose-800/45"
              }`}
            >
              {isActive && (
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${m.dotClass}`} aria-hidden="true" />
              )}
              {m.shortLabel}
            </span>
          );
        })}
      </div>

      {/* ── Description ─────────────────────────────── */}
      <p className="mt-3 text-center text-sm leading-relaxed text-rose-900/60">
        {meta.description}
      </p>
    </div>
  );
}
