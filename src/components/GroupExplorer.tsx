"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { GroupCard } from "@/components/GroupCard";
import type { DashboardSummary } from "@/lib/db";
import type { Group } from "@/lib/types";

export interface GroupWithStats extends Group {
  skillCount: number;
  progress: number;
}

export function GroupExplorer({
  groups,
  summary,
}: {
  groups: GroupWithStats[];
  summary: DashboardSummary;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(q) ||
        group.slug.toLowerCase().includes(q) ||
        (group.description ?? "").toLowerCase().includes(q),
    );
  }, [groups, query]);

  const stats = [
    { label: "Groups", value: summary.groups },
    { label: "Skills", value: summary.skills },
    { label: "In progress", value: summary.inProgress },
    { label: "Mastered", value: summary.mastered },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="surface rounded-xl px-4 py-3">
            <div className="text-2xl font-semibold text-foreground tabular-nums">
              {stat.value}
            </div>
            <div className="mt-0.5 text-xs text-muted">{stat.label}</div>
          </div>
        ))}
      </section>

      <section className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search groups…"
            aria-label="Search groups"
            className="surface w-full rounded-xl py-2.5 pr-10 pl-9 text-sm text-foreground placeholder:text-muted focus:border-purple/60"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <span className="hidden text-xs text-muted sm:inline">
          {filtered.length} / {groups.length}
        </span>
      </section>

      {groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create your first group in the admin panel — each group becomes a galaxy of skills."
          action={
            <a
              href="/admin"
              className="inline-flex rounded-full bg-purple-strong px-5 py-2.5 text-sm font-medium text-background hover:bg-purple"
            >
              Create a group
            </a>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description={`Nothing matched "${query.trim()}". Try a different keyword.`}
          action={
            <button
              type="button"
              onClick={() => setQuery("")}
              className="inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted hover:text-foreground"
            >
              Clear search
            </button>
          }
        />
      ) : (
        <section
          aria-label="Groups"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </section>
      )}
    </div>
  );
}
