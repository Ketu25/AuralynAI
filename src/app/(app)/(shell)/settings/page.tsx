import { updatePrivacyAction, updateProfilePrefsAction } from "@/app/actions";
import { AccountDeleteSection } from "@/components/account-delete-section";
import { prisma } from "@/lib/prisma";
import { COMMON_TIMEZONES } from "@/lib/timezones";
import { loadAppUser } from "@/lib/user-data";
import Link from "next/link";

export default async function SettingsPage() {
  const { profile, userId } = await loadAppUser();
  const privacy = await prisma.privacySettings.findUnique({ where: { userId } });

  return (
    <div className="space-y-10 animate-fade-up">
      <h1 className="text-2xl font-semibold text-rose-950">Settings</h1>

      <section className="card-3d-subtle rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-sm">
        <h2 className="font-semibold text-rose-950">Cycle defaults</h2>
        <p className="mt-1 text-sm text-rose-900/75">
          Used when Auralyn does not yet have enough history — you can refine anytime.
        </p>
        <form action={updateProfilePrefsAction} className="mt-4 space-y-4">
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
            Default cycle length (days)
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
            Default period length (days)
            <input
              type="number"
              name="defaultPeriodLength"
              min={2}
              max={14}
              defaultValue={profile.defaultPeriodLength}
              className="mt-1 w-full rounded-2xl border border-rose-100 bg-cream px-3 py-2 text-rose-950 outline-none ring-rose-200 focus:ring-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-rose-900 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-800 transition-all duration-150 hover:-translate-y-0.5"
          >
            Save preferences
          </button>
        </form>
      </section>

      <section className="card-3d-subtle rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-sm">
        <h2 className="font-semibold text-rose-950">Privacy</h2>
        <form action={updatePrivacyAction} className="mt-4 space-y-3 text-sm text-rose-900/85">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="analyticsOptIn"
              defaultChecked={privacy?.analyticsOptIn ?? false}
              className="mt-1"
            />
            <span>
              Allow optional product analytics (placeholder — wire to your provider only if you add
              one).
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="reminderOptIn"
              defaultChecked={privacy?.reminderOptIn ?? false}
              className="mt-1"
            />
            <span>Email reminders (coming soon — for a future mobile-friendly version).</span>
          </label>
          <button
            type="submit"
            className="mt-2 rounded-full border border-rose-200 px-5 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-50 transition-colors duration-150"
          >
            Save privacy choices
          </button>
        </form>
        <div className="mt-6 border-t border-rose-100 pt-6">
          <h3 className="text-sm font-semibold text-rose-950">Export data</h3>
          <p className="mt-1 text-sm text-rose-900/75">Download everything Auralyn stores for you.</p>
          <a
            href="/api/export"
            className="mt-3 inline-flex rounded-full bg-sage-100 px-5 py-2 text-sm font-semibold text-sage-600 hover:bg-sage-100/80 transition-colors duration-150"
          >
            Download JSON
          </a>
        </div>
      </section>

      <section className="card-3d-subtle rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-sm">
        <h2 className="font-semibold text-rose-950">Notifications</h2>
        <p className="mt-2 text-sm text-rose-900/75">
          Push and email reminders are planned for a later release alongside mobile apps. For now,
          Auralyn is a quiet web journal you visit when you choose.
        </p>
      </section>

      <AccountDeleteSection />

      <p className="text-center text-xs text-rose-800/70">
        <Link href="/legal/privacy" className="underline-offset-2 hover:underline">
          Privacy policy
        </Link>
        <span className="mx-2">·</span>
        <Link href="/legal/terms" className="underline-offset-2 hover:underline">
          Terms
        </Link>
      </p>
    </div>
  );
}
