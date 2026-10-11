"use client";

import { useState } from "react";
import { Pencil, Plus, Settings } from "lucide-react";

import {
  DeleteButton,
} from "./DeleteButton";
import { GroupForm } from "./GroupForm";
import { SkillForm } from "./SkillForm";
import { SortableList } from "@/components/SortableList";
import {
  deleteGroupAction,
  deleteSkillAction,
  reorderGroupsAction,
  reorderSkillsAction,
  type ActionState,
} from "@/app/admin/actions";
import { SkillStatusBadge } from "@/components/SkillStatusBadge";
import { Icon } from "@/components/icons";
import type { Group, Skill } from "@/lib/types";

type Tab = "groups" | "skills";

/** Persists a manual reorder; failures surface in the console. */
async function saveOrder(
  action: (orderedIds: string[]) => Promise<ActionState>,
  orderedIds: string[],
) {
  const state = await action(orderedIds);
  if (state.status === "error") console.error(state.message);
}

export function AdminPanel({
  groups,
  skills,
}: {
  groups: Group[];
  skills: Skill[];
}) {
  const [tab, setTab] = useState<Tab>("groups");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [creatingSkill, setCreatingSkill] = useState(false);

  const groupName = (id: string) =>
    groups.find((group) => group.id === id)?.name ?? "(deleted)";

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-purple-strong text-background"
        : "text-muted hover:bg-surface-raised hover:text-foreground"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Admin sections"
        className="surface inline-flex w-fit rounded-full p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "groups"}
          onClick={() => setTab("groups")}
          className={tabClass(tab === "groups")}
        >
          Groups
          <span className="tabular-nums opacity-70">({groups.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "skills"}
          onClick={() => setTab("skills")}
          className={tabClass(tab === "skills")}
        >
          Skills
          <span className="tabular-nums opacity-70">({skills.length})</span>
        </button>
      </div>

      {tab === "groups" ? (
        <section aria-label="Manage groups" className="flex flex-col gap-5">
          {creatingGroup ? (
            <GroupForm
              onCancel={() => setCreatingGroup(false)}
              onSaved={() => setCreatingGroup(false)}
            />
          ) : editingGroupId ? (
            <GroupForm
              group={groups.find((group) => group.id === editingGroupId)}
              onCancel={() => setEditingGroupId(null)}
              onSaved={() => setEditingGroupId(null)}
            />
          ) : (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCreatingGroup(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-purple-strong px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-purple"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New group
              </button>
            </div>
          )}

          {groups.length === 0 && !creatingGroup ? (
            <p className="surface rounded-xl px-4 py-6 text-center text-sm text-muted">
              No groups yet. Create the first one above.
            </p>
          ) : (
            <SortableList
              items={groups}
              label="Groups"
              describe={(group) => group.name}
              onReorder={(orderedIds) =>
                void saveOrder(reorderGroupsAction, orderedIds)
              }
            >
              {(group) => (
                <>
                  <span className="surface-raised flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                    <Icon icon={group.icon} className="h-4 w-4 text-cyan" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {group.name}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      /{group.slug}
                      {group.description ? ` · ${group.description}` : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreatingGroup(false);
                        setEditingGroupId(group.id);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-purple/50 hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Edit
                    </button>
                    <DeleteButton
                      action={deleteGroupAction}
                      id={group.id}
                      label="Delete"
                      confirmMessage={`Delete "${group.name}"? Every skill in this group will be deleted too. This cannot be undone.`}
                    />
                  </span>
                </>
              )}
            </SortableList>
          )}
        </section>
      ) : (
        <section aria-label="Manage skills" className="flex flex-col gap-5">
          {groups.length === 0 ? (
            <p className="surface rounded-xl px-4 py-6 text-center text-sm text-muted">
              Create a group before adding skills.
            </p>
          ) : (
            <>
              {creatingSkill ? (
                <SkillForm
                  groups={groups}
                  onCancel={() => setCreatingSkill(false)}
                />
              ) : editingSkillId ? (
                <SkillForm
                  skill={skills.find((skill) => skill.id === editingSkillId)}
                  groups={groups}
                  onCancel={() => setEditingSkillId(null)}
                />
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCreatingSkill(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-purple-strong px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-purple"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    New skill
                  </button>
                </div>
              )}

              {skills.length === 0 && !creatingSkill ? (
                <p className="surface rounded-xl px-4 py-6 text-center text-sm text-muted">
                  No skills yet. Create the first one above.
                </p>
              ) : (
                <SortableList
                  items={skills}
                  label="Skills"
                  describe={(skill) => skill.name}
                  onReorder={(orderedIds) =>
                    void saveOrder(reorderSkillsAction, orderedIds)
                  }
                >
                  {(skill) => (
                    <>
                      <span className="surface-raised flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                        <Icon icon={skill.icon} className="h-4 w-4 text-cyan" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {skill.name}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {groupName(skill.groupId)} · {skill.progress}%
                        </span>
                      </span>
                      <span className="hidden shrink-0 sm:block">
                        <SkillStatusBadge status={skill.status} />
                      </span>
                      <span className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCreatingSkill(false);
                            setEditingSkillId(skill.id);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-purple/50 hover:text-foreground"
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
                    </>
                  )}
                </SortableList>
              )}
            </>
          )}
        </section>
      )}

      <p className="inline-flex items-center gap-2 text-xs text-muted">
        <Settings className="h-3.5 w-3.5" aria-hidden="true" />
        Changes are saved immediately to MongoDB.
      </p>
    </div>
  );
}
