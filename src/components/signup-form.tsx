"use client";

import { signUpAction } from "@/app/actions";
import { useActionState } from "react";

type S = { error?: string } | null;

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, null as S);

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-sm">
      {state?.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {state.error}
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
        className="w-full rounded-full bg-rose-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-rose-800"
      >
        Create account
      </button>
    </form>
  );
}
