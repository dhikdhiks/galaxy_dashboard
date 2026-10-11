"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";

/**
 * Vertical list whose rows reorder by dragging the handle or
 * using the arrow buttons (keyboard accessible). `onReorder`
 * receives every id in the new order so the caller persists it.
 *
 * `disabled` freezes the current order — used when the list is
 * sorted by something other than manual order (e.g. by time).
 */
export function SortableList<T extends { id: string }>({
  items,
  label,
  describe,
  onReorder,
  disabled = false,
  children,
}: {
  items: T[];
  label: string;
  /** Human-readable name of a row, for the move buttons' labels. */
  describe: (item: T) => string;
  onReorder: (orderedIds: string[]) => void;
  disabled?: boolean;
  children: (item: T, index: number) => React.ReactNode;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const reorder = (from: number, to: number) => {
    if (disabled || from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next.map((item) => item.id));
  };

  return (
    <ul className="flex flex-col gap-2.5" aria-label={label}>
      {items.map((item, index) => (
        <li
          key={item.id}
          onDragStart={(event) => {
            if (disabled) return;
            setDragIndex(index);
            event.dataTransfer.effectAllowed = "move";
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          onDragOver={(event) => {
            if (disabled) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setOverIndex(index);
          }}
          onDragLeave={(event) => {
            // Ignore dragleave from moving onto a child: we are
            // still inside this row, so the drop target stands.
            if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
              return;
            }
            setOverIndex((current) => (current === index ? null : current));
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (dragIndex !== null) reorder(dragIndex, index);
            setDragIndex(null);
            setOverIndex(null);
          }}
          className={`surface flex items-center gap-3 rounded-xl px-4 py-3 transition-opacity ${
            dragIndex === index ? "opacity-40" : ""
          } ${
            !disabled && dragIndex !== null && overIndex === index && dragIndex !== index
              ? "ring-2 ring-inset ring-purple/60"
              : ""
          }`}
        >
          <span
            // Only the handle is draggable: making the whole row
            // draggable would fight text selection in the row's
            // inputs and selects.
            draggable={!disabled}
            className={`flex shrink-0 flex-col items-center gap-1 ${
              disabled ? "text-muted/40" : "text-muted"
            }`}
          >
            <GripVertical
              className={`h-4 w-4 ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`}
              aria-hidden="true"
            />
            <span className="flex gap-0.5">
              <button
                type="button"
                aria-label={`Move "${describe(item)}" up`}
                title={`Move "${describe(item)}" up`}
                onClick={() => reorder(index, index - 1)}
                disabled={disabled || index === 0}
                className="rounded-md p-0.5 transition-colors hover:text-foreground disabled:opacity-30"
              >
                <ArrowUp className="h-3 w-3" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Move "${describe(item)}" down`}
                title={`Move "${describe(item)}" down`}
                onClick={() => reorder(index, index + 1)}
                disabled={disabled || index === items.length - 1}
                className="rounded-md p-0.5 transition-colors hover:text-foreground disabled:opacity-30"
              >
                <ArrowDown className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          </span>
          {children(item, index)}
        </li>
      ))}
    </ul>
  );
}
