# Product Requirements Document — Skill Galaxy Dashboard

## 1. Overview and problem
Skill Galaxy is a private personal learning dashboard that centralizes documentation, tools, courses and practice links. Resources are currently scattered across bookmarks and search history; the user forgets site names and URLs. A visual group-based dashboard should make the next learning resource easy to find.

## 2. Goals
1. Open a learning resource in one or two clicks.
2. Create any number of groups without code changes or redeployment.
3. Show skills as floating icons in each group's space-themed screen.
4. Track self-reported progress without pretending site visits equal learning.
5. Stay fast, accessible, responsive and deployable on Vercel.

## 3. Non-goals for v1
- 3D/WebGL simulation or game mechanics
- Automatic tracking of external website usage
- Social/multi-user features, payments, ads or AI-generated plans
- Offline-first synchronization

## 4. Core routes
### Overview `/`
- Responsive grid of galaxy/planet group cards
- Search across groups and skills
- Summary counts for groups, skills, in-progress and mastered skills
- Each group card opens its dynamic group route
- Persistent admin/settings entry point
- Helpful empty state when no groups exist

### Group screen `/groups/[slug]`
- Dynamic route for every group from database
- Group name, description, skill count and progress summary
- Floating skill icons in a visually bounded galaxy canvas
- Click skill to open its configured URL in a safe new tab
- Reveal name, description and status on focus/hover/tap
- Back-to-overview and previous/next group navigation
- When a group is crowded, provide list/grid fallback; test at 40+ skills
- Respect reduced-motion settings

### Admin `/admin`
- Open without sign-in; the deployment is private and single-user
- CRUD groups and skills
- Assign skills to groups
- Edit name, URL, icon identifier, description, status, progress and order
- Edit group name, slug, description, icon and order
- Confirm deletion; explain that deleting a group deletes its skills
- Useful validation and error messages

### Authentication
- None in v1: this is a private personal dashboard for one user with no public sign-up
- Server-side validation still applies to every mutation (URL, slug, status, progress)
- If the app is ever exposed publicly, add authentication before exposing `/admin`

## 5. Data model
MongoDB, database `skill_galaxy` (override with `MONGODB_DB`).

Collection `groups`: `_id`, `name`, `slug` (unique), `description`, `icon`, `sortOrder`, `createdAt`, `updatedAt`.

Collection `skills`: `_id`, `groupId` (references `groups._id`), `name`, `url`, `icon`, `description`, `status`, `progress`, `sortOrder`, `createdAt`, `updatedAt`.

There is no `owner_id`: a single user owns every document.

Allowed statuses: `not_started`, `learning`, `practiced`, `mastered`. Progress is a manually maintained integer 0–100; never infer mastery from clicks or visits.

## 6. Visual direction
- Dark mode only; near-black/deep navy background
- Purple/violet and neon blue/cyan accents
- Subtle stars, nebula gradients, thin glowing borders and depth
- Avoid excessive glow and glass effects that reduce legibility
- Prefer SVG/vector icons over large raster images
- No autoplay audio

## 7. Security and reliability
- MongoDB via the official `mongodb` driver; connection lives only on the server
- `MONGODB_URI` is a secret: server-side env only, never a `NEXT_PUBLIC_*` variable and never committed
- The app is private and single-user; there are no accounts or row-level security to enforce
- Validate URLs to allow only HTTP/HTTPS before writing to the database
- Never render untrusted HTML/SVG
- Include loading, empty, error, success and confirmation states

## 8. Performance and accessibility
- Server Components by default
- CSS-first animation; no Three.js in v1
- Respect `prefers-reduced-motion`
- Keyboard operation, visible focus and semantic labels
- Tooltip cannot be the only way to discover essential information
- Desktop, tablet and mobile must work

## 9. Acceptance criteria
1. Create multiple groups through admin without code changes.
2. New group appears in overview and has a working dynamic route.
3. CRUD skills and assign them to groups.
4. Clicking a skill opens the correct URL.
5. Reject invalid URLs and malformed form values.
6. Status/progress persists after refresh and new sessions.
7. Deletion has confirmation and predictable cascade behavior.
8. `/admin` mutations validate input on the server and reject malformed values.
9. The MongoDB connection string is never exposed to client code.
10. Usable at desktop and mobile widths, including reduced-motion mode.
11. A group with 40 skills remains navigable using floating and list/grid views.
12. Lint, type-check and production build are run and results reported accurately.
13. No secrets are committed.

## 10. Success measures
- Resource opens in two clicks or fewer from overview.
- Adding a group never requires code changes or redeployment.
- Main overview remains lightweight; effects never block usability.
