## ADDED Requirements

### Requirement: macOS application icon

The system SHALL use the launchr icon as the macOS application icon (Dock, Finder, ⌘-Tab), generated from `public/logo/launchr-1024.png` (the dark squircle master). The default Tauri placeholder icon SHALL NOT ship.

#### Scenario: App shows the launchr icon

- **WHEN** the app is built and launched
- **THEN** the Dock/Finder icon is the launchr chevron mark, not the default Tauri logo

### Requirement: Theme-aware in-app logo

The system SHALL display the launchr mark inside the UI in both the sidebar header and the empty "no job selected" state, and the mark SHALL adapt to the active theme — the light-squircle (`-inverse`) variant in light mode and the dark-squircle variant in dark mode.

#### Scenario: Logo in the sidebar header

- **WHEN** the app is open
- **THEN** the sidebar shows the launchr mark (with wordmark) above the search field

#### Scenario: Logo in the empty state

- **WHEN** no job is selected
- **THEN** the empty pane shows a larger centered launchr mark

#### Scenario: Logo follows the theme

- **WHEN** the system appearance is light vs dark
- **THEN** the in-app logo uses the inverse (light) variant in light mode and the dark variant in dark mode
