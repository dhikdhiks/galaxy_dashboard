import { Suspense } from "react";

import { AppHeader } from "@/components/AppHeader";
import { GroupExplorer } from "@/components/GroupExplorer";
import { getSummary, listGroupsWithStats } from "@/lib/db";
import { connection } from "next/server";

export default function HomePage() {
  return (
    <>
      <AppHeader current="overview" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Dhikdik skill galaxy
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Groups of learning resources, one click away.
          </p>
        </div>

        {/* cacheComponents is on: every uncached DB read lives inside Suspense. */}
        <Suspense fallback={<OverviewSkeleton />}>
          <OverviewContent />
        </Suspense>
      </main>
    </>
  );
}

async function OverviewContent() {
  // Request-bound: keeps the DB read (and the driver's internal timestamps)
  // out of the prerender under cacheComponents.
  await connection();

  const [rows, summary] = await Promise.all([
    listGroupsWithStats(),
    getSummary(),
  ]);

  const groups = rows.map((row) => ({
    ...row.group,
    skillCount: row.skillCount,
    progress: row.progress,
  }));

  return <GroupExplorer groups={groups} summary={summary} />;
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-surface"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      <div className="h-11 animate-pulse rounded-xl bg-surface" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-2xl bg-surface"
            style={{ animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">Loading groups…</span>
    </div>
  );
}
