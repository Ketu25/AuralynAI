"use client";

import { deletePeriodLogAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

type S = { error?: string; ok?: true } | null;

export function DeleteLogButton({ logId }: { logId: string }) {
  const router = useRouter();
  const [state, action] = useActionState(deletePeriodLogAction, null as S);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="inline">
      <input type="hidden" name="logId" value={logId} />
      <button
        type="submit"
        className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50"
      >
        Delete
      </button>
      {state?.error ? <span className="sr-only">{state.error}</span> : null}
    </form>
  );
}
