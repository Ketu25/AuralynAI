export function HealthDisclaimer({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs leading-relaxed text-rose-900/70">
        Predictions only — not medical advice. If something feels off or worrying, reach out to a
        qualified clinician. Fertility windows here are rough timing guesses, not ovulation
        confirmation.
      </p>
    );
  }
  return (
    <div className="rounded-2xl border border-rose-200/80 bg-rose-50/90 p-4 text-sm leading-relaxed text-rose-950/90">
      <p className="font-medium text-rose-900">A gentle reminder</p>
      <p className="mt-2">
        Auralyn is a supportive tracker. Predictions and wellness ideas describe common patterns — they
        are not diagnoses, treatments, or guarantees for your body. Cycles vary. For medical
        questions, pain, very heavy bleeding, pregnancy planning, or anything urgent, please contact
        a healthcare professional.
      </p>
    </div>
  );
}
