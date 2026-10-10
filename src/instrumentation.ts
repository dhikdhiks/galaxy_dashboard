/**
 * Runs once when a Next.js server instance starts.
 *
 * Warming the MongoDB connection here moves the cold-connect cost (SRV + TCP
 * TLS + auth) — and any network stall — to boot time instead of leaving the
 * first page request to absorb it.
 *
 * The connect is deliberately not awaited: `register()` should return quickly
 * so a slow network never delays server startup, and any failure is swallowed
 * (the request path has its own retry and friendly error state).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.MONGODB_URI) return;

  const { warmConnection } = await import("./lib/mongodb");
  warmConnection();
}
