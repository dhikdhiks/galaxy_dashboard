"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { LoaderCircle, Plus, X } from "lucide-react";

import { saveSkillAction, type ActionState } from "@/app/admin/actions";
import { FormStatus, Field, inputClass, textareaClass } from "./fields";
import { ICON_CHOICES } from "@/components/icons";
import { SKILL_STATUSES, type Group, type Skill } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  learning: "Learning",
  practiced: "Practiced",
  mastered: "Mastered",
};

export function SkillForm({
  skill,
  groups,
  defaultGroupId,
  onCancel,
}: {
  skill?: Skill;
  groups: Group[];
  defaultGroupId?: string;
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveSkillAction,
    { status: "idle" },
  );
  const formRef = useRef<HTMLFormElement>(null);

  const isEdit = Boolean(skill);
  const formError = state.fieldErrors?.form;

  useEffect(() => {
    if (state.status !== "success" || isEdit) return;
    formRef.current?.reset();
  }, [state, isEdit]);

  const selectedGroupId = skill?.groupId ?? defaultGroupId ?? groups[0]?.id ?? "";

  return (
    <form
      ref={formRef}
      action={formAction}
      className="surface flex flex-col gap-4 rounded-2xl p-5"
    >
      {skill ? <input type="hidden" name="id" value={skill.id} /> : null}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          {isEdit ? `Edit "${skill?.name}"` : "New skill"}
        </h2>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="rounded-md p-1 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <FormStatus state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="skill-name" error={formError}>
          <input
            id="skill-name"
            name="name"
            required
            defaultValue={skill?.name ?? ""}
            placeholder="React docs"
            className={inputClass}
          />
        </Field>

        <Field label="Group" htmlFor="skill-group">
          <select
            id="skill-group"
            name="groupId"
            required
            defaultValue={selectedGroupId}
            className={inputClass}
          >
            {groups.length === 0 ? (
              <option value="">Create a group first</option>
            ) : null}
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="URL"
        htmlFor="skill-url"
        hint="http or https only"
        error={state.status === "error" ? state.message : undefined}
      >
        <input
          id="skill-url"
          name="url"
          type="url"
          required
          defaultValue={skill?.url ?? ""}
          placeholder="https://react.dev"
          className={inputClass}
        />
      </Field>

      <Field label="Description" htmlFor="skill-description">
        <textarea
          id="skill-description"
          name="description"
          defaultValue={skill?.description ?? ""}
          placeholder="Optional note…"
          className={textareaClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Status" htmlFor="skill-status">
          <select
            id="skill-status"
            name="status"
            defaultValue={skill?.status ?? "not_started"}
            className={inputClass}
          >
            {SKILL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Progress" htmlFor="skill-progress" hint="0–100">
          <input
            id="skill-progress"
            name="progress"
            type="number"
            min={0}
            max={100}
            defaultValue={skill?.progress ?? 0}
            className={inputClass}
          />
        </Field>

        <Field label="Icon" htmlFor="skill-icon">
          <select
            id="skill-icon"
            name="icon"
            defaultValue={skill?.icon ?? ""}
            className={inputClass}
          >
            <option value="">Default</option>
            {ICON_CHOICES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Sort order" htmlFor="skill-order">
          <input
            id="skill-order"
            name="sortOrder"
            type="number"
            defaultValue={skill?.sortOrder ?? 0}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || groups.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full bg-purple-strong px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-purple disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
          {isEdit ? "Save changes" : "Create skill"}
        </button>
      </div>
    </form>
  );
}
