export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium tracking-wide text-muted uppercase"
      >
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "surface w-full rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-purple/60";

export const textareaClass = `${inputClass} min-h-20 resize-y`;

export function FormStatus({
  state,
}: {
  state: { status: string; message?: string };
}) {
  if (state.status === "idle" || !state.message) return null;
  const tone =
    state.status === "success"
      ? "border-success/40 bg-success/10 text-success"
      : "border-danger/40 bg-danger/10 text-danger";
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={`rounded-lg border px-3 py-2 text-sm ${tone}`}
    >
      {state.message}
    </p>
  );
}
