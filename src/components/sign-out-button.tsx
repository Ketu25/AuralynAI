"use client";

import { signOutAction } from "@/app/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-full px-3 py-1.5 text-rose-900/85 hover:bg-rose-100/80"
      >
        Sign out
      </button>
    </form>
  );
}
