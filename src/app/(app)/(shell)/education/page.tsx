import { HealthDisclaimer } from "@/components/disclaimer";
import { PHASE_INSIGHTS } from "@/data/phaseInsights";

export default function EducationPage() {
  const phases = Object.values(PHASE_INSIGHTS);
  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold text-rose-950">Understanding your cycle</h1>
        <p className="mt-2 text-sm text-rose-900/80">
          A simple map many people use to think about their month. Your experience may differ — that
          is completely normal.
        </p>
      </div>
      <div className="space-y-4">
        {phases.map((p) => (
          <section
            key={p.phase}
            className="card-3d rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-rose-950">{p.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-rose-900/85">{p.mood}</p>
          </section>
        ))}
      </div>
      <section className="rounded-3xl border border-sage-100 bg-sage-100/30 p-6 text-sm text-rose-950">
        <h2 className="font-semibold text-sage-600">How Auralyn calculates phases</h2>
        <p className="mt-2 leading-relaxed text-rose-900/85">
          We combine your last period start with a calculated cycle length (from your logs or your
          profile default). Ovulation is approximated with a common &quot;about two weeks before the
          next period&quot; rule — real bodies vary, and stress, sleep, illness, or hormones can
          shift timing. Treat everything here as a soft compass, not a clock.
        </p>
      </section>
      <HealthDisclaimer />
    </div>
  );
}
