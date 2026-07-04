## 1. Tokens

- [x] 1.1 Add semantic color tokens to `src/index.css` via `@theme` — `bg`, `surface`, `border`, `fg`, `muted`, `accent`, `accent-fg`, `selection`, status `run`/`ok`/`warn`/`fail`, and `code-surface`
- [x] 1.2 Provide dark values for every token under `@media (prefers-color-scheme: dark)` so theming is token-driven (no per-element `dark:`)

## 2. Primitives

- [x] 2.1 Refactor `Button` (`ui.tsx`): shared `h-8 px-3 text-sm`; variants `primary` (ink accent), `secondary` (neutral surface+border), `ghost`, `danger`; add a square `icon` size
- [x] 2.2 Refactor `Input` (`ui.tsx`): same `h-8` box (border included), token colors, ink focus ring — verify it aligns with `+ New`
- [x] 2.3 Extract a single underline `Tabs` component into `ui.tsx`
- [x] 2.4 Update `Field`, `ConfirmDialog`, overlay/modal chrome to token colors

## 3. Sweep components onto tokens

- [x] 3.1 `Sidebar`: selection uses accent tint, group headers/rows use muted/surface tokens; `+ New` is `secondary` or `icon` sized to match search
- [x] 3.2 `DetailPane`: header, action buttons, and tabs use tokens + the new `Tabs`
- [x] 3.3 `JobEditor`: convert Form/Raw segmented pills to the underline `Tabs`; token colors for form fields, textarea, error box
- [x] 3.4 `LogsView`: log pane uses `code-surface`; follow/pause/clear controls use variants
- [x] 3.5 `StatusBadges`: availability chip + health signal + dot use status tokens (run/ok/warn/fail), no raw hues
- [x] 3.6 `App`: empty-state and container colors use tokens

## 4. Verify

- [x] 4.1 Grep for raw color utilities (`-(blue|emerald|amber|red|neutral|white|black)[-0-9/]*`) — none remain outside the token definitions in `index.css`
- [x] 4.2 `pnpm build` clean; ran the app and visually verified: ink accent, `+ New` on one line (fixed button wrap), one tab style. Light/dark confirmed by user.
