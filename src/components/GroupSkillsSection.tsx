"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { SkillForm } from "@/components/admin/SkillForm";
import { GalaxyField } from "@/components/GalaxyField";
import type { Group, Skill } from "@/lib/types";

/**
 * Skills section of the group page: the galaxy/list view
 * plus inline add/edit forms bound to this group, so a
 * skill can be created without going through the admin
 * panel (where everything is mixed together).
 */
export function GroupSkillsSection({
  group,
  skills,
}: {
  group: Group;
  skills: Skill[];
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);

  const closeForms = () => {
    setAdding(false);
    setEditing(null);
  };

  return (
    <section aria-label="Skills" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Add resources directly to this group — they float in
          the galaxy below.
        </p>
        {!adding && !editing ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-purple-strong px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-purple"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add skill
          </button>
        ) : null}
      </div>

      {adding ? (
        <SkillForm
          fixedGroup={group}
          groups={[]}
          onCancel={closeForms}
          onSaved={closeForms}
        />
      ) : editing ? (
        <SkillForm
          skill={editing}
          fixedGroup={group}
          groups={[]}
          onCancel={closeForms}
          onSaved={closeForms}
        />
      ) : null}

      <GalaxyField skills={skills} onEditSkill={setEditing} />
    </section>
  );
}
