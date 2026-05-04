"use client";

import { signUpAction } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/google-icon";
import { useActionState, useState } from "react";

type S = { error?: string; message?: string } | null;

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, null as S);
  const [googlePending, setGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setGoogleError(null);
    setGooglePending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    if (error) {
      setGoogleError(error.message);
      setGooglePending(false);
    }
    // On success the browser navigates to Google — keep loading state alive
  }

  if (state?.message) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-900">
        <p className="font-medium">Almost there!</p>
        <p className="mt-1">{state.message}</p>
      </div>
    );
  }

  const anyPending = pending || googlePending;
  const displayError = googleError ?? state?.error ?? null;

  return (
    <div className="space-y-4 rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-sm">
      {displayError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {displayError}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={anyPending}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-rose-100 bg-white px-4 py-3 text-sm font-semibold text-rose-900 shadow-sm transition-colors hover:bg-rose-50 disabled:opacity-60"
      >
        <GoogleIcon />
        {googlePending ? "Redirecting to Google…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="flex-1 border-t border-rose-100" />
        <span className="text-xs text-rose-800/60">or</span>
        <div className="flex-1 border-t border-rose-100" />
      </div>

      <form action={formAction} className="space-y-4">
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
          Password (8+ characters)
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full rounded-2xl border border-rose-100 bg-cream px-3 py-2 text-rose-950 outline-none ring-rose-200 focus:ring-2"
          />
        </label>
        <button
          type="submit"
          disabled={anyPending}
          className="w-full rounded-full bg-rose-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-rose-800 disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account with email"}
        </button>
      </form>
    </div>
  );
}
