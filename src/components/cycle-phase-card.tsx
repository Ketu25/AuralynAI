"use client";

import { useEffect, useRef, useState } from "react";
import type { CyclePhase } from "@/lib/cycle";

const PHASE_META: Record<
  CyclePhase,
  {
    label: string;
    shortLabel: string;
    description: string;
    countdownLabel: (d: number) => string;
    dotColor: string;
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
    dotColor: "#fb7185",
    glowColor: "rgba(251, 113, 133, 0.42)",
    bgClass: "bg-rose-50/70",
    borderClass: "border-rose-200/70",
    badgeClass: "bg-rose-100 text-rose-700",
    dotClass: "bg-rose-400",
  },
  follicular: {
    label: "Follicular Phase",
    shortLabel: "Follicular",
    description:
      "Energy often rises gradually as your body prepares for ovulation — a natural time for new starts.",
    countdownLabel: (d) => (d > 0 ? `OVULATION IN ${d}` : "OVULATION TODAY"),
    dotColor: "#34d399",
    glowColor: "rgba(52, 211, 153, 0.40)",
    bgClass: "bg-emerald-50/60",
    borderClass: "border-emerald-200/60",
    badgeClass: "bg-emerald-100 text-emerald-700",
    dotClass: "bg-emerald-400",
  },
  ovulation: {
    label: "Ovulation Phase",
    shortLabel: "Ovulation",
    description:
      "Mid-cycle window — a rough timing guide only. Individual variation is common and normal.",
    countdownLabel: (d) => (d > 0 ? `LUTEAL IN ${d}` : "LUTEAL STARTS SOON"),
    dotColor: "#fbbf24",
    glowColor: "rgba(251, 191, 36, 0.40)",
    bgClass: "bg-amber-50/50",
    borderClass: "border-amber-200/60",
    badgeClass: "bg-amber-100 text-amber-700",
    dotClass: "bg-amber-400",
  },
  luteal: {
    label: "Luteal Phase",
    shortLabel: "Luteal",
    description:
      "Your body winds toward the next cycle. Steady routines and self-compassion help most.",
    countdownLabel: (d) => (d > 0 ? `PERIOD IN ${d}` : "PERIOD SOON"),
    dotColor: "#fb923c",
    glowColor: "rgba(251, 146, 60, 0.40)",
    bgClass: "bg-orange-50/45",
    borderClass: "border-orange-200/60",
    badgeClass: "bg-orange-100 text-orange-700",
    dotClass: "bg-orange-400",
  },
};

const PHASE_STROKE_COLORS: Record<CyclePhase, string> = {
  menstrual: "#fda4af",
  follicular: "#6ee7b7",
  ovulation: "#fde68a",
  luteal: "#fdba74",
};

// Open modular heart path. It is intentionally not closed: the two lower ends
// remain separated, but the silhouette reads as a real heart instead of a loop.
// The curve uses restrained lobes, a clean center notch, and long tapered sides.
const HEART_PATH =
  "M 118,278 C 88,248 48,204 36,159 C 20,96 52,48 105,43 C 133,40 151,60 160,90 C 169,60 187,40 215,43 C 268,48 300,96 284,159 C 272,204 232,248 202,278";

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

// ─── HeartArc ────────────────────────────────────────────────────────────────
// Renders the open-heart SVG with:
//   • Active segment (past): phase-colored pastel strokes, breathing glow, draws in on mount
//   • Inactive segment (future): muted neutral stroke at low opacity
//   • Glowing dot at current day, pulsing via SVG <animate>
//   • Dot position slides via CSS cx/cy geometry-property transitions

