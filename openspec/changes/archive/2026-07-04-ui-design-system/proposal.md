## Why

The UI grew component-by-component with colors and sizes hard-coded as Tailwind utilities scattered across ~8 files, so there is no single source of truth. The result reads as inconsistent: a generic blue accent that fights the grayscale brand, buttons and inputs that don't align (the `+ New` button), and two different tab styles in the same app. This change introduces a small design system so the app looks intentional and future consistency is free.

## What Changes

- **Monochrome / ink accent.** Replace the blue accent with ink: accent = `neutral-900` in light mode, `neutral-100` in dark (it flips with the theme). Primary buttons are ink; selection is a subtle accent tint. This also **untangles blue** — blue was doing double duty as both the UI accent and the "running" status color; after this, blue means *only* running.
- **Tokenized theme.** Define semantic color tokens via Tailwind v4 `@theme` (CSS variables) with light/dark values, and have components use semantic classes (`bg-surface`, `border-border`, `text-muted`, `bg-accent`, `text-run`/`ok`/`warn`/`fail`) instead of raw utilities. Light/dark become token overrides, letting us **remove the scattered `dark:*` pairs**.
- **Shared control sizing.** Buttons and inputs share one height (`h-8`, `px-3`, `text-sm`) so they always align. Root cause of the `+ New` misalignment: inputs carry a 1px border and buttons don't, so heights differed ~2px.
- **One button variant set:** `primary` (ink), `secondary` (neutral), `ghost`, `danger`, plus a square `icon` size.
- **One tab style app-wide:** underline. Convert `JobEditor`'s segmented Form/Raw pills to the underline tab used by `DetailPane`.
- **Status colors kept but calmed** and unconflated from the accent.

## Capabilities

### New Capabilities
- `ui-design-system`: The app's visual system — a monochrome/ink accent, token-based theming (light/dark), one shared control height, a fixed button variant set, and a single tab style.

### Modified Capabilities
<!-- None. This is a visual refactor; the behavior described by agent-* specs is unchanged (status color *meanings* are preserved). -->

## Impact

- **Files:** `src/index.css` (add `@theme` tokens), `src/components/ui.tsx` (Button/Input/tokens + new `Tabs`), and a sweep of the components off raw color utilities onto semantic tokens: `Sidebar`, `DetailPane`, `JobEditor`, `LogsView`, `StatusBadges`, `App`.
- **No new dependencies**, no backend changes, no behavior changes.
- **Verification:** visual check in both light and dark appearance.
- **Out of scope:** new components, animations, and the deferred Vengeance UI library.
