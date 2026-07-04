<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo/launchr-1024-inverse.png">
  <img src="public/logo/launchr-256.png" width="128" alt="launchr logo">
</picture>

# launchr

**A macOS GUI for managing your `launchd` user agents.**

Create, control, inspect, and tail the scripts and scheduled jobs in your user
session — without hand-editing plist XML or memorizing `launchctl`.

</div>

---

## What it does

`launchr` is a desktop app over the three things `launchd` actually lets you do
with a user agent: read the job, edit the job, and control the job.

- **Discover & group** all agents in `~/Library/LaunchAgents`, split into
  **Mine** (created by launchr) and **System** (everything else, collapsed).
- **Honest two-part status** — an availability chip (Loaded / Disabled / Not
  loaded) plus a health signal (idle / running now / last-run failed). A
  scheduled job is idle-waiting almost all the time, so it never masquerades as
  "running."
- **Lifecycle control** — Load / Unload, Enable / Disable, and Run now, mapped
  to the modern `launchctl` verbs (`bootstrap`, `bootout`, `enable`, `disable`,
  `kickstart -k`).
- **Guided editor + raw plist** — a plain-language form (with the real launchd
  key shown alongside) and a Raw tab with **XML syntax highlighting, line
  numbers, and inline validation**.
- **Schedules** — presets (at login, every N minutes, at one or more times of
  day, on folder change) plus an Advanced section for full calendar intervals
  and watch paths.
- **Live log tail** — follow `StandardOutPath` / `StandardErrorPath` in real
  time, with **ANSI color rendering**, follow/pause, and correct UTF-8.
- **Themed** — an ink monochrome design system that follows the system light/dark
  appearance.

> **Scope:** user agents only (`~/Library/LaunchAgents`, the `gui/<uid>` domain).
> System daemons (`/Library/LaunchDaemons`), root, and other domains are
> intentionally out of scope.

## Tech stack

| Layer | Choice |
|---|---|
| Shell | [Tauri 2](https://tauri.app) (Rust backend + system WebView) |
| Frontend | [Vite](https://vite.dev) + React + TypeScript |
| Styling | Tailwind CSS v4 (semantic design tokens) |
| Code editor | [CodeMirror 6](https://codemirror.net) (raw plist) |
| Plist I/O | Rust [`plist`](https://crates.io/crates/plist) crate |
| Runtime state / control | shell out to `launchctl` (no stable library exists) |

The Rust backend is a small command surface — `list_jobs`, `get_job`,
`save_job`, `form_to_plist`, `set_state`, `delete_job`, `tail_logs`,
`stop_tail` — invoked from React over Tauri IPC. Plist **files** are read/written
with the `plist` crate; runtime **state and control** shell out to `launchctl`.
"Mine" is tracked in an app-owned manifest under
`~/Library/Application Support/launchr/`, never in the plists themselves.

## Prerequisites

- **macOS**
- **Rust** toolchain (`cargo`) — https://rustup.rs
- **Node.js** and **pnpm**

## Develop

```sh
pnpm install
pnpm tauri dev      # launches the app with hot-reload
```

## Build

```sh
pnpm tauri build                 # full bundle (.app + .dmg)
pnpm tauri build --bundles app   # just the .app, faster
```

The app bundle lands at
`src-tauri/target/release/bundle/macos/launchr.app`.

## Test

```sh
cargo test --manifest-path src-tauri/Cargo.toml   # Rust: plist round-trip, schedule parsing
node src/lib/ansi.test.ts                          # frontend: ANSI SGR parser
```

## Project layout

```
launchr/
├─ src/                 React frontend
│  ├─ components/       Sidebar, DetailPane, JobEditor, LogsView, CodeEditor, ui
│  ├─ lib/ansi.ts       ANSI SGR parser (+ test)
│  ├─ api.ts            typed wrappers over Tauri commands
│  └─ index.css         Tailwind + design tokens (light/dark)
├─ src-tauri/src/       Rust backend
│  ├─ commands.rs       the tauri command surface
│  ├─ launchctl.rs      launchctl wrapper + output parsing
│  ├─ plist_model.rs    plist read/write + schedule/form model
│  ├─ manifest.rs       "Mine" label manifest
│  └─ domain.rs         uid / gui domain / paths
├─ public/logo/         app + in-app logos
└─ openspec/            specs & change history (see below)
```

## Specs

This project is spec-driven with OpenSpec — the canonical
behavior lives in `openspec/specs/` (capabilities: `agent-inventory`,
`agent-lifecycle`, `agent-editor`, `agent-logs`, `app-branding`,
`ui-design-system`), and every change's proposal/design/tasks are archived under
`openspec/changes/archive/`.

## License

[GPL-3.0-or-later](LICENSE) © launchr contributors.
