"use server";

import { updateTag } from "next/cache";

import {
  createGroup,
  createSkill,
  deleteGroup,
  deleteSkill,
  reorderGroups,
  reorderSkills,
  updateGroup,
  updateSkill,
} from "@/lib/db";
import { normalizeIconInput } from "@/lib/icon";
import { ValidationError, type SkillStatus } from "@/lib/types";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Read-your-own-writes invalidation: `updateTag` expires
 * the tagged `use cache` entries immediately, so the next
 * request (including the post-action refresh of this page)
 * blocks for fresh data instead of serving the old lists.
 *
 * Skill writes also bump "groups" because the overview
 * stats (skill count, progress) are cached under both tags.
 */
function revalidateGroups(): void {
  updateTag("groups");
}

function revalidateSkills(): void {
  updateTag("skills");
  updateTag("groups");
}

function errorMessage(error: unknown): string {
  if (error instanceof ValidationError) return error.message;
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

function fieldErrors(error: unknown): Record<string, string> | undefined {
  if (!(error instanceof ValidationError)) return undefined;
  return { form: error.message };
}

function text(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

/**
 * Reads the icon field: a picked file (`iconFile`) wins over the hidden
 * `icon` input, so an untouched picker preserves the current value.
 */
async function iconFromForm(formData: FormData): Promise<string | null> {
  const file = formData.get("iconFile");
  if (file instanceof File && file.size > 0) {
    return normalizeIconInput(file);
  }
  return normalizeIconInput(text(formData, "icon"));
}

/* ---------------------------------- Groups --------------------------------- */

export async function saveGroupAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData, "id");
  try {
    const input = {
      name: text(formData, "name") ?? "",
      slug: text(formData, "slug"),
      description: text(formData, "description"),
      icon: await iconFromForm(formData),
      sortOrder: Number(text(formData, "sortOrder") ?? 0),
    };

    if (id) {
      await updateGroup(id, input);
    } else {
      await createGroup(input);
    }

    revalidateGroups();
    return { status: "success", message: id ? "Group updated" : "Group created" };
  } catch (error) {
    return { status: "error", message: errorMessage(error), fieldErrors: fieldErrors(error) };
  }
}

export async function deleteGroupAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData, "id");
  if (!id) return { status: "error", message: "Missing group id" };

  try {
    await deleteGroup(id);
    revalidateGroups();
    revalidateSkills();
    return { status: "success", message: "Group and its skills deleted" };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

/* ---------------------------------- Skills --------------------------------- */

export async function saveSkillAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData, "id");
  try {
    const input = {
      groupId: text(formData, "groupId") ?? "",
      name: text(formData, "name") ?? "",
      url: text(formData, "url") ?? "",
      icon: await iconFromForm(formData),
      description: text(formData, "description"),
      status: text(formData, "status") as SkillStatus | undefined,
      progress: Number(text(formData, "progress") ?? 0),
      sortOrder: Number(text(formData, "sortOrder") ?? 0),
    };

    if (id) {
      await updateSkill(id, input);
    } else {
      await createSkill(input);
    }

    revalidateSkills();
    return { status: "success", message: id ? "Skill updated" : "Skill created" };
  } catch (error) {
    return { status: "error", message: errorMessage(error), fieldErrors: fieldErrors(error) };
  }
}

export async function deleteSkillAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData, "id");
  if (!id) return { status: "error", message: "Missing skill id" };

  try {
    await deleteSkill(id);
    revalidateSkills();
    return { status: "success", message: "Skill deleted" };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

/* --------------------------------- Reorder -------------------------------- */

export async function reorderGroupsAction(
  orderedIds: string[],
): Promise<ActionState> {
  try {
    await reorderGroups(orderedIds);
    revalidateGroups();
    return { status: "success", message: "Group order saved" };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

export async function reorderSkillsAction(
  orderedIds: string[],
): Promise<ActionState> {
  try {
    await reorderSkills(orderedIds);
    revalidateSkills();
    return { status: "success", message: "Skill order saved" };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

/* --------------------------- Galaxy placement ----------------------------- */
// Dragged icon positions are display-only: GalaxyField.tsx keeps them in
// component state and never persists them, so no server action is needed
// here. The db module has no `position`-related helpers.