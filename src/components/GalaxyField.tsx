"use client";

import { useMemo, useRef, useState } from "react";
import {
  ExternalLink,
  LayoutGrid,
  List,
  Orbit,
  Pencil,
  RotateCcw,
} from "lucide-react";

import { deleteSkillAction } from "@/app/admin/actions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ProgressBar } from "@/components/ProgressBar";
import { SkillStatusBadge } from "@/components/SkillStatusBadge";
import { Icon } from "@/components/icons";
import { SKILL_STATUSES, type Skill, type SkillStatus } from "@/lib/types";

type ViewMode = "galaxy" | "list";

/** Status filter options for the chip row. */
const STATUS_FILTERS: { value: SkillStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...SKILL_STATUSES.map((status) => ({
    value: status,
    label:
      status === "not_started"
        ? "Not started"
        : status === "learning"
          ? "Learning"
          : status === "practiced"
            ? "Practiced"
            : "Mastered",
  })),
];

/** Chip centre as a percentage of the galaxy field's width/height. */
type Pos = { left: number; top: number };

/** Per-gesture bookkeeping, held in a ref so it survives re-renders. */
type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  /** Layout position (in %) at the moment the pointer went down. */
  origin: Pos;
  /** Field rectangle, captured once — a mid-drag resize must not jump the chip. */
  rect: DOMRect;
  moved: boolean;
};

/** Above this count the floating field gets crowded, so list view is default. */
const GALAXY_LIMIT = 24;

/** Pointer travel (px) that separates a click from a drag. */
const DRAG_THRESHOLD = 4;

/**
 * Chip is 56px across, plus headroom for the drift at its widest. `positionAt`
 * converts this pixel cushion to a percentage of the field, so a hand-placed
 * icon can never end up half outside.
 */
const EDGE_PADDING = 38;

/**
 * Deterministic layout: a golden-angle spiral. Same skill set always produces
 * the same positions (never randomize on render, per the design system), and
 * the sqrt radius keeps neighbouring chips from colliding.
 *
 * This is the default for every chip the user has not dragged somewhere.
 */
