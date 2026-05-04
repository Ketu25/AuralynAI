import { HealthDisclaimer } from "@/components/disclaimer";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

function MoonMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-rose-900"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Privacy-minded",
    body: "Export or delete your data anytime. No ads model in this MVP — your logs are yours.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: "Honest data",
    body: "Predictions use your history and gentle math — clearly labeled when cycles vary.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: "Supportive tone",
    body: "Phase ideas for mood, food, care, and movement — supportive, never diagnostic.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-12 px-4 py-16">
      <header className="text-center animate-fade-up">
        <div className="flex justify-center animate-float">
          <MoonMark size={40} />
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-rose-950 sm:text-5xl">
          Auralyn — gentle cycle tracking
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-rose-900/85">
          Log your cycle in a calm space, see soft predictions (never certainties), and read supportive
          ideas for each phase — built with privacy first.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-rose-900 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-rose-800 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-full bg-rose-900 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-rose-800 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                Start free
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-rose-200 bg-white/80 px-6 py-3 text-sm font-semibold text-rose-900 hover:bg-rose-50 transition-all duration-200 hover:-translate-y-0.5"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {features.map((c) => (
          <article
            key={c.title}
            className="card-3d rounded-3xl border border-rose-100 bg-white/80 p-6 shadow-sm backdrop-blur"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-800">
              {c.icon}
            </div>
            <h2 className="mt-4 font-semibold text-rose-950">{c.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-rose-900/80">{c.body}</p>
          </article>
        ))}
      </section>

      <HealthDisclaimer />

      <footer className="border-t border-rose-100 pt-8 text-center text-xs text-rose-800/70">
        <Link href="/legal/privacy" className="underline-offset-2 hover:underline">
          Privacy
        </Link>
        <span className="mx-2">·</span>
        <Link href="/legal/terms" className="underline-offset-2 hover:underline">
          Terms
        </Link>
      </footer>
    </div>
  );
}
