import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-sm leading-relaxed text-rose-950">
      <Link href="/" className="text-rose-800 hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 text-2xl font-semibold">Terms (summary)</h1>
      <p className="mt-4 text-rose-900/85">
        Auralyn is provided as-is for personal wellness tracking. It does not provide medical advice,
        diagnosis, or treatment. You are responsible for how you use the data — including fertile
        window guesses — and should not rely on Auralyn as the sole basis for medical or reproductive
        decisions.
      </p>
      <p className="mt-4 text-rose-900/85">
        For a production launch, replace this page with counsel-reviewed terms and a full privacy
        policy.
      </p>
    </div>
  );
}
