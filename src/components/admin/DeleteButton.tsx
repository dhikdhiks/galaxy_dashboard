"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { LoaderCircle, X } from "lucide-react";

import {
  deleteGroupAction,
  deleteSkillAction,
  type ActionState,
} from "@/app/admin/actions";

export function DeleteButton({
  action,
  id,
  label,
  confirmMessage,
}: {
  action: typeof deleteGroupAction | typeof deleteSkillAction;
  id: string;
  label: string;
  confirmMessage: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    { status: "idle" },
  );

  useEffect(() => {
    if (state.status === "success" && dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-danger/60 hover:text-danger"
      >
        {label}
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-border bg-surface-raised p-0 text-foreground backdrop:bg-black/70"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold">Delete?</h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="rounded-md p-1 text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <p className="text-sm leading-6 text-muted">{confirmMessage}</p>

          {state.status === "error" ? (
            <p className="text-sm text-danger" role="alert">
              {state.message}
            </p>
          ) : null}

          <form action={formAction} className="flex justify-end gap-2">
            <input type="hidden" name="id" value={id} />
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
            >
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              Delete
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
