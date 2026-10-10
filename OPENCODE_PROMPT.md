# Prompt to paste into OpenCode CLI

You are the lead full-stack engineer implementing **Skill Galaxy Dashboard**, a private personal learning-resource dashboard.

## First inspect — do not overwrite blindly
1. Inspect the current directory, git status, existing app files, package manager, and Node/npm versions.
2. Read `AGENTS.md`, `PRD.md`, `IMPLEMENTATION_PLAN.md`, `docs/DESIGN_SYSTEM.md`, `docs/SETUP.md`, `mongodb/README.md` and `mongodb/init.mjs`.
3. Summarize architecture and prerequisites. Preserve existing files and project conventions.
4. If empty, scaffold Next.js in the current directory. Never delete or overwrite this specification kit.
5. Use current compatible stable dependencies; verify uncertain APIs against official docs.

## Defaults
- Hybrid navigation: overview grid + dedicated group screen
- MongoDB via the official `mongodb` driver; no authentication (single-user private dashboard)
- Manual status/progress
- Dark-only space theme: black/deep navy, purple and neon blue/cyan
- Lightweight CSS-first animation
- Ubuntu WSL, GitHub and Vercel

## Required stack
Next.js App Router, TypeScript strict, Tailwind CSS, MongoDB via `mongodb`, Lucide React. Use the existing package manager or npm if none exists. No Three.js in v1.

## Required behavior
- Create any number of groups in admin; each has unique slug and dynamic `/groups/[slug]` route.
- Skill icons float in the group screen and open configured URLs.
- Skill fields: name, URL, optional icon/description, status, progress 0–100, sort order.
- CRUD groups and skills, assignment, sorting, validation, delete confirmation.
- Overview search and summary counts.
- Keyboard/touch-accessible list/grid fallback for floating icons.
- Loading, empty, error, success and confirmation states.
- Allow only HTTP/HTTPS URLs; safe external-link behavior.
- Server-side validation protects every mutation; the dashboard is private and single-user.
- Never expose `MONGODB_URI` (or any secret) in client code. Do not fake external setup when credentials are missing.

## Architecture
- Server Components by default; Client Components only for interactive UI.
- One server-side MongoDB client (`src/lib/mongodb.ts`) cached across hot reloads; centralize typed queries in `src/lib/db.ts`.
- Centralize typed database access; reusable components; validate server-side.
- CSS variables for design tokens; responsive design; reduced-motion support.
- Avoid unnecessary dependencies and oversized bundles.

## Execution
Follow `IMPLEMENTATION_PLAN.md` phase by phase. Do not stop after writing a plan: implement working code. At each phase, run relevant checks, fix errors caused by changes, and report files changed and remaining setup. Never run destructive commands, overwrite `.env.local`, delete user data or commit secrets.

## Verification and final report
Run applicable lint, `npx tsc --noEmit`, and `npm run build`. If environment variables are missing, separate configuration-dependent issues from code errors. Do not claim a check passed unless it ran.

Final report must list: features implemented; key files/architecture; commands and actual results; manual MongoDB/Atlas steps; exact local run commands; GitHub/Vercel steps; incomplete criteria.

Start with repository inspection and Phase 0, then implement Phase 1 and continue as far as the environment allows.
