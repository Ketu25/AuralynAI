import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-sm leading-relaxed text-rose-950">
      <Link href="/" className="text-rose-800 hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 text-2xl font-semibold">Privacy (summary)</h1>
      <p className="mt-4 text-rose-900/85">
        Auralyn collects the account and cycle information you choose to enter so the app can work. We
        use secure passwords, HTTPS in production, and a database under your control when you
        self-host. You can export a JSON copy of your data or delete your account from Settings.
      </p>
      <p className="mt-4 text-rose-900/85">
        Optional analytics toggles (off by default in this build) are only for improving the product
        if you opt in. Auralyn is not intended for regulated medical use; consult your own counsel for
        HIPAA or regional health-privacy obligations if you deploy this commercially.
      </p>
    </div>
  );
}
