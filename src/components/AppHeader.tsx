import Link from "next/link";
import { Orbit, Settings } from "lucide-react";

export function AppHeader({
  current,
}: {
  current: "overview" | "group" | "admin";
}) {
  const linkClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "bg-purple-strong/20 text-purple border border-purple/40"
        : "text-muted border border-transparent hover:text-foreground hover:bg-surface-raised"
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-foreground"
        >
          <Orbit className="h-6 w-6 text-purple" aria-hidden="true" />
          <span>
            Skill<span className="text-cyan">Galaxy</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/" className={linkClass(current === "overview")}>
            Overview
          </Link>
          <Link href="/admin" className={linkClass(current === "admin")}>
            <Settings className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Admin</span>
            <span className="sr-only sm:hidden">Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
