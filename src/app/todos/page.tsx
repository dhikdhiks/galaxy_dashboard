import { Suspense } from "react";
import { connection } from "next/server";

import { AppHeader } from "@/components/AppHeader";
import { TodoApp } from "@/components/TodoApp";
import { listGroups, listSkills, listTodosWithTasks } from "@/lib/db";

export const metadata = { title: "Todos" };

export default function TodosPage() {
  return (
    <>
      <AppHeader current="todos" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Todos
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Tasks with a time, optionally linked to a skill or
            group.
          </p>
        </div>

        {/* cacheComponents is on: uncached DB reads must sit inside Suspense. */}
        <Suspense fallback={<TodosSkeleton />}>
          <TodosContent />
        </Suspense>
      </main>
    </>
  );
}

async function TodosContent() {
  // Request-bound: keeps the DB read out of the prerender.
  await connection();

  // Pickers for the optional skill/group links on tasks.
  const [todos, groups, skills] = await Promise.all([
    listTodosWithTasks(),
    listGroups(),
    listSkills(),
  ]);
  return <TodoApp todos={todos} groups={groups} skills={skills} />;
}

function TodosSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="h-10 w-64 animate-pulse rounded-full bg-surface" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-2xl bg-surface"
          style={{ animationDelay: `${i * 70}ms` }}
        />
      ))}
      <span className="sr-only">Loading todos…</span>
    </div>
  );
}
