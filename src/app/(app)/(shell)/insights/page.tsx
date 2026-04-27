import { HealthDisclaimer } from "@/components/disclaimer";
import { PHASE_INSIGHTS } from "@/data/phaseInsights";
import { computeCycleSummary } from "@/lib/cycle";
import { loadAppUser, loadPeriodLogs } from "@/lib/user-data";

function asLogs(rows: { periodStartDate: string; periodEndDate: string | null }[]) {
  return rows.map((r) => ({ periodStartDate: r.periodStartDate, periodEndDate: r.periodEndDate }));
}

export default async function InsightsPage() {
  const { profile, userId } = await loadAppUser();
  const rows = await loadPeriodLogs(userId);
  const summary = computeCycleSummary(asLogs(rows), {
    timezone: profile.timezone,
    defaultCycleLength: profile.defaultCycleLength,
    defaultPeriodLength: profile.defaultPeriodLength,
  });
  const phase = summary.phaseEstimate;
  const insight = phase ? PHASE_INSIGHTS[phase] : null;

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="text-2xl font-semibold text-rose-950">Today&apos;s gentle insights</h1>
      <p className="text-sm text-rose-900/80">
        Supportive ideas based on a common phase model — not personalized medical guidance.
      </p>
      {!insight ? (
        <p className="rounded-2xl border border-rose-100 bg-white/80 p-6 text-rose-900/85">
          Log a period to see phase-based ideas here.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <article className="card-3d rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-rose-950">{insight.title}</h2>
            <p className="mt-1 text-xs uppercase tracking-wide text-rose-800/60">Current phase</p>
          </article>
          <InsightCard title="Mood patterns you might notice" body={insight.mood} />
          <InsightCard title="Food ideas (general)" body={insight.food} />
          <InsightCard title="Self-care" body={insight.selfCare} />
          <InsightCard title="Movement &amp; activities" body={insight.activity} />
        </div>
      )}
      <HealthDisclaimer />
    </div>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="card-3d rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/50 p-6 shadow-sm">
      <h3 className="font-semibold text-rose-950">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-rose-900/85">{body}</p>
    </article>
  );
}
