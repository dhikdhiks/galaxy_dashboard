# Implementation Plan

Work in phases. Do not create one giant unverified change.

## Phase 0 — Inspect
- Inspect files, git status, package manager and Node/npm versions.
- Read all project docs.
- Preserve existing code and user data. If empty, scaffold Next.js App Router, TypeScript, Tailwind and ESLint.
- Report architecture and prerequisites before major edits.

## Phase 1 — Visual prototype
- Build app shell, overview, group cards and dynamic group screen with typed mock data.
- Add CSS galaxy background, floating icon chips, search, responsive layout and list/grid fallback.
- Add empty/loading/error states and reduced-motion support.
- Keep data access abstract enough to swap databases without rewriting UI.

## Phase 2 — MongoDB connection
- Install `mongodb` (official driver).
- Add `src/lib/mongodb.ts` with a cached server-side client; never expose `MONGODB_URI` to client code.
- Add `.env.example` with `MONGODB_URI`/`MONGODB_DB`; never overwrite `.env.local`.
- If credentials are absent, keep the build runnable and explain manual setup.
- No authentication in v1: private single-user dashboard.

## Phase 3 — Database and CRUD
- Add `mongodb/init.mjs` (`npm run db:init`) for collections and indexes; document it in `mongodb/README.md`.
- Centralize typed data access in `src/lib/db.ts`.
- Implement group/skill CRUD, validation, ordering and delete confirmation (group delete cascades to its skills).

## Phase 4 — Progress
- Implement manual status and percentage.
- Add notes/learning log only after core CRUD is stable.
- Define group progress calculation and document it.

## Phase 5 — Quality
- Run lint, type-check and production build.
- Test empty data, many groups, long names, invalid URLs, connection failures and mobile.
- Check focus, contrast, reduced motion and safe external links.
- Remove unnecessary dependencies.

## Phase 6 — Release
- Check `.gitignore`, environment variables and git diff for secrets.
- Document local run, MongoDB/Atlas setup (`mongodb/README.md`), GitHub push and Vercel deployment.
- Report incomplete acceptance criteria honestly.

## Definition of done
Each PRD acceptance criterion is met or explicitly listed as incomplete. Never claim external setup/deployment succeeded unless verified.
