"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function AccountDeleteSection() {
  const [phrase, setPhrase] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="rounded-3xl border border-red-200 bg-red-50/40 p-6">
      <h2 className="font-semibold text-red-950">Delete account</h2>
      <p className="mt-2 text-sm text-red-900/85">
        This removes your profile and all period logs from Auralyn. This cannot be undone.
      </p>
      <label className="mt-4 block text-sm font-medium text-red-950">
        Type <span className="font-mono">DELETE MY DATA</span> to confirm
        <input
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-red-200 bg-white px-3 py-2 text-red-950 outline-none"
        />
      </label>
      <button
        type="button"
        disabled={pending || phrase !== "DELETE MY DATA"}
        onClick={async () => {
          setStatus(null);
          setPending(true);
          const res = await fetch("/api/account", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confirm: "DELETE MY DATA" }),
          });
          setPending(false);
          if (!res.ok) {
            setStatus("Could not delete — try again or sign out and contact support.");
            return;
          }
          await signOut({ callbackUrl: "/" });
        }}
        className="mt-4 rounded-full bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900 disabled:opacity-50"
      >
        Permanently delete my account
      </button>
      {status ? <p className="mt-2 text-sm text-red-900">{status}</p> : null}
    </div>
  );
}
