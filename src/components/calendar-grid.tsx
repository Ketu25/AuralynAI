"use client";

import { upsertCalendarPeriodAction } from "@/app/actions";
import { useActionState, useState } from "react";

type Kind = "period_logged" | "predicted_period" | "fertile_estimate";
type State = { error?: string } | null;

const KIND_STYLE: Record<Kind, { bg: string; dot: string; glow: string }> = {
  period_logged: {
    bg: "rgba(244, 63, 94, 0.11)",
    dot: "#f43f5e",
    glow: "rgba(244, 63, 94, 0.24)",
  },
  predicted_period: {
    bg: "rgba(244, 63, 94, 0.06)",
    dot: "#f43f5e",
    glow: "rgba(244, 63, 94, 0.14)",
  },
  fertile_estimate: {
    bg: "rgba(22, 163, 74, 0.09)",
    dot: "#16a34a",
    glow: "rgba(22, 163, 74, 0.20)",
  },
};

function formatShort(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function Teardrop() {
  return (
    <svg
      width="5"
      height="7"
      viewBox="0 0 5 7"
      fill="rgba(244, 63, 94, 0.6)"
      className="mx-auto mt-0.5 block"
      aria-hidden="true"
    >
      <path d="M2.5 0C2.5 0 5 2.8 5 4.2A2.5 2.5 0 0 1 0 4.2C0 2.8 2.5 0 2.5 0Z" />
    </svg>
  );
}

export function CalendarGrid({
  year,
  month,
  cells,
  markMap,
  logByDate,
  todayStr,
}: {
  year: number;
  month: number;
  cells: (number | null)[];
  markMap: Record<string, Kind>;
  logByDate: Record<string, string>;
  todayStr: string;
}) {
  const [editMode, setEditMode] = useState(false);
  const [selStart, setSelStart] = useState<string | null>(null);
  const [selEnd, setSelEnd] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<State, FormData>(
    upsertCalendarPeriodAction,
    null,
  );

  function dateKey(d: number) {
    return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function handleCellClick(k: string) {
    if (selEnd || !selStart) {
      setSelStart(k);
      setSelEnd(null);
    } else {
      if (k < selStart) {
        setSelStart(k);
        setSelEnd(null);
      } else {
        setSelEnd(k);
      }
    }
  }

  function inRange(k: string) {
    if (!selStart) return false;
    if (!selEnd) return k === selStart;
    return k >= selStart && k <= selEnd;
  }

  function enterEdit() {
    setEditMode(true);
    setSelStart(null);
    setSelEnd(null);
  }

  function cancelEdit() {
    setEditMode(false);
    setSelStart(null);
    setSelEnd(null);
  }

  const logId = selStart ? logByDate[selStart] : undefined;
  const hint = !selStart
    ? "Tap the start date of your period"
    : !selEnd
      ? "Now tap the end date"
      : `${formatShort(selStart)} → ${formatShort(selEnd)}`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {editMode ? (
          <p className="text-xs font-medium text-rose-900/60">{hint}</p>
        ) : (
          <span />
        )}
        {editMode ? (
          <button
            type="button"
            onClick={cancelEdit}
            className="text-xs font-semibold text-rose-800/60 hover:text-rose-900 transition-colors"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={enterEdit}
            className="rounded-full border border-rose-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-rose-800 backdrop-blur-sm hover:bg-rose-50 transition-colors duration-150"
          >
            Edit period
          </button>
        )}
      </div>

      {/* Frosted glass calendar container */}
      <div className="rounded-3xl border border-white/70 bg-white/45 backdrop-blur-md shadow-sm p-4">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="py-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-rose-800/35"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cards */}
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => {
            if (d === null) return <div key={`e-${year}-${month}-${i}`} />;

            const k = dateKey(d);
            const mark = markMap[k];
            const kindStyle = mark ? KIND_STYLE[mark] : null;
            const isToday = k === todayStr;
            const selected = inRange(k);
            const isEdge = k === selStart || k === selEnd;
            const delay = Math.min(i, 41) * 16;

            let bgColor: string;
            let textClass: string;
            let borderStyle: string | undefined;

            if (selected && isEdge) {
              bgColor = "rgba(180, 83, 9, 0.88)";
              textClass = "text-white font-semibold";
            } else if (selected) {
              bgColor = "rgba(217, 119, 6, 0.60)";
              textClass = "text-white font-medium";
            } else if (kindStyle) {
              bgColor = kindStyle.bg;
              textClass = "text-rose-950/85";
              if (mark === "predicted_period") {
                borderStyle = "1px dashed rgba(244, 63, 94, 0.35)";
              }
            } else {
              bgColor = isToday
                ? "rgba(255, 255, 255, 0.92)"
                : "rgba(255, 255, 255, 0.55)";
              textClass = isToday
                ? "text-amber-800 font-semibold"
                : "text-rose-900/65";
            }

            return (
              <div
                key={`${year}-${month}-${k}`}
                className={`day-card relative rounded-xl py-2.5 px-0.5 text-center text-sm ${textClass} ${
                  selected ? "day-selected" : ""
                } ${editMode ? "cursor-pointer" : ""} ${
                  editMode && !selected
                    ? "hover:ring-2 hover:ring-rose-400/50 hover:ring-offset-1"
                    : ""
                }`}
                style={{
                  backgroundColor: bgColor,
                  border: !selected ? borderStyle : undefined,
                  "--day-glow": kindStyle?.glow ?? "rgba(0, 0, 0, 0.06)",
                  animationDelay: `${delay}ms`,
                } as React.CSSProperties}
                onClick={editMode ? () => handleCellClick(k) : undefined}
              >
                {/* Pulsing amber ring for today */}
                {isToday && !selected && (
                  <span className="today-ring absolute inset-0 rounded-xl" aria-hidden="true" />
                )}

                {d}

                {/* Phase dot */}
                {!selected && kindStyle && mark !== "predicted_period" && (
                  <span
                    className="block h-1 w-1 rounded-full mx-auto mt-0.5"
                    style={{ backgroundColor: kindStyle.dot }}
                    aria-hidden="true"
                  />
                )}

                {/* Teardrop for predicted period */}
                {!selected && mark === "predicted_period" && <Teardrop />}

                {/* Edge selection underline */}
                {isEdge && selected && (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-white/60"
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save bar */}
      {editMode && selStart && (
        <form action={formAction}>
          <input type="hidden" name="periodStartDate" value={selStart} />
          <input type="hidden" name="periodEndDate" value={selEnd ?? selStart} />
          {logId ? <input type="hidden" name="logId" value={logId} /> : null}

          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3">
            <div className="flex-1 min-w-0">
              {state?.error ? (
                <p className="text-xs text-red-700">{state.error}</p>
              ) : (
                <p className="text-xs text-rose-900/70">
                  {selEnd
                    ? `Save ${formatShort(selStart)} → ${formatShort(selEnd)}`
                    : `Save ${formatShort(selStart)} (tap an end date, or save as one day)`}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={pending}
              className="shrink-0 rounded-full bg-rose-900 px-4 py-2 text-xs font-semibold text-white shadow transition-all duration-150 hover:-translate-y-0.5 hover:bg-rose-800 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
