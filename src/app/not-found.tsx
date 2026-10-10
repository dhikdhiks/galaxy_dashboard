import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <p className="text-sm font-medium tracking-wide text-cyan uppercase">
        404
      </p>
      <h1 className="text-2xl font-semibold text-foreground">
        Group not found
      </h1>
      <p className="max-w-md text-sm leading-6 text-muted">
        This group does not exist (or it was deleted). It may also have been
        renamed to a different slug.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-purple-strong px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-purple"
      >
        Back to overview
      </Link>
    </div>
  );
}
