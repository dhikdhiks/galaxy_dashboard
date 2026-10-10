import type { SkillStatus } from "@/lib/types";

const STYLES: Record<SkillStatus, { label: string; className: string }> = {
  not_started: {
    label: "Not started",
    className: "bg-border/60 text-muted border-border",
  },
  learning: {
    label: "Learning",
    className: "bg-blue/15 text-blue border-blue/40",
  },
  practiced: {
    label: "Practiced",
    className: "bg-purple/15 text-purple border-purple/40",
  },
  mastered: {
    label: "Mastered",
    className: "bg-cyan/15 text-cyan border-cyan/40",
  },
};

export function SkillStatusBadge({ status }: { status: SkillStatus }) {
  const style = STYLES[status] ?? STYLES.not_started;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${style.className}`}
    >
      {style.label}
    </span>
  );
}
