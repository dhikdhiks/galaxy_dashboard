import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, ArrowRight, Layers, Pencil } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { GroupSkillsSection } from "@/components/GroupSkillsSection";
import { ProgressBar } from "@/components/ProgressBar";
import { Icon } from "@/components/icons";
import {
  averageProgress,
  getGroupBySlug,
  listGroups,
  listSkills,
} from "@/lib/db";
import type { Group } from "@/lib/types";

/**
 * Group route.
 *
 * - `connection()` marks the route request-bound so the MongoDB read (and the
 *   driver's internal timestamps) never run during prerender — that was
 *   causing "unstable value `new Date()`" errors under `cacheComponents`.
 * - `instant = false` opts this segment out of instant-navigation validation,
 *   which would otherwise flag the blocking `connection()` call.
 *
 * There is deliberately NO root `loading.tsx`: it would wrap `page.js` in a
 * `<Suspense>` boundary, starting the stream (and locking the status to 200)
 * before `notFound()` runs. Without it the 404 below is a real HTTP 404.
 */
export const instant = false;

export default async function GroupPage({
  params,
}: PageProps<"/groups/[slug]">) {
  await connection();

  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) notFound();

  return (
    <>
      <AppHeader current="group" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<GroupSkeleton />}>
          <GroupContent group={group} />
        </Suspense>
      </main>
    </>
  );
}

async function GroupContent({ group }: { group: Group }) {
  const [allGroups, skills] = await Promise.all([
    listGroups(),
    listSkills(group.id),
  ]);

  const index = allGroups.findIndex((candidate) => candidate.id === group.id);
  const previous = index > 0 ? allGroups[index - 1] : null;
  const next =
    index >= 0 && index < allGroups.length - 1 ? allGroups[index + 1] : null;

  const progress = averageProgress(skills.map((skill) => skill.progress));
  const mastered = skills.filter((skill) => skill.status === "mastered").length;

  return (
    <div className="flex flex-col gap-7">
      <nav aria-label="Back" className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Overview
        </Link>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit group
        </Link>
      </nav>

      <header className="surface relative overflow-hidden rounded-2xl p-6 sm:p-7">
        <div
          className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-purple-strong/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="surface-raised flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
              <Icon icon={group.icon} className="h-7 w-7 text-cyan" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {group.name}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
                {group.description || "No description yet."}
              </p>
            </div>
          </div>

          <dl className="flex shrink-0 gap-5 text-center sm:flex-col sm:gap-3 sm:text-left">
            <div>
              <dt className="text-xs text-muted">Skills</dt>
              <dd className="text-xl font-semibold text-foreground tabular-nums">
                {skills.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Mastered</dt>
              <dd className="text-xl font-semibold text-cyan tabular-nums">
                {mastered}
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative mt-6 flex items-center gap-3">
          <ProgressBar value={progress} className="flex-1" />
          <span className="text-sm font-medium text-foreground tabular-nums">
            {progress}%
          </span>
        </div>
      </header>

      <section aria-label="Skills">
        <GroupSkillsSection group={group} skills={skills} />
      </section>

      <nav
        aria-label="Group pagination"
        className="flex items-center justify-between gap-3 border-t border-border pt-5"
      >
        {previous ? (
          <Link
            href={`/groups/${previous.slug}`}
            className="inline-flex max-w-[45%] items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:border-purple/50 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{previous.name}</span>
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}

        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          {index + 1} / {allGroups.length}
        </span>

        {next ? (
          <Link
            href={`/groups/${next.slug}`}
            className="inline-flex max-w-[45%] items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:border-purple/50 hover:text-foreground"
          >
            <span className="truncate">{next.name}</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
      </nav>

    </div>
  );
}

function GroupSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy="true">
      <div className="h-5 w-24 animate-pulse rounded bg-surface" />
      <div className="h-44 animate-pulse rounded-2xl bg-surface" />
      <div className="h-[440px] animate-pulse rounded-2xl bg-surface" />
      <span className="sr-only">Loading group…</span>
    </div>
  );
}
