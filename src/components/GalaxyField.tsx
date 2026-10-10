"use client";

import { useState } from "react";
import { ExternalLink, LayoutGrid, List, Orbit } from "lucide-react";

import { ProgressBar } from "@/components/ProgressBar";
import { SkillStatusBadge } from "@/components/SkillStatusBadge";
import { Glyph, iconFor } from "@/components/icons";
import type { Skill } from "@/lib/types";

type ViewMode = "galaxy" | "list";

/** Above this count the floating field gets crowded, so list view is default. */
const GALAXY_LIMIT = 24;

/**
 * Deterministic layout: a golden-angle spiral. Same skill set always produces
 * the same positions (never randomize on render, per the design system), and
 * the sqrt radius keeps neighbouring chips from colliding.
 */
function spiralPosition(index: number, total: number) {
  if (total <= 1) return { left: 50, top: 50 };
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const radius = Math.sqrt((index + 0.5) / total);
  const angle = index * goldenAngle - Math.PI / 2;
  return {
    left: 50 + radius * 44 * Math.cos(angle),
    top: 50 + radius * 44 * Math.sin(angle),
  };
}

/**
 * Per-chip drift timing, derived from the index with the same golden angle as
 * the layout so neighbours fall out of step instead of bobbing in lockstep.
 * Deterministic: the same skill set always drifts the same way.
 */
function floatStyle(index: number): React.CSSProperties {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const phase = index * goldenAngle;
  const a = (Math.sin(phase) + 1) / 2; // 0..1
  const b = (Math.cos(phase * 1.618) + 1) / 2; // 0..1, decorrelated from a

  const amplitude = 6 + a * 6; // 6px..12px
  const duration = 4.5 + b * 3.5; // 4.5s..8s

  return {
    // Negative delay drops each chip into a different point of its cycle.
    animationDelay: `${-(a * duration).toFixed(2)}s`,
    animationDuration: `${duration.toFixed(2)}s`,
    "--float-amp": `${amplitude.toFixed(1)}px`,
  } as React.CSSProperties;
}

export function GalaxyField({ skills }: { skills: Skill[] }) {
  const initial: ViewMode = skills.length > GALAXY_LIMIT ? "list" : "galaxy";
  const [view, setView] = useState<ViewMode>(initial);

  const toggle = (
    <div
      role="group"
      aria-label="View mode"
      className="surface inline-flex rounded-full p-1"
    >
      <button
        type="button"
        onClick={() => setView("galaxy")}
        aria-pressed={view === "galaxy"}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          view === "galaxy"
            ? "bg-purple-strong text-background"
            : "text-muted hover:text-foreground"
        }`}
      >
        <Orbit className="h-3.5 w-3.5" aria-hidden="true" />
        Galaxy
      </button>
      <button
        type="button"
        onClick={() => setView("list")}
        aria-pressed={view === "list"}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          view === "list"
            ? "bg-purple-strong text-background"
            : "text-muted hover:text-foreground"
        }`}
      >
        <List className="h-3.5 w-3.5" aria-hidden="true" />
        List
      </button>
    </div>
  );

  if (skills.length === 0) {
    return (
      <div className="surface flex flex-col items-center gap-3 rounded-2xl px-6 py-16 text-center">
        <LayoutGrid className="h-7 w-7 text-muted" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">
          No skills in this group yet
        </p>
        <p className="max-w-sm text-sm leading-6 text-muted">
          Add the first resource from the admin panel — it will float here as a
          clickable icon.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {skills.length} {skills.length === 1 ? "skill" : "skills"} · click a
          icon to open
        </p>
        {toggle}
      </div>

      {view === "galaxy" ? (
        <div
          className="surface relative h-[440px] w-full overflow-hidden rounded-2xl sm:h-[520px]"
          aria-label="Skill galaxy"
        >
          {skills.map((skill, index) => {
            const { left, top } = spiralPosition(index, skills.length);
            const Icon = iconFor(skill.icon);
            return (
              <SkillChip
                key={skill.id}
                skill={skill}
                Icon={Icon}
                positionStyle={{ left: `${left}%`, top: `${top}%` }}
                floatStyle={floatStyle(index)}
              />
            );
          })}
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {skills.map((skill) => (
            <SkillRow key={skill.id} skill={skill} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SkillChip({
  skill,
  Icon,
  positionStyle,
  floatStyle,
}: {
  skill: Skill;
  Icon: ReturnType<typeof iconFor>;
  positionStyle: React.CSSProperties;
  floatStyle: React.CSSProperties;
}) {
  return (
    <a
      href={skill.url}
      target="_blank"
      rel="noopener noreferrer noopener"
      style={positionStyle}
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      aria-label={`${skill.name} — ${skill.status} — opens in a new tab`}
    >
      {/* `floatStyle` gives this chip its own amplitude/phase — see globals.css. */}
      <span
        style={floatStyle}
        className="surface-raised animate-float flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 group-hover:border-cyan/70 group-hover:scale-110 group-focus-visible:scale-110"
      >
        <Icon className="h-6 w-6 text-cyan" aria-hidden="true" />
      </span>

      {/* Label appears on hover/focus; essential info stays available in list view. */}
      <span className="surface-raised pointer-events-none absolute top-[calc(100%+8px)] left-1/2 hidden w-max max-w-44 -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-center group-hover:block group-focus-visible:block">
        <span className="block truncate text-xs font-medium text-foreground">
          {skill.name}
        </span>
        <span className="mt-0.5 block text-[10px] text-muted">
          {skill.progress}%
        </span>
      </span>
    </a>
  );
}

function SkillRow({ skill }: { skill: Skill }) {
  return (
    <li>
      <a
        href={skill.url}
        target="_blank"
        rel="noopener noreferrer noopener"
        className="surface flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:border-purple/50"
      >
        <span className="surface-raised flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <Glyph icon={iconFor(skill.icon)} className="h-5 w-5 text-cyan" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {skill.name}
            </span>
            <ExternalLink
              className="h-3.5 w-3.5 shrink-0 text-muted"
              aria-hidden="true"
            />
          </span>
          {skill.description ? (
            <span className="mt-0.5 line-clamp-1 block text-xs text-muted">
              {skill.description}
            </span>
          ) : null}
          <span className="mt-2 block max-w-56">
            <ProgressBar value={skill.progress} />
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end gap-2">
          <SkillStatusBadge status={skill.status} />
          <span className="text-xs font-medium text-muted tabular-nums">
            {skill.progress}%
          </span>
        </span>
      </a>
    </li>
  );
}
