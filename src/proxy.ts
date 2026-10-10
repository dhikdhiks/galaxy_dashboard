import { NextResponse, type NextRequest } from "next/server";

/**
 * Existence check for `/groups/[slug]` that must run BEFORE the page renders.
 *
 * Why this is needed: under `cacheComponents` the group route is a Partial
 * Prerender. Next serves the prebuilt static shell with a `200` and commits
 * that status *before* any page code runs — so a `notFound()` thrown later can
 * only stream the not-found UI, never change the status line. Dev does not
 * serve a prerendered shell, which is why dev returns a real 404 and a
 * production build returns a soft-404 (200 + `noindex`).
 *
 * Next's own docs for this case: "For a 404, you can check the slug in Proxy,
 * then rewrite it to a not-found route or return a 404 response."
 *
 * Proxy defaults to the Node.js runtime in Next 16, so the `mongodb` driver
 * works here. Every failure is caught and falls through to the page, so a
 * database problem degrades to today's behaviour (not-found UI with a 200)
 * instead of breaking the route.
 */

const GROUP_PATH = /^\/groups\/([^/]+)\/?$/;

export async function proxy(request: NextRequest): Promise<Response | void> {
  const match = GROUP_PATH.exec(request.nextUrl.pathname);
  if (!match) return;

  let slug: string;
  try {
    slug = decodeURIComponent(match[1]);
  } catch {
    return; // Malformed percent-encoding: let the page decide.
  }
  if (!slug) return;

  let exists: boolean;
  try {
    // Imported lazily so a module-resolution failure can never break the route.
    const { groupExists } = await import("./lib/db");
    exists = await groupExists(slug);
  } catch {
    return; // Fail open — the page performs its own check.
  }

  if (exists) return;

  // Rewrite to the not-found route: the browser keeps the requested URL while
  // the response carries a real 404 status.
  return NextResponse.rewrite(new URL("/_not-found", request.url));
}

export const config = {
  matcher: "/groups/:path*",
};
