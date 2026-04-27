import { prisma } from "@/lib/prisma";
import { loadAppUser } from "@/lib/user-data";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { DeleteLogButton } from "@/components/delete-log-button";

export default async function HistoryPage() {
  const { userId } = await loadAppUser();
  const rows = await prisma.periodLog.findMany({
    where: { userId },
    orderBy: { periodStartDate: "desc" },
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-rose-950">History</h1>
        <Link
          href="/log/new"
          className="rounded-full bg-rose-900 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 transition-all duration-150 hover:-translate-y-0.5"
        >
          New log
        </Link>
      </div>
      <ul className="space-y-3">
        {rows.map((r) => {
          const symptoms = Array.isArray(r.symptoms) ? (r.symptoms as string[]).join(", ") : "";
          return (
            <li
              key={r.id}
              className="card-3d-subtle flex flex-col gap-3 rounded-3xl border border-rose-100 bg-white/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-rose-950">
                  {formatDate(r.periodStartDate)}
                  {r.periodEndDate ? ` → ${formatDate(r.periodEndDate)}` : " (ongoing)"}
                </p>
                {symptoms ? (
                  <p className="mt-1 text-xs text-rose-800/75">Symptoms: {symptoms}</p>
                ) : null}
                {r.mood ? <p className="mt-1 text-xs text-rose-800/75">Mood: {r.mood}</p> : null}
                {r.notes ? <p className="mt-1 text-sm text-rose-900/80">{r.notes}</p> : null}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/log/${r.id}/edit`}
                  className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-900 hover:bg-rose-50 transition-colors duration-150"
                >
                  Edit
                </Link>
                <DeleteLogButton logId={r.id} />
              </div>
            </li>
          );
        })}
      </ul>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 p-8 text-center text-rose-800/80">
          Nothing here yet — your logs will show up here.
        </p>
      ) : null}
    </div>
  );
}
