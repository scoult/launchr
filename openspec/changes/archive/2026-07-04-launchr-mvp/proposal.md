## Why

Managing macOS `launchd` user agents today means hand-editing plist XML and memorizing `launchctl` incantations (`bootstrap`, `bootout`, `kickstart`, domain targets). There is no approachable, honest GUI for the everyday case — the dev scripts, periodic jobs, and folder-watchers people run in their own user session. `launchr` is that GUI: create, control, inspect, and tail user agents without touching XML or the terminal.

## What Changes

- New macOS desktop app (**Tauri + Vite + React**, Vengeance UI on a shadcn base).
- **Scope is deliberately user agents only** — `~/Library/LaunchAgents`, `gui/<uid>` domain. No daemons, no root, no privilege escalation in v1.
- **Discover & group** all user agents in a master–detail sidebar: "Mine" (created by launchr) vs "System" (vendor/other, collapsed).
- **Two-part status** per job: an availability chip (Loaded / Disabled / Not loaded) plus a health signal (idle / running now / last-run failed) — because a scheduled agent is idle-waiting ~99% of the time, so a single "running" dot lies.
- **Lifecycle control** via buttons mapping to modern `launchctl` verbs: load (`bootstrap`), unload (`bootout`), `enable`/`disable`, run-now/restart (`kickstart -k`).
- **Create/edit** jobs through a guided form with a raw-plist toggle. Plain vocabulary (Name, Command, Run at login) with the real launchd key shown secondary (Label, ProgramArguments, RunAtLoad).
- **Schedule** via presets (at login, every N minutes, daily at time, when a folder changes) with an Advanced section for full calendar intervals and watch paths.
- **Live log tail** of a job's `StandardOutPath` / `StandardErrorPath` with follow + pause.
- **"Mine" tracked out-of-band** in an app-owned manifest at `~/Library/Application Support/launchr/` — plists are never polluted with launchr metadata.

## Capabilities

### New Capabilities
- `agent-inventory`: Discover user agents from `~/Library/LaunchAgents`, merge on-disk plist config with live `launchctl` state, group as Mine/System, and expose the two-part status model.
- `agent-lifecycle`: Control an agent's runtime state — load/unload, enable/disable, run-now/restart — via `launchctl` domain-targeted verbs, with clear success/failure reporting.
- `agent-editor`: Create and edit agents through a guided form + raw-plist toggle, including the schedule (presets + advanced) and plist read/write via the `plist` crate.
- `agent-logs`: Live-tail an agent's stdout/stderr log files with follow and pause.
- `app-branding`: The launchr icon as the macOS app icon (Dock/Finder) and a theme-aware logo shown inside the UI.

### Modified Capabilities
<!-- None — greenfield project, no existing specs. -->

## Impact

- **New project scaffold**: Tauri app shell, Rust backend crate, React/Vite frontend, Vengeance/shadcn component setup. Rust toolchain is required (now installed).
- **New Rust dependencies**: `tauri`, `plist` (plist read/write), `serde`; shell-out to the system `launchctl` binary for state + control (no library exists for it).
- **Backend surface**: ~5 `#[tauri::command]` functions — `list_jobs`, `get_job`, `save_job`, `set_state`, `tail_logs`.
- **Filesystem writes**: creates/edits `.plist` files under `~/Library/LaunchAgents`; creates an app manifest under `~/Library/Application Support/launchr/`.
- **Platform**: macOS only. No Windows/Linux target.
- **Out of scope (v1)**: system daemons (`/Library/LaunchDaemons`), root/privileged operations, and any non-user domains.
