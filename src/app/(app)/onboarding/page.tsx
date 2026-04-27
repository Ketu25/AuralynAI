import { completeOnboardingAction } from "@/app/actions";
import { HealthDisclaimer } from "@/components/disclaimer";
import { COMMON_TIMEZONES } from "@/lib/timezones";
import { loadAppUser } from "@/lib/user-data";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const { profile } = await loadAppUser();
  if (profile.onboardingCompleted) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold text-rose-950">Welcome in</h1>
        <p className="mt-2 text-rose-900/80">
          A few basics help Auralyn show better cycle data. You can change these anytime in settings.
        </p>
      </div>
      <HealthDisclaimer />
      <form action={completeOnboardingAction} className="space-y-4 rounded-3xl border border-rose-100 bg-white/80 p-6 shadow-sm">
        <label className="block text-sm font-medium text-rose-900">
          What should we call you? (optional)
          <input
            name="displayName"
            placeholder="Your name"
            className="mt-1 w-full rounded-2xl border border-rose-100 bg-cream px-3 py-2 text-rose-950 outline-none ring-rose-200 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-rose-900">
          Timezone
          <select
            name="timezone"
            defaultValue={profile.timezone}
            className="mt-1 w-full rounded-2xl border border-rose-100 bg-cream px-3 py-2 text-rose-950 outline-none ring-rose-200 focus:ring-2"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-rose-900">
          Typical cycle length (days)
          <input
            type="number"
            name="defaultCycleLength"
            min={21}
            max={45}
            defaultValue={profile.defaultCycleLength}
            className="mt-1 w-full rounded-2xl border border-rose-100 bg-cream px-3 py-2 text-rose-950 outline-none ring-rose-200 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-rose-900">
          Typical period length (days)
          <input
            type="number"
            name="defaultPeriodLength"
            min={2}
            max={14}
            defaultValue={profile.defaultPeriodLength}
            className="mt-1 w-full rounded-2xl border border-rose-100 bg-cream px-3 py-2 text-rose-950 outline-none ring-rose-200 focus:ring-2"
          />
        </label>
        <label className="flex items-start gap-2 text-sm text-rose-900/90">
          <input type="checkbox" name="acceptDisclaimer" required className="mt-1" />
          <span>
            I understand Auralyn provides predictions and general wellness ideas, not medical advice or
            diagnosis.
          </span>
        </label>
        <button
          type="submit"
          className="w-full rounded-full bg-rose-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-rose-800 transition-all duration-200 hover:-translate-y-0.5"
        >
          Continue to my space
        </button>
      </form>
    </div>
  );
}
