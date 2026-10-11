import Link from "next/link";
import { ArrowUpRight, Layers } from "lucide-react";

import { ProgressBar } from "@/components/ProgressBar";
import { Icon } from "@/components/icons";
import type { GroupWithStats } from "@/components/GroupExplorer";

export function GroupCard({ group }: { group: GroupWithStats }) {
  return (
    <Link
      href={`/groups/${group.slug}`}
      className="surface group relative flex flex-col gap-3 overflow-hidden rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-1 hover:border-purple/50"
    >
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-purple-strong/20 blur-3xl transition-opacity duration-300 group-hover:opacity-100 md:opacity-60"
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        <span className="surface-raised flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl">
          <Icon icon={group.icon} className="h-5 w-5 text-cyan" />
        </span>
        <ArrowUpRight
          className="h-4 w-4 text-muted transition-colors group-hover:text-purple"
          aria-hidden="true"
        />
      </div>

      <div className="relative">
        <h2 className="truncate text-base font-semibold text-foreground">
          {group.name}
        </h2>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted">
          {group.description || "No description yet."}
        </p>
      </div>

      <div className="relative mt-auto flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            {group.skillCount} {group.skillCount === 1 ? "skill" : "skills"}
          </span>
          <span className="font-medium text-foreground">{group.progress}%</span>
        </div>
        <ProgressBar value={group.progress} />
      </div>
    </Link>
  );
}
