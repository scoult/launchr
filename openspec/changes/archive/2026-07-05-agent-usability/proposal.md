## Why

A gap review of launchr surfaced five things you'd expect from a launchd manager
that weren't there: status never refreshed on its own, a malformed plist was a
dead-end you couldn't open or fix, the guided Command field couldn't handle
quoted arguments, there was no way to reveal/open files despite the opener plugin
being installed, and no way to clone a job. This change closes those gaps.

## What Changes

- **Live status auto-refresh** — a lightweight `job_statuses` command (runtime
  state only, no plist reads) polled every ~3s, merged into the sidebar and the
  selected job so running/idle/last-exit update without re-selecting.
- **Malformed-plist recovery** — `get_job` no longer errors on an unparseable
  plist; it returns the raw file text so the job opens and can be fixed. The
  editor can open straight on the Raw tab for a parse-error job.
- **Quoted command arguments** — the Command field tokenizes with shell-style
  single/double quotes (literal argv, no shell expansion), so real commands work
  without dropping to the raw plist.
- **Reveal / open externally** — Reveal-in-Finder for the plist, Open plist, and
  Open-log buttons, wired to the (already-installed) opener plugin.
- **Clone / duplicate** — a Duplicate action pre-fills the editor as a new job
  from the selected one (label + `.copy`).

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `agent-inventory`: live status auto-refresh; reveal/open a job's plist and log
  files externally.
- `agent-editor`: recover and fix malformed plists; quoted-argument command
  parsing; duplicate an existing job.

## Impact

- **No new runtime dependencies** (opener plugin already installed).
- **Backend:** `src-tauri/src/commands.rs` (`job_statuses`, resilient `get_job`),
  `lib.rs` (register), `capabilities/default.json` (opener permissions).
- **Frontend:** `src/api.ts`, `types.ts`, `App.tsx`,
  `components/JobEditor.tsx`, `components/DetailPane.tsx`, and a new
  `src/lib/shellwords.ts` (+ test).
- **No behavior change** to status *meaning*, control verbs, or the save guard
  (Rust `save_job` remains authoritative).
