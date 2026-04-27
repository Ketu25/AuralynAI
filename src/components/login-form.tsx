"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const created = searchParams.get("created");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4 rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setPending(true);
        const fd = new FormData(e.currentTarget);
        const email = String(fd.get("email") ?? "");
        const password = String(fd.get("password") ?? "");
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl,
        });
        setPending(false);
        if (res?.error) {
          setError("Email or password did not match. Try again?");
          return;
        }
        router.push(callbackUrl);
        router.refresh();
      }}
    >
      {created ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Account created — you can sign in now
        </p>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </div>
      ) : null}
      <label className="block text-sm font-medium text-rose-900">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-2xl border border-rose-100 bg-cream px-3 py-2 text-rose-950 outline-none ring-rose-200 focus:ring-2"
        />
      </label>
      <label className="block text-sm font-medium text-rose-900">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-2xl border border-rose-100 bg-cream px-3 py-2 text-rose-950 outline-none ring-rose-200 focus:ring-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-rose-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-rose-800 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
