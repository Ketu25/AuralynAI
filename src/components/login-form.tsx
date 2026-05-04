"use client";

import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/google-icon";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function friendlyUrlError(raw: string | null): string | null {
  if (!raw) return null;
  if (raw === "confirmation-failed") return "We couldn't verify your account. Please try signing in again.";
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = friendlyUrlError(searchParams.get("error"));

  const [error, setError] = useState<string | null>(urlError);
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, [router]);

  async function handleGoogleSignIn() {
    setError(null);
    setGooglePending(true);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGooglePending(false);
    }
    // On success the browser navigates to Google — keep loading state alive
  }

  const anyPending = pending || googlePending;

  return (
    <div className="space-y-4 rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-sm">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
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

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          setPending(true);

          const formData = new FormData(event.currentTarget);
          const email = String(formData.get("email") ?? "").toLowerCase().trim();
          const password = String(formData.get("password") ?? "");

          if (!email || !password) {
            setError("Email and password are required.");
            setPending(false);
            return;
          }

          try {
            const supabase = createClient();
            const { data, error: authError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (authError) {
              const message = authError.message.toLowerCase();
              if (message.includes("email not confirmed")) {
                setError("Please confirm your email first — check your inbox for the confirmation link.");
              } else if (message.includes("invalid login credentials")) {
                setError("Email or password is incorrect.");
              } else {
                setError(authError.message);
              }
              setPending(false);
              return;
            }

            if (!data.session) {
              setError("Sign in did not return a session. Please try again.");
              setPending(false);
              return;
            }

            const cookiePrefix = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0]}-auth-token`;
            const hasAuthCookie = document.cookie
              .split(";")
              .some((cookie) => cookie.trim().startsWith(cookiePrefix));

            if (!hasAuthCookie) {
              setError("Signed in, but the browser did not save the session cookie. Please allow cookies for this site and try again.");
              setPending(false);
              return;
            }

            router.replace("/dashboard");
            router.refresh();

            window.setTimeout(() => {
              setPending(false);
            }, 5000);
          } catch {
            setError("Could not sign in. Check your connection and try again.");
            setPending(false);
          }
        }}
        className="space-y-4"
      >
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
          disabled={anyPending}
          className="w-full rounded-full bg-rose-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-rose-800 disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in with email"}
        </button>
      </form>
    </div>
  );
}
