"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full px-3 py-1.5 text-rose-900/85 hover:bg-rose-100/80"
    >
      Sign out
    </button>
  );
}