function HeartArc({
  todayPct,
  phase,
  segments,
  cycleLength,
}: {
  todayPct: number;
  phase: CyclePhase;
  segments: ReturnType<typeof buildSegments>;
  cycleLength: number;
}) {
  const activePathRef = useRef<SVGPathElement>(null);
  const [pathLen, setPathLen] = useState(670); // reasonable estimate until mount
  const [dotPos, setDotPos] = useState<{ x: number; y: number } | null>(null);
  // isDrawn toggles the draw-in transition: false = dashoffset set to hide the path,
  // true = dashoffset = 0 (triggers the CSS transition that "draws" the path in).
  const [isDrawn, setIsDrawn] = useState(false);

  useEffect(() => {
    const el = activePathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    setPathLen(len);
    const pt = el.getPointAtLength(len * todayPct);
    setDotPos({ x: pt.x, y: pt.y });
    // Double-rAF: guarantees one paint frame with dashoffset=activeLen before
    // we flip to 0, so the browser registers a real transition start.
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setIsDrawn(true)),
    );
    return () => cancelAnimationFrame(id);
  }, [todayPct]);

  const meta = PHASE_META[phase];
  const activeLen = pathLen * todayPct; // drawn (past) portion length
  const futureLen = pathLen * (1 - todayPct); // muted (future) portion length
  const futureOffset = -(activeLen); // negative offset starts future dash at todayPct

  // IDs are phase-scoped so multiple SVGs on one page never clash.
  const glowId = `ag-${phase}`;
  const dotGlowId = `dg-${phase}`;
  const activeSegments = segments
    .map((seg) => {
      const startPct = (seg.start - 1) / cycleLength;
      const endPct = seg.end / cycleLength;
      const visibleEndPct = Math.min(todayPct, endPct);
      const visiblePct = Math.max(0, visibleEndPct - startPct);

      return {
        phase: seg.phase,
        startLen: pathLen * startPct,
        visibleLen: pathLen * visiblePct,
      };
    })
    .filter((seg) => seg.visibleLen > 0.1);

  return (
    <svg
      viewBox="0 0 320 300"
      className="w-full"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Breathing glow on the active segment — slow drop-shadow pulse */}
        <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow
            dx="0" dy="0"
            stdDeviation="3"
            floodColor={meta.dotColor}
            floodOpacity="0.45"
          >
            <animate
              attributeName="stdDeviation"
              values="2;5;2"
              dur="3s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="flood-opacity"
              values="0.45;0.1;0.45"
              dur="3s"
              repeatCount="indefinite"
            />
          </feDropShadow>
        </filter>

        {/* Glow blur for the current-day dot */}
        <filter id={dotGlowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Invisible measurement path used for getTotalLength/getPointAtLength. */}
      <path
        ref={activePathRef}
        d={HEART_PATH}
        fill="none"
        stroke="transparent"
        strokeWidth="1"
      />

      {/* ── Inactive (future) segment — muted, thin, low opacity ── */}
      <path
        d={HEART_PATH}
        fill="none"
        stroke="rgba(148, 110, 120, 0.20)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${futureLen.toFixed(2)} ${pathLen.toFixed(2)}`}
        strokeDashoffset={futureOffset.toFixed(2)}
      />

      {/* ── Active (past) segments — phase-colored + breathing glow, draw in ── */}
      {activeSegments.map((seg) => (
        <path
          key={seg.phase}
          d={HEART_PATH}
          fill="none"
          stroke={PHASE_STROKE_COLORS[seg.phase]}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
          strokeDasharray={`${seg.visibleLen.toFixed(2)} ${pathLen.toFixed(2)}`}
          style={{
            strokeDashoffset: isDrawn
              ? (-seg.startLen).toFixed(2)
              : (seg.visibleLen - seg.startLen).toFixed(2),
            transition: isDrawn
              ? "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)"
              : "none",
          }}
        />
      ))}

      {/* ── Current-day dot ─────────────────────────────────────── */}
      {dotPos && (
        <>
          {/* Pulsing halo */}
          <circle
            cx={dotPos.x}
            cy={dotPos.y}
            r="11"
            fill={meta.glowColor}
            filter={`url(#${dotGlowId})`}
          >
            <animate
              attributeName="r"
              values="11;15;11"
              dur="2.4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.65;0;0.65"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Outer ring — 12px diameter (r=6 in SVG units ≈ 6×1.2px = 7.2px radius at 360px width) */}
          <circle
            cx={dotPos.x}
            cy={dotPos.y}
            r="6"
            fill="white"
            stroke={meta.dotColor}
            strokeWidth="2"
            className="dot-slide"
          />

          {/* Inner fill dot — 4px diameter */}
          <circle
            cx={dotPos.x}
            cy={dotPos.y}
            r="1.8"
            fill={meta.dotColor}
            className="dot-slide"
          />
        </>
      )}
    </svg>
  );
}

// ─── CyclePhaseCard ───────────────────────────────────────────────────────────

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
  const todayPct = Math.min(1, Math.max(0, (cycleDay - 1) / cycleLength));

  return (
    <div
      className={`card-3d animate-fade-up rounded-3xl border ${meta.borderClass} ${meta.bgClass} shadow-md overflow-hidden mx-auto`}
      style={{ maxWidth: "360px" }}
    >
      {/* ── Heart SVG with text overlay inside ────────────── */}
      <div className="relative px-3 pt-3">
        <HeartArc
          todayPct={todayPct}
          phase={phase}
          segments={segments}
          cycleLength={cycleLength}
        />

        {/* Text floats inside the heart's lower body */}
        <div
          className="absolute text-center pointer-events-none"
          style={{
            top: "62%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "52%",
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-800/55 mb-1">
            Cycle day {cycleDay}
          </p>
          <h2 className="font-serif text-2xl font-bold text-rose-950 leading-tight">
            {meta.label}
          </h2>
          <p
            className="mt-1.5 text-[10px] font-bold tracking-widest"
            style={{ color: meta.dotColor }}
          >
            {meta.countdownLabel(daysLeft)}
          </p>
        </div>
      </div>

      {/* ── Phase pills ────────────────────────────────────── */}
      <div className="flex flex-wrap justify-center gap-1.5 px-4 pt-1 pb-3">
        {segments.map((seg) => {
          const m = PHASE_META[seg.phase];
          const isActive = seg.phase === phase;
          return (
            <span
              key={seg.phase}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                isActive ? m.badgeClass : "border border-rose-100 text-rose-800/40"
              }`}
            >
              {isActive && (
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${m.dotClass}`}
                  aria-hidden="true"
                />
              )}
              {m.shortLabel}
            </span>
          );
        })}
      </div>

      {/* ── Description ────────────────────────────────────── */}
      <p className="text-center text-xs leading-relaxed px-5 pb-5 text-rose-900/58">
        {meta.description}
      </p>
    </div>
  );
}
