"use server";

import { updateTag } from "next/cache";

import {
  createTask,
  createTodo,
  deleteTask,
  deleteTodo,
  toggleTask,
  reorderTodos,
  updateTodo,
} from "@/lib/db";
import type { ActionState } from "@/app/admin/actions";
import { ValidationError } from "@/lib/types";

function text(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function errorMessage(error: unknown): string {
  if (error instanceof ValidationError) return error.message;
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

/** datetime-local input ("2026-10-11T14:30") → Date, null when empty. */
function parseTime(value: string | undefined): Date | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError("Time is not valid");
  }
  return parsed;
}

/* --------------------------------- Todos ---------------------------------- */

export async function saveTodoAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData, "id");
  try {
    const input = {
      title: text(formData, "title") ?? "",
      time: parseTime(text(formData, "time")),
    };

    if (id) {
      await updateTodo(id, input);
    } else {
      await createTodo(input);
    }

    updateTag("todos");
    return { status: "success", message: id ? "Todo updated" : "Todo created" };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

/**
 * Plain form action (no `useActionState`): archive/restore flips
 * a flag, so there is no state to render — failures just throw.
 */
export async function setTodoArchivedAction(formData: FormData): Promise<void> {
  const id = text(formData, "id");
  if (!id) return;

  const archived = text(formData, "archived") === "true";
  await updateTodo(id, { archived });
  updateTag("todos");
}

export async function deleteTodoAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData, "id");
  if (!id) return { status: "error", message: "Missing todo id" };

  try {
    await deleteTodo(id);
    updateTag("todos");
    return { status: "success", message: "Todo and its tasks deleted" };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

export async function reorderTodosAction(
  orderedIds: string[],
): Promise<ActionState> {
  try {
    await reorderTodos(orderedIds);
    updateTag("todos");
    return { status: "success", message: "Todo order saved" };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

/* --------------------------------- Tasks ---------------------------------- */

export async function saveTaskAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await createTask({
      todoId: text(formData, "todoId") ?? "",
      label: text(formData, "label") ?? "",
      skillId: text(formData, "skillId") || null,
      groupId: text(formData, "groupId") || null,
    });

    updateTag("todos");
    return { status: "success", message: "Task added" };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

export async function toggleTaskAction(formData: FormData): Promise<void> {
  const id = text(formData, "id");
  if (!id) return;

  await toggleTask(id);
  updateTag("todos");
}

export async function deleteTaskAction(formData: FormData): Promise<void> {
  const id = text(formData, "id");
  if (!id) return;

  await deleteTask(id);
  updateTag("todos");
}
