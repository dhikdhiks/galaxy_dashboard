"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <p className="text-sm font-medium tracking-wide text-danger uppercase">
        Something went wrong
      </p>
      <h1 className="text-2xl font-semibold text-foreground">
        Could not load this view
      </h1>
      <p className="max-w-md text-sm leading-6 text-muted">
        {error.message ||
          "An unexpected error occurred while talking to the database."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-full bg-purple-strong px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-purple"
      >
        Try again
      </button>
    </div>
  );
}
