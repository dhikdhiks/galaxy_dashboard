"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  deleteTaskAction,
  deleteTodoAction,
  reorderTodosAction,
  saveTaskAction,
  saveTodoAction,
  setTodoArchivedAction,
  toggleTaskAction,
} from "@/app/todos/actions";
import type { ActionState } from "@/app/admin/actions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Field, FormStatus, inputClass } from "@/components/admin/fields";
import { ProgressBar } from "@/components/ProgressBar";
import { SortableList } from "@/components/SortableList";
import type {
  Group,
  Skill,
  TaskWithLinks,
  TodoWithTasks,
} from "@/lib/types";

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatTime(date: Date): string {
  return timeFormatter.format(date);
}

/** Date → "YYYY-MM-DDTHH:mm" for datetime-local inputs. */
function toDateTimeLocal(date: Date | null): string {
  if (!date) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** Persists a manual reorder; failures surface in the console. */
async function saveOrder(orderedIds: string[]) {
  const state = await reorderTodosAction(orderedIds);
  if (state.status === "error") console.error(state.message);
}

export function TodoApp({
  todos,
  groups,
  skills,
}: {
  todos: TodoWithTasks[];
  groups: Group[];
  skills: Skill[];
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<TodoWithTasks | null>(null);
  const [sortByTime, setSortByTime] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const active = todos.filter((todo) => !todo.archived);
  const archived = todos.filter((todo) => todo.archived);

  // Time order: earliest first, todos without a time last.
  const ordered = sortByTime
    ? [...active].sort(
        (a, b) =>
          (a.time?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (b.time?.getTime() ?? Number.MAX_SAFE_INTEGER),
      )
    : active;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSortByTime((value) => !value)}
            aria-pressed={sortByTime}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-purple/50 hover:text-foreground"
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {sortByTime ? "Sorted by time" : "Sort by time"}
          </button>
          <button
            type="button"
            onClick={() => setShowArchived((value) => !value)}
            aria-expanded={showArchived}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-purple/50 hover:text-foreground"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                showArchived ? "" : "-rotate-90"
              }`}
              aria-hidden="true"
            />
            Archived ({archived.length})
          </button>
        </div>

        {!adding && !editing ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-purple-strong px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-purple"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New todo
          </button>
        ) : null}
      </div>

      {adding ? (
        <TodoForm onCancel={() => setAdding(false)} onSaved={() => setAdding(false)} />
      ) : null}
      {editing ? (
        <TodoForm
          todo={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      ) : null}

      {ordered.length === 0 ? (
        <p className="surface rounded-xl px-4 py-6 text-center text-sm text-muted">
          No todos yet. Create the first one above.
        </p>
      ) : sortByTime ? (
        <ul className="flex flex-col gap-2.5" aria-label="Todos, sorted by time">
          {ordered.map((todo) => (
            <li
              key={todo.id}
              className="surface flex items-center gap-3 rounded-xl px-4 py-3"
            >
              <TodoCard
                todo={todo}
                groups={groups}
                skills={skills}
                onEdit={setEditing}
              />
            </li>
          ))}
        </ul>
      ) : (
        <SortableList
          items={ordered}
          label="Todos"
          describe={(todo) => todo.title}
          onReorder={(orderedIds) => void saveOrder(orderedIds)}
        >
          {(todo) => (
            <TodoCard
              todo={todo}
              groups={groups}
              skills={skills}
              onEdit={setEditing}
            />
          )}
        </SortableList>
      )}

      {showArchived && archived.length > 0 ? (
        <ul
          className="flex flex-col gap-2.5"
          aria-label="Archived todos"
        >
          {archived.map((todo) => (
            <li
              key={todo.id}
              className="surface flex items-center gap-3 rounded-xl px-4 py-3 opacity-75"
            >
              <TodoCard
                todo={todo}
                groups={groups}
                skills={skills}
                onEdit={setEditing}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* --------------------------------- Todo form -------------------------------- */

function TodoForm({
  todo,
  onCancel,
  onSaved,
}: {
  todo?: TodoWithTasks;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    ActionState,
    FormData
  >(saveTodoAction, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  const isEdit = Boolean(todo);

  useEffect(() => {
    if (state.status === "success") onSaved?.();
  }, [state, onSaved]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="surface flex flex-col gap-4 rounded-2xl p-5"
    >
      {todo ? <input type="hidden" name="id" value={todo.id} /> : null}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          {isEdit ? `Edit "${todo?.title}"` : "New todo"}
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
        <Field
          label="Title"
          htmlFor="todo-title"
          error={state.fieldErrors?.form}
        >
          <input
            id="todo-title"
            name="title"
            required
            defaultValue={todo?.title ?? ""}
            placeholder="Ship the dashboard"
            className={inputClass}
          />
        </Field>

        <Field label="Time" htmlFor="todo-time" hint="Optional">
          <input
            id="todo-time"
            name="time"
            type="datetime-local"
            defaultValue={toDateTimeLocal(todo?.time ?? null)}
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
          {isEdit ? "Save changes" : "Create todo"}
        </button>
      </div>
    </form>
  );
}

/* --------------------------------- Todo card -------------------------------- */

function TodoCard({
  todo,
  groups,
  skills,
  onEdit,
}: {
  todo: TodoWithTasks;
  groups: Group[];
  skills: Skill[];
  onEdit: (todo: TodoWithTasks) => void;
}) {
  const progress =
    todo.tasks.length === 0
      ? 0
      : Math.round((todo.doneCount / todo.tasks.length) * 100);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground">
            {todo.title}
          </h3>
          {todo.time ? (
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatTime(todo.time)}
            </p>
          ) : null}
        </div>

        <span className="flex shrink-0 flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(todo)}
            aria-label={`Edit "${todo.title}"`}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-purple/50 hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
          <form action={setTodoArchivedAction}>
            <input type="hidden" name="id" value={todo.id} />
            <input
              type="hidden"
              name="archived"
              value={todo.archived ? "false" : "true"}
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-purple/50 hover:text-foreground"
            >
              {todo.archived ? (
                <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Archive className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {todo.archived ? "Restore" : "Archive"}
            </button>
          </form>
          <DeleteButton
            action={deleteTodoAction}
            id={todo.id}
            label="Delete"
            confirmMessage={`Delete "${todo.title}"? Every task in it will be deleted too. This cannot be undone.`}
          />
        </span>
      </div>

      {todo.tasks.length > 0 ? (
        <div className="flex flex-col gap-2">
          <ProgressBar value={progress} />
          <ul className="flex flex-col gap-1">
            {todo.tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted">No tasks yet — add one below.</p>
      )}

      <TaskForm todoId={todo.id} groups={groups} skills={skills} />
    </div>
  );
}

/* --------------------------------- Task row --------------------------------- */

function TaskRow({ task }: { task: TaskWithLinks }) {
  return (
    <li className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-raised">
      <form action={toggleTaskAction}>
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          aria-pressed={task.done}
          aria-label={
            task.done
              ? `Mark "${task.label}" as not done`
              : `Mark "${task.label}" as done`
          }
          className="rounded-md p-0.5 text-muted transition-colors hover:text-purple"
        >
          {task.done ? (
            <CheckCircle2
              className="h-5 w-5 text-success"
              aria-hidden="true"
            />
          ) : (
            <Circle className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </form>

      <span
        className={`min-w-0 flex-1 text-sm ${
          task.done ? "text-muted line-through" : "text-foreground"
        }`}
      >
        {task.label}
      </span>

      {task.skillName ? (
        <span className="shrink-0 rounded-full bg-cyan/10 px-2.5 py-0.5 text-xs text-cyan">
          {task.skillName}
        </span>
      ) : null}
      {task.groupSlug ? (
        <Link
          href={`/groups/${task.groupSlug}`}
          className="shrink-0 rounded-full bg-purple-strong/15 px-2.5 py-0.5 text-xs text-purple transition-colors hover:bg-purple-strong/25"
        >
          {task.groupName}
        </Link>
      ) : null}

      <form action={deleteTaskAction}>
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          aria-label={`Delete task "${task.label}"`}
          className="rounded-md p-1 text-muted transition-colors hover:text-danger"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </form>
    </li>
  );
}

/* --------------------------------- Task form -------------------------------- */

function TaskForm({
  todoId,
  groups,
  skills,
}: {
  todoId: string;
  groups: Group[];
  skills: Skill[];
}) {
  const [state, formAction, pending] = useActionState<
    ActionState,
    FormData
  >(saveTaskAction, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  // Keep the form open after a success — adding several
  // tasks in a row is the common case.
  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 border-t border-border pt-3"
    >
      <input type="hidden" name="todoId" value={todoId} />
      <input
        name="label"
        required
        placeholder="Add a task…"
        aria-label={`New task for this todo`}
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          name="skillId"
          defaultValue=""
          aria-label="Link a skill (optional)"
          className={inputClass}
        >
          <option value="">Skill: none</option>
          {skills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.name}
            </option>
          ))}
        </select>
        <select
          name="groupId"
          defaultValue=""
          aria-label="Link a group (optional)"
          className={inputClass}
        >
          <option value="">Group: none</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {state.status === "error" ? (
        <p className="text-xs text-danger" role="alert">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:border-purple/50 hover:text-foreground disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        Add task
      </button>
    </form>
  );
}
