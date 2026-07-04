## Context

launchr's frontend (Vite + React + Tailwind v4) was built component-by-component with colors and sizes as raw Tailwind utilities in ~8 files. There is no token layer, so consistency is unenforced: a blue accent that clashes with the grayscale brand, misaligned button/input heights, and two tab idioms. This is a visual refactor only — no backend or behavior changes.

## Goals / Non-Goals

**Goals:**
- One source of truth for color (semantic tokens, light + dark).
- Monochrome/ink accent; hue reserved for status.
- Buttons and inputs that align; one button variant set; one tab style.

**Non-Goals:**
- New features, components, or animations.
- Changing any behavior or status *meaning*.
- Adopting the deferred Vengeance UI library.

## Decisions

### Ink accent, defined as a token that flips with theme
`--color-accent` = `neutral-900` (light) / `neutral-100` (dark); `--color-accent-fg` is its contrast (white / near-black). Primary buttons use accent bg + accent-fg text; selection uses `accent / 10%` tint. Blue is removed from all chrome. *Why:* the brand mark is grayscale; an ink accent reads intentional and lets status hues stand out. *Alternative:* a single restrained hue — rejected as still competing with the mark.

### Semantic tokens via Tailwind v4 `@theme`, dark via variable override
Define tokens in `index.css`: `bg`, `surface`, `border`, `fg`, `muted`, `accent`, `accent-fg`, `selection`, and status `run`/`ok`/`warn`/`fail` (+ `code-surface` for log/raw panes). Provide dark values under `@media (prefers-color-scheme: dark)` on the same variables. Components use the generated semantic utilities. *Why:* one place to change the palette, and it removes the scattered `dark:*` pairs (a drift source). *Trade-off:* a one-time sweep of all components.

### Status colors kept, unconflated, calmed
`run` stays blue (now unambiguous since accent is ink), `ok`=emerald, `warn`=amber, `fail`=red — as tokens, tuned to sit calmly against neutral chrome. Status *meaning* is unchanged, so the `agent-*` specs are untouched.

### Shared control height fixes the `+ New` bug
Root cause: inputs have a 1px border, buttons don't → ~2px height gap. Fix: both use `h-8 px-3 text-sm` (border included in the box), so they align regardless of border. Button variants: `primary` (ink), `secondary` (neutral surface + border), `ghost`, `danger`, and a square `icon` size for toolbar/✕ actions.

### One tab component, underline style
Extract a single `Tabs` component using the underline style already in `DetailPane`; convert `JobEditor`'s segmented Form/Raw pills to it. *Why:* underline is lighter for a utility app and removes the two-idiom inconsistency.

## Risks / Trade-offs

- **Sweep misses a hard-coded color** → grep for `-(blue|emerald|amber|red|neutral|white|black)` after the refactor to catch stragglers; the goal is zero raw color utilities outside the token definitions.
- **Contrast regressions in one theme** → verify both light and dark explicitly; check muted text and disabled states in each.
- **Token naming churn later** → keep the set small and semantic (role-based, not value-based) so names survive palette tweaks.
