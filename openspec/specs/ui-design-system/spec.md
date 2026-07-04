# ui-design-system Specification

## Purpose

Define the app's visual system: a monochrome/ink accent, token-based theming (light/dark), one shared control height, a fixed button variant set, and a single tab style.

## Requirements

### Requirement: Monochrome ink accent

The UI accent SHALL be monochrome ink — `neutral-900` in light mode and `neutral-100` in dark mode — used for primary buttons, focus, and selection. No chromatic hue (e.g. blue) SHALL be used as the general UI accent; hue is reserved for status meaning.

#### Scenario: Primary action uses ink

- **WHEN** a primary button or a selected item is shown
- **THEN** its emphasis color is the ink accent (dark on light, light on dark), not blue

#### Scenario: Blue is only status

- **WHEN** blue appears anywhere in the UI
- **THEN** it denotes the "running now" status, not a button/tab/selection accent

### Requirement: Token-based theming

Colors SHALL be defined as semantic design tokens (via Tailwind `@theme` CSS variables) with light and dark values, and components SHALL reference semantic classes (e.g. surface, border, muted, accent, and status tokens) rather than raw color utilities. Theme switching SHALL be driven by token values, not per-element `dark:` overrides.

#### Scenario: One place controls the palette

- **WHEN** a token's value is changed in the theme definition
- **THEN** every component using that token reflects the change, with no per-component color edits

#### Scenario: Light and dark both defined

- **WHEN** the system appearance is light or dark
- **THEN** the UI renders correctly in both, driven by the token definitions

### Requirement: Consistent control sizing

Interactive controls (buttons and text inputs) SHALL share a single height and horizontal padding so they align when placed together, regardless of borders. Buttons SHALL NOT wrap their label.

#### Scenario: Button aligns with adjacent input

- **WHEN** a button sits next to a text input (e.g. `+ New` beside search)
- **THEN** their heights match, their edges align, and the button label stays on one line

#### Scenario: Defined button variants

- **WHEN** a button is rendered
- **THEN** it uses one of the defined variants (primary/secondary/ghost/danger) and sizes (md/icon) with consistent sizing

### Requirement: Single tab style

The app SHALL use one tab style — underline — everywhere tabs appear.

#### Scenario: Tabs look the same across views

- **WHEN** tabs are shown in the detail view and in the editor
- **THEN** they use the same underline tab style
