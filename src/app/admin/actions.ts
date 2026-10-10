"use server";

import { revalidatePath } from "next/cache";

import {
  createGroup,
  createSkill,
  deleteGroup,
  deleteSkill,
  resetGroupPositions,
  updateGroup,
  updateSkill,
} from "@/lib/db";
import { ValidationError, type SkillStatus } from "@/lib/types";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};
// NB: nothing but async functions may be exported from a "use server" file —
// a plain object export makes Next reject the whole module at import time,
// which silently took down every action in here. The `type` export above is
// fine because types are erased before runtime.

function revalidateAll(): void {
  // Revalidate the root layout: refreshes overview, admin and all group routes.
  revalidatePath("/", "layout");
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
      icon: text(formData, "icon"),
      sortOrder: Number(text(formData, "sortOrder") ?? 0),
    };

    if (id) {
      await updateGroup(id, input);
    } else {
      await createGroup(input);
    }

    revalidateAll();
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
    revalidateAll();
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
      icon: text(formData, "icon"),
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

    revalidateAll();
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
    revalidateAll();
    return { status: "success", message: "Skill deleted" };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

/* --------------------------- Galaxy placement ----------------------------- */
// These two are called as plain functions (not through `useActionState`): the
// chip already shows its own position optimistically during the drag and only
// needs confirmation that the move stuck.

export async function saveSkillPositionAction(
  id: string,
  x: number,
  y: number,
): Promise<{ status: "success" | "error"; message?: string }> {
  try {
    await updateSkill(id, { position: { x, y } });
    revalidateAll();
    return { status: "success" };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

export async function resetGroupPositionsAction(
  groupId: string,
): Promise<{ status: "success" | "error"; message?: string }> {
  try {
    await resetGroupPositions(groupId);
    revalidateAll();
    return { status: "success" };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}
