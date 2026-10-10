"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { LoaderCircle, Plus, X } from "lucide-react";

import { saveGroupAction, type ActionState } from "@/app/admin/actions";
import { FormStatus, Field, inputClass, textareaClass } from "./fields";
import { ICON_CHOICES } from "@/components/icons";
import type { Group } from "@/lib/types";

export function GroupForm({
  group,
  onCancel,
  onSaved,
}: {
  group?: Group;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveGroupAction,
    { status: "idle" },
  );
  const formRef = useRef<HTMLFormElement>(null);

  const isEdit = Boolean(group);
  const formError = state.fieldErrors?.form;

  useEffect(() => {
    if (state.status !== "success") return;
    if (!isEdit) formRef.current?.reset();
    onSaved?.();
  }, [state, isEdit, onSaved]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="surface flex flex-col gap-4 rounded-2xl p-5"
    >
      {group ? <input type="hidden" name="id" value={group.id} /> : null}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          {isEdit ? `Edit "${group?.name}"` : "New group"}
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
        <Field label="Name" htmlFor="group-name" error={formError}>
          <input
            id="group-name"
            name="name"
            required
            defaultValue={group?.name ?? ""}
            placeholder="React"
            className={inputClass}
          />
        </Field>

        <Field
          label="Slug"
          htmlFor="group-slug"
          hint="Leave empty to derive from name"
        >
          <input
            id="group-slug"
            name="slug"
            defaultValue={group?.slug ?? ""}
            placeholder="react"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="group-description">
        <textarea
          id="group-description"
          name="description"
          defaultValue={group?.description ?? ""}
          placeholder="What this group covers…"
          className={textareaClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Icon" htmlFor="group-icon" hint="Identifier, not SVG">
          <select
            id="group-icon"
            name="icon"
            defaultValue={group?.icon ?? ""}
            className={inputClass}
          >
            <option value="">Default (sparkle)</option>
            {ICON_CHOICES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Sort order" htmlFor="group-order" hint="Lower first">
          <input
            id="group-order"
            name="sortOrder"
            type="number"
            defaultValue={group?.sortOrder ?? 0}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-purple-strong px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-purple disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
          {isEdit ? "Save changes" : "Create group"}
        </button>
      </div>
    </form>
  );
}
