"use client";

import { upsertCalendarPeriodAction } from "@/app/actions";
import { useActionState, useState } from "react";

type Kind = "period_logged" | "predicted_period" | "fertile_estimate";
type State = { error?: string } | null;

function formatShort(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function CalendarGrid({
  year,
  month,
  cells,
  markMap,
  logByDate,
}: {
  year: number;
  month: number;
  cells: (number | null)[];
  markMap: Record<string, Kind>;
  logByDate: Record<string, string>;
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
    // Once both selected, any tap resets to a new start
    if (selEnd || !selStart) {
      setSelStart(k);
      setSelEnd(null);
    } else {
      // Second tap
      if (k < selStart) {
        setSelStart(k);
        setSelEnd(null);
      } else {
        setSelEnd(k); // same date = single-day period
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
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
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
            className="rounded-full border border-rose-200 px-3.5 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-50 transition-colors duration-150"
          >
            Edit period
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="rounded-3xl border border-rose-100 bg-white/90 p-4 shadow-sm">
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-rose-800/70">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2 font-semibold">
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={`e-${i}`} />;
            const k = dateKey(d);
            const mark = markMap[k];
            const selected = inRange(k);
            const isEdge = k === selStart || k === selEnd;

            const bg = selected
              ? isEdge
                ? "bg-rose-800 text-white scale-105 z-10"
                : "bg-rose-600 text-white"
              : mark === "period_logged"
                ? editMode
                  ? "bg-rose-200/60 text-rose-900/60"
                  : "bg-rose-300 text-rose-950"
                : mark === "predicted_period"
                  ? "bg-rose-100 text-rose-900 ring-1 ring-rose-300"
                  : mark === "fertile_estimate"
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-cream text-rose-900/80";

            return (
              <div
                key={k}
                onClick={editMode ? () => handleCellClick(k) : undefined}
                className={`relative rounded-xl py-3 text-sm font-medium transition-all duration-150 ${bg} ${
                  editMode
                    ? "cursor-pointer select-none hover:ring-2 hover:ring-rose-500 hover:ring-offset-1"
                    : "hover:scale-105"
                }`}
              >
                {d}
                {isEdge && selected && (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white/70"
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save bar — appears once start is selected in edit mode */}
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
