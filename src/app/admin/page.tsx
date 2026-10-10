import { Suspense } from "react";
import { connection } from "next/server";

import { AppHeader } from "@/components/AppHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { listGroups, listSkills } from "@/lib/db";

export const metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <>
      <AppHeader current="admin" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Admin
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Create groups, add skills and keep progress up to date.
          </p>
        </div>

        {/* cacheComponents is on: uncached DB reads must sit inside Suspense. */}
        <Suspense fallback={<AdminSkeleton />}>
          <AdminContent />
        </Suspense>
      </main>
    </>
  );
}

async function AdminContent() {
  // Request-bound: keeps the DB read out of the prerender under cacheComponents.
  await connection();

  const [groups, skills] = await Promise.all([listGroups(), listSkills()]);
  return <AdminPanel groups={groups} skills={skills} />;
}

function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="h-10 w-56 animate-pulse rounded-full bg-surface" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-xl bg-surface"
          style={{ animationDelay: `${i * 70}ms` }}
        />
      ))}
      <span className="sr-only">Loading admin…</span>
    </div>
  );
}
