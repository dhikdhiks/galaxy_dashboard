# Design System — Skill Galaxy

## Direction
A polished, quiet, futuristic learning universe. This is a usable product, not a game HUD. Effects support navigation and must not compete with content.

## Suggested CSS tokens
- background `#070711`
- surface `#101022`
- raised surface `#17152d`
- border `#2c2850`
- text `#f5f3ff`
- muted `#a6a2c7`
- purple `#a78bfa`
- strong purple `#8b5cf6`
- blue `#60a5fa`
- cyan `#67e8f9`

## Layout
- Overview: top bar, compact summary, search/filter, responsive group-card grid.
- Group: title/description, back navigation, floating skill field and list/grid fallback.
- Admin: clear tabs/sidebar; forms and tables prioritize legibility.
- Persistent admin entry point where appropriate; access is still enforced server-side.

## Floating field
- Use stable/deterministic positions; do not randomize on every render.
- Avoid collisions and inaccessible overlaps; switch to grid/list for many skills.
- Make every skill keyboard-focusable and tappable.
- Show names on focus/hover and keep essential info discoverable without hover.
- Use `transform`/`opacity`; avoid continuous layout-property animation.
- Respect `prefers-reduced-motion`; reduce or disable motion.

## Components to consider
`AppHeader`, `GroupCard`, `GroupGrid`, `GalaxyCanvas`, `FloatingSkill`, `SkillListFallback`, `SkillStatusBadge`, `ProgressBar`, `SearchInput`, `EmptyState`, `ErrorState`, `ConfirmDialog`, group/skill admin forms.

## Icons and motion
Lucide React for UI. Use safe icon identifiers for technology logos and a fallback icon. Never render arbitrary HTML/SVG from database. Use subtle floating motion and star twinkle; no flashing, rapid zoom or autoplay audio.