function spiralPosition(index: number, total: number): Pos {
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
 * Per-chip drift, derived from the index with the same golden angle as the
 * layout so neighbours fall out of step instead of bobbing in lockstep.
 *
 * Two decorrelated clocks drive it: a bold vertical swing (`--float-amp`) and
 * a shallower sideways shimmer on a deliberately different duration
 * (`--float-amp-x`), so the motion never settles into an obvious loop.
 * Deterministic — the same skill set always drifts the same way.
 */
function floatStyle(index: number): React.CSSProperties {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const phase = index * goldenAngle;
  const a = (Math.sin(phase) + 1) / 2; // 0..1
  const b = (Math.cos(phase * 1.618) + 1) / 2; // 0..1, decorrelated from a
  const c = (Math.sin(phase * 2) + 1) / 2; // 0..1, decorrelated from both

  const amplitudeY = 10 + a * 14; // 10px..24px
  const durationY = 3 + b * 3; // 3s..6s
  const amplitudeX = 3 + c * 5; // 3px..8px
  const durationX = 4 + b * 4; // 4s..8s, off the vertical beat

  return {
    // One delay per animation: each clock gets its own phase.
    animationDelay: `${-(a * durationY).toFixed(2)}s, ${-(c * durationX).toFixed(2)}s`,
    "--float-amp": `${amplitudeY.toFixed(1)}px`,
    "--float-amp-x": `${amplitudeX.toFixed(1)}px`,
    "--float-dur": `${durationY.toFixed(2)}s`,
    "--float-dur-x": `${durationX.toFixed(2)}s`,
  } as React.CSSProperties;
}

export function GalaxyField({
  skills,
  onEditSkill,
}: {
  skills: Skill[];
  /** When provided, list rows get edit/delete controls (group page). */
  onEditSkill?: (skill: Skill) => void;
}) {
  const initial: ViewMode = skills.length > GALAXY_LIMIT ? "list" : "galaxy";
  const [view, setView] = useState<ViewMode>(initial);
  const [statusFilter, setStatusFilter] = useState<SkillStatus | "all">(
    "all",
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtering is client-side: the skill set is small enough
  // that a refetch would cost more than it saves.
  const visibleSkills = useMemo(
    () =>
      statusFilter === "all"
        ? skills
        : skills.filter((skill) => skill.status === statusFilter),
    [skills, statusFilter],
  );

  // Hand-placed positions are display-only: they live in this component's
  // state, so a chip stays where you dropped it for as long as the page is
  // open. Nothing is written — not to MongoDB, not to localStorage — and a
  // reload puts every chip back on the spiral.
  const [overrides, setOverrides] = useState<Record<string, Pos>>({});

  const handleMove = (id: string, pos: Pos) => {
    setOverrides((previous) => ({ ...previous, [id]: pos }));
  };

  const handleDrop = (id: string, pos: Pos) => {
    // Same as a move: there is nothing to persist, so the final pointer
    // position simply becomes the chip's committed position.
    setOverrides((previous) => ({ ...previous, [id]: pos }));
  };

  const handleReset = () => setOverrides({});

  const hasOverrides = Object.keys(overrides).length > 0;

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
          Add the first resource above — it will float here as a clickable icon.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {visibleSkills.length === skills.length
              ? `${skills.length} ${skills.length === 1 ? "skill" : "skills"}`
              : `${visibleSkills.length} of ${skills.length} skills`}
            {" · "}drag an icon to rearrange, click to open
            {onEditSkill && view === "galaxy"
              ? " · switch to List to edit or delete"
              : ""}
          </p>

          <div className="flex items-center gap-2.5">
            {view === "galaxy" && hasOverrides ? (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-purple/50 hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset layout
              </button>
            ) : null}

            {toggle}
          </div>
        </div>

        <div
          role="group"
          aria-label="Filter skills by status"
          className="flex flex-wrap items-center gap-1.5"
        >
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              aria-pressed={statusFilter === filter.value}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === filter.value
                  ? "border-purple/60 bg-purple-strong/15 text-purple"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {view === "galaxy" ? (
        <div
          ref={containerRef}
          className="surface relative h-[440px] w-full overflow-hidden rounded-2xl sm:h-[520px]"
          aria-label="Skill galaxy"
        >
          {visibleSkills.map((skill, index) => {
            const position =
              overrides[skill.id] ??
              spiralPosition(index, visibleSkills.length);
            return (
              <SkillChip
                key={skill.id}
                skill={skill}
                position={position}
                floatStyle={floatStyle(index)}
                containerRef={containerRef}
                onMove={handleMove}
                onDrop={handleDrop}
              />
            );
          })}
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visibleSkills.map((skill) => (
            <SkillRow
              key={skill.id}
              skill={skill}
              onEditSkill={onEditSkill}
            />
          ))}
        </ul>
      )}

      {visibleSkills.length === 0 && skills.length > 0 ? (
        <p className="surface rounded-xl px-4 py-6 text-center text-sm text-muted">
          No skills with this status yet.
        </p>
      ) : null}
    </div>
  );
}

