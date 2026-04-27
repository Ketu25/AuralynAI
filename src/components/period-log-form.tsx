"use client";

import { createPeriodLogAction, updatePeriodLogAction } from "@/app/actions";
import { MOODS, SYMPTOMS } from "@/lib/constants";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

type State = { error?: string } | null;

function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function generateDaysEndingAt(todayStr: string, count: number): string[] {
  const today = parseDateStr(todayStr);
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    days.push(toDateStr(d));
  }
  return days;
}

function generateDaysFromTo(startStr: string, endStr: string): string[] {
  const start = parseDateStr(startStr);
  const end = parseDateStr(endStr);
  const days: string[] = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  while (cur <= end) {
    days.push(toDateStr(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  return days;
}

function DateCard({
  dateStr,
  todayStr,
  isSelected,
  onClick,
}: {
  dateStr: string;
  todayStr: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const d = parseDateStr(dateStr);
  const day = d.getDate();
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const isToday = dateStr === todayStr;

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={onClick}
        className={`flex h-[74px] w-[56px] flex-col items-center justify-center rounded-2xl border-2 shadow-sm transition-all duration-150 ${
          isSelected
            ? "border-amber-400 bg-amber-50 shadow-amber-100"
            : "border-rose-100 bg-white hover:border-rose-200 hover:bg-rose-50/40"
        }`}
      >
        <span
          className={`text-2xl font-bold leading-none ${isSelected ? "text-amber-700" : "text-rose-950"}`}
        >
          {day}
        </span>
        <span
          className={`mt-1 text-xs font-medium ${isSelected ? "text-amber-600" : "text-rose-900/55"}`}
        >
          {month}
        </span>
      </button>
      <span
        className={`text-[10px] font-semibold uppercase tracking-wide ${
          isToday ? (isSelected ? "text-amber-500" : "text-rose-900/35") : "invisible"
        }`}
      >
        Today
      </span>
    </div>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i + 1 === current
              ? "w-6 bg-rose-700"
              : i + 1 < current
                ? "w-1.5 bg-rose-400"
                : "w-1.5 bg-rose-100"
          }`}
        />
      ))}
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = "Next",
  isSubmit = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isSubmit?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-full border border-rose-200 px-4 py-3.5 text-sm font-semibold text-rose-800 transition-all duration-150 hover:bg-rose-50"
        >
          Back
        </button>
      ) : null}
      <button
        type={isSubmit ? "submit" : "button"}
        onClick={!isSubmit ? onNext : undefined}
        className="flex-[2] rounded-full bg-rose-900 px-4 py-3.5 text-sm font-semibold text-white shadow transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-800"
      >
        {nextLabel}
      </button>
    </div>
  );
}

const TOTAL_STEPS = 4;

export function PeriodLogForm({
  mode,
  today,
  defaultStart,
  defaultEnd,
  defaultMood,
  defaultNotes,
  defaultSymptoms,
  logId,
  cancelHref,
}: {
  mode: "create" | "edit";
  today: string;
  defaultStart: string;
  defaultEnd?: string | null;
  defaultMood?: string | null;
  defaultNotes?: string | null;
  defaultSymptoms?: string[];
  logId?: string;
  cancelHref?: string;
}) {
  const action = mode === "create" ? createPeriodLogAction : updatePeriodLogAction;
  const [state, formAction] = useActionState(action, null as State);

  const [step, setStep] = useState(1);
  const [startDate, setStartDate] = useState(defaultStart);
  const [stillGoing, setStillGoing] = useState(mode === "create" ? true : !defaultEnd);
  const [endDate, setEndDate] = useState<string | null>(defaultEnd ?? null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(
    new Set(defaultSymptoms ?? []),
  );
  const [mood, setMood] = useState<string | null>(defaultMood ?? null);
  const [notes, setNotes] = useState(defaultNotes ?? "");

  const startScrollRef = useRef<HTMLDivElement>(null);
  const endScrollRef = useRef<HTMLDivElement>(null);

  // Scroll date pickers to the right (today) on mount or step change
  useEffect(() => {
    if (step === 1 && startScrollRef.current) {
      startScrollRef.current.scrollLeft = startScrollRef.current.scrollWidth;
    }
    if (step === 2 && endScrollRef.current) {
      endScrollRef.current.scrollLeft = endScrollRef.current.scrollWidth;
    }
  }, [step]);

  const startDays = generateDaysEndingAt(today, 21);
  const allStartDays = startDays.includes(startDate) ? startDays : [startDate, ...startDays];

  const endDays = generateDaysFromTo(startDate, today);
  const resolvedEndDate = endDate ?? today;

  function handleStartChange(d: string) {
    setStartDate(d);
    if (endDate && endDate < d) setEndDate(null);
  }

  function toggleSymptom(s: string) {
    setSelectedSymptoms((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-8">
      {/* Hidden inputs for server action */}
      <input type="hidden" name="periodStartDate" value={startDate} />
      <input type="hidden" name="periodEndDate" value={stillGoing ? "" : (endDate ?? "")} />
      {mode === "edit" && logId ? <input type="hidden" name="logId" value={logId} /> : null}
      {[...selectedSymptoms].map((s) => (
        <input key={s} type="hidden" name="symptom" value={s} />
      ))}
      {mood ? <input type="hidden" name="mood" value={mood} /> : null}
      <input type="hidden" name="notes" value={notes} />

      {/* Top bar: cancel + dots */}
      <div className="flex items-center justify-between">
        <StepDots current={step} total={TOTAL_STEPS} />
        <Link
          href={cancelHref ?? "/dashboard"}
          className="text-xs font-medium text-rose-900/45 hover:text-rose-900/70 transition-colors"
        >
          Cancel
        </Link>
      </div>

      {state?.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {state.error}
        </div>
      ) : null}

      {/* ── Step 1: Start date ─────────────────────────── */}
      {step === 1 && (
        <div className="space-y-8 animate-fade-up">
          <h2 className="text-[2rem] font-bold leading-tight text-rose-950">
            When did your<br />period start?
          </h2>
          <div ref={startScrollRef} className="overflow-x-auto pb-2 -mx-1 scrollbar-hide">
            <div className="flex gap-2.5 px-1">
              {allStartDays.map((d) => (
                <DateCard
                  key={d}
                  dateStr={d}
                  todayStr={today}
                  isSelected={d === startDate}
                  onClick={() => handleStartChange(d)}
                />
              ))}
            </div>
          </div>
          <NavButtons onNext={() => setStep(2)} />
        </div>
      )}

      {/* ── Step 2: End date ───────────────────────────── */}
      {step === 2 && (
        <div className="space-y-8 animate-fade-up">
          <h2 className="text-[2rem] font-bold leading-tight text-rose-950">
            When did<br />it end?
          </h2>

          <button
            type="button"
            onClick={() => setStillGoing((v) => !v)}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 shadow-sm transition-all duration-150 ${
              stillGoing
                ? "border-rose-300 bg-rose-50"
                : "border-rose-100 bg-white hover:border-rose-200"
            }`}
          >
            <span className="text-sm font-medium text-rose-900">Still going</span>
            <div
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${stillGoing ? "bg-rose-700" : "bg-rose-200"}`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${stillGoing ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </div>
          </button>

          {!stillGoing && (
            <div ref={endScrollRef} className="overflow-x-auto pb-2 -mx-1 scrollbar-hide">
              <div className="flex gap-2.5 px-1">
                {endDays.map((d) => (
                  <DateCard
                    key={d}
                    dateStr={d}
                    todayStr={today}
                    isSelected={d === resolvedEndDate}
                    onClick={() => setEndDate(d)}
                  />
                ))}
              </div>
            </div>
          )}

          <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} />
        </div>
      )}

      {/* ── Step 3: Symptoms + Mood ────────────────────── */}
      {step === 3 && (
        <div className="space-y-7 animate-fade-up">
          <h2 className="text-[2rem] font-bold leading-tight text-rose-950">
            How did<br />you feel?
          </h2>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-900/50">
              Symptoms
            </p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
                    selectedSymptoms.has(s)
                      ? "border border-rose-300 bg-rose-100 text-rose-900"
                      : "border border-rose-100 bg-white text-rose-900/65 hover:border-rose-200 hover:bg-rose-50/60"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-900/50">
              Mood
            </p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood((prev) => (prev === m.value ? null : m.value))}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
                    mood === m.value
                      ? "border border-rose-300 bg-rose-100 text-rose-900"
                      : "border border-rose-100 bg-white text-rose-900/65 hover:border-rose-200 hover:bg-rose-50/60"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} />
        </div>
      )}

      {/* ── Step 4: Notes + Summary + Submit ──────────── */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-up">
          <h2 className="text-[2rem] font-bold leading-tight text-rose-950">
            Anything<br />to add?
          </h2>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes…"
            rows={4}
            className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm text-rose-950 outline-none ring-rose-200 placeholder:text-rose-900/30 focus:ring-2 resize-none"
          />

          {/* Summary */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 space-y-1.5 text-xs text-rose-900/65">
            <div className="flex justify-between">
              <span>Start date</span>
              <span className="font-semibold text-rose-950">{startDate}</span>
            </div>
            <div className="flex justify-between">
              <span>End date</span>
              <span className="font-semibold text-rose-950">
                {stillGoing ? "Still going" : (endDate ?? today)}
              </span>
            </div>
            {selectedSymptoms.size > 0 && (
              <div className="flex justify-between gap-4">
                <span className="shrink-0">Symptoms</span>
                <span className="font-semibold text-rose-950 text-right">
                  {[...selectedSymptoms].join(", ")}
                </span>
              </div>
            )}
            {mood && (
              <div className="flex justify-between">
                <span>Mood</span>
                <span className="font-semibold text-rose-950">
                  {MOODS.find((m) => m.value === mood)?.label ?? mood}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs leading-relaxed text-rose-900/55">
            Predictions only — not medical advice. For medical concerns, reach out to a qualified
            clinician.
          </p>

          <NavButtons
            onBack={() => setStep(3)}
            nextLabel={mode === "create" ? "Save log" : "Update log"}
            isSubmit
          />
        </div>
      )}
    </form>
  );
}
