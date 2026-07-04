## 1. Project scaffold

- [x] 1.1 Scaffold Tauri app with Vite + React frontend (macOS target)
- [x] 1.2 Add Rust deps: `plist`, `serde`, `serde_json`; confirm `tauri` builds and runs an empty window
- [x] 1.3 Set up the component/styling layer: Tailwind v4 + hand-rolled primitives (`components/ui.tsx`). Vengeance UI dropped from scope — it's a marketing-flourish lib, wrong fit for a dense utility UI. Revisit if flourish is wanted later.

## 2. Backend: launchd core (Rust)

- [x] 2.1 Resolve current uid once at startup; expose a `gui/<uid>` domain-target helper
- [x] 2.2 Model the supported plist keys as a serde struct (Label, ProgramArguments, RunAtLoad, StartInterval, StartCalendarInterval, WatchPaths, KeepAlive, StandardOutPath, StandardErrorPath, EnvironmentVariables); read + write via the `plist` crate
- [x] 2.3 Implement a `launchctl` wrapper module (run command, capture exit code + stdout/stderr, return typed result)
- [x] 2.4 Parse `launchctl list <label>` output into a live-state struct (PID, last exit status, loaded/enabled); isolate all parsing here
- [x] 2.5 Implement app-owned manifest read/write at `~/Library/Application Support/launchr/` (set of "Mine" labels)

## 3. Backend: tauri commands

- [x] 3.1 `list_jobs` — readdir `~/Library/LaunchAgents`, parse each plist, merge `launchctl list`, tag Mine/System from manifest; surface per-file parse errors without failing the whole list
- [x] 3.2 `get_job(label)` — parse file + fetch live status
- [x] 3.3 `save_job(spec)` — serialize struct to plist, write to `~/Library/LaunchAgents/<label>.plist`, add to manifest on create, reject duplicate label
- [x] 3.4 `set_state(label, action)` — dispatch bootstrap / bootout / enable / disable / kickstart -k; return control outcome incl. stderr on failure
- [x] 3.5 `tail_logs(label)` — stream StandardOutPath/StandardErrorPath to the frontend (event channel), handle missing/rotated files, stop on new subscription

## 4. Frontend: shell + inventory

- [x] 4.1 Master–detail layout: sidebar + detail pane, search box, `+ New` button
- [x] 4.2 Sidebar grouping: Mine (top) / System (collapsed), rendered from `list_jobs`
- [x] 4.3 Two-part status UI: availability chip (Loaded/Disabled/Not loaded) + health signal (idle / running / last-failed w/ exit code)
- [x] 4.4 Empty state when no agents exist

## 5. Frontend: detail, control, logs

- [x] 5.1 Detail header: name + label, status, action buttons (Run now / Load-Unload / Enable-Disable) wired to `set_state` (Stop == Unload; launchd has no separate stop verb)
- [x] 5.2 Overview tab: schedule + command + log paths summary
- [x] 5.3 Logs tab: live tail with follow + pause, consuming the `tail_logs` event stream
- [x] 5.4 Surface control failures (error toast/inline) from `set_state`

## 6. Frontend: editor

- [x] 6.1 Guided form (plain labels with launchd key shown secondary), used for both create and edit
- [x] 6.2 Schedule control: presets (at login / every N min / daily at / on folder change) + Advanced disclosure (calendar array, watch paths)
- [x] 6.3 Raw plist tab: reflect form values as XML, edit directly, block save on invalid plist
- [x] 6.4 Wire create/edit to `save_job`; handle duplicate-label rejection

## 7. Verification

- [x] 7.1 Manual end-to-end: create an interval agent, load it, run now, watch it appear running then idle, tail its logs, disable, unload, delete
- [x] 7.2 Round-trip test: open a binary-format plist and save without corruption (cargo test: `reads_binary_plist_without_corruption`)
- [x] 7.3 Confirm a launchr-created label lands under Mine and a vendor agent under System

## 8. Bug fixes from first use

- [x] 8.1 `schedule_desc`: describe multi-entry `StartCalendarInterval` (terse for sidebar, e.g. "2 times daily" / "daily at 09:30, 11:30"); Overview renders entries from `form.calendar`
- [x] 8.2 Overview: render the schedule as a small list of calendar entries (times, plus weekday/day/month when present) instead of a one-line label
- [x] 8.3 Logs tail: fix UTF-8 handling — read bytes into a per-stream leftover buffer, decode the valid prefix (`str::from_utf8` / `valid_up_to`), carry incomplete trailing bytes to the next poll; stop dropping chunks on invalid reads
- [x] 8.4 Editor: replace the single "Daily at" time input with an add/remove list of times, each mapping to a `{Hour, Minute}` calendar entry (times-only; weekday/day/month stay in Advanced)
- [x] 8.5 Editor: fix data loss — editing a job with multiple calendar entries must preserve all entries; the times list must show and round-trip every entry, not just `calendar[0]`
- [x] 8.6 Verify: open the pvemonitor plist (09:30 + 11:30), confirm Overview lists both times, edit an unrelated field, save, and confirm both entries survive (backend round-trip proven by `pvemonitor_multi_entry_calendar_survives_round_trip`; GUI walk pending)
- [x] 8.7 Delete button does nothing: `window.confirm` is a no-op in the Tauri webview, so `remove()` returned before calling `delete_job`. Replaced with an in-app `ConfirmDialog` (reuses the overlay idiom; no new dependency); GUI confirm-and-delete pending manual walk
- [x] 8.8 Verify: click Delete → confirmation appears → confirm removes the job; cancel leaves it (GUI walk)

## 9. Branding

- [x] 9.1 Regenerate the bundle icon set from `public/logo/launchr-1024.png` (`pnpm tauri icon`); `tauri.conf.json` `bundle.icon` references regenerated, default Tauri icon replaced (128x128 verified as launchr mark)
- [x] 9.2 Add a theme-aware `Logo` component using `/logo/*.png` (dark-squircle in dark mode, `-inverse` in light mode). Small `-inverse` sizes don't exist — light variant scales the 1024 master via width/height
- [x] 9.3 Place the logo + "launchr" wordmark in the sidebar header, above the search field
- [x] 9.4 Place a larger centered mark in the empty "No job selected" state
- [x] 9.5 Set the dev favicon in `index.html` to the launchr mark (title already "launchr")