function SkillChip({
  skill,
  position,
  floatStyle,
  containerRef,
  onMove,
  onDrop,
}: {
  skill: Skill;
  position: Pos;
  floatStyle: React.CSSProperties;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onMove: (id: string, pos: Pos) => void;
  onDrop: (id: string, pos: Pos) => void;
}) {
  const gesture = useRef<Gesture | null>(null);
  // Set after a real drag so the trailing `click` can't open the link.
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);

  /**
   * Field position for a pointer, in the same percentage units the chip's
   * `left`/`top` styles use: the origin (already %) plus the pointer delta
   * expressed as a fraction of the field. Mixed units here are exactly what
   * used to fling icons off-screen.
   */
  const positionAt = (g: Gesture, clientX: number, clientY: number): Pos => {
    const padX = (EDGE_PADDING / g.rect.width) * 100;
    const padY = (EDGE_PADDING / g.rect.height) * 100;
    const clamp = (value: number, pad: number) =>
      Math.min(Math.max(value, pad), Math.max(pad, 100 - pad));
    return {
      left: clamp(
        g.origin.left + ((clientX - g.startX) / g.rect.width) * 100,
        padX,
      ),
      top: clamp(
        g.origin.top + ((clientY - g.startY) / g.rect.height) * 100,
        padY,
      ),
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLAnchorElement>) => {
    if (event.button !== 0) return; // primary button only
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    suppressClick.current = false;
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: position,
      rect,
      moved: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLAnchorElement>) => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;

    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;

    if (!active.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      active.moved = true;
      setDragging(true);
      // Claim the pointer so drifting off the chip can't drop the drag, and
      // block the browser's own default (text selection, native link drag).
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    }

    onMove(skill.id, positionAt(active, event.clientX, event.clientY));
  };

  const endGesture = (event: React.PointerEvent<HTMLAnchorElement>) => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    gesture.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);

    if (!active.moved) return;
    suppressClick.current = true;
    // Commit the final coordinates rather than the last `pointermove`, so the
    // saved value always matches what the pointer actually landed on.
    onDrop(skill.id, positionAt(active, event.clientX, event.clientY));
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
  };

  return (
    <a
      href={skill.url}
      target="_blank"
      rel="noopener noreferrer"
      draggable={false}
      // Positions are percentages, so a dragged layout survives any screen size.
      style={{
        left: `${position.left}%`,
        top: `${position.top}%`,
        // Without this the browser hijacks touch gestures and cancels the drag.
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onClick={handleClick}
      onDragStart={(event) => event.preventDefault()}
      className={`group absolute -translate-x-1/2 -translate-y-1/2 select-none ${
        dragging ? "chip-dragging z-20 cursor-grabbing" : "z-10 cursor-grab"
      }`}
      aria-label={`${skill.name} — ${skill.status} — drag to move, opens in a new tab`}
    >
      {/* `floatStyle` gives this chip its own amplitude/phase — see globals.css.
          No background: the starfield shows straight through the ring. */}
      <span
        style={floatStyle}
        className="animate-float flex h-14 w-14 items-center justify-center rounded-full border border-border bg-transparent transition-all duration-200 group-hover:border-cyan/70 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(103,232,249,0.22)] group-focus-visible:scale-110"
      >
        <Icon icon={skill.icon} className="h-6 w-6 text-cyan" />
      </span>

      {/* Label appears on hover/focus; suppressed mid-drag so it doesn't trail
          the chip. Essential info stays available in list view. */}
      <span
        className={`surface-raised pointer-events-none absolute top-[calc(100%+8px)] left-1/2 w-max max-w-44 -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-center ${
          dragging
            ? "hidden"
            : "hidden group-hover:block group-focus-visible:block"
        }`}
      >
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

function SkillRow({
  skill,
  onEditSkill,
}: {
  skill: Skill;
  onEditSkill?: (skill: Skill) => void;
}) {
  return (
    <li className="surface flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:border-purple/50">
      <a
        href={skill.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-center gap-4"
      >
        <span className="surface-raised flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          <Icon icon={skill.icon} className="h-5 w-5 text-cyan" />
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
      </a>

      {onEditSkill ? (
        <span className="flex shrink-0 items-center gap-2">
          <SkillStatusBadge status={skill.status} />
          <button
            type="button"
            onClick={() => onEditSkill(skill)}
            aria-label={`Edit "${skill.name}"`}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-purple/50 hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
          <DeleteButton
            action={deleteSkillAction}
            id={skill.id}
            label="Delete"
            confirmMessage={`Delete "${skill.name}"? This cannot be undone.`}
          />
        </span>
      ) : (
        <span className="flex shrink-0 flex-col items-end gap-2">
          <SkillStatusBadge status={skill.status} />
          <span className="text-xs font-medium text-muted tabular-nums">
            {skill.progress}%
          </span>
        </span>
      )}
    </li>
  );
}