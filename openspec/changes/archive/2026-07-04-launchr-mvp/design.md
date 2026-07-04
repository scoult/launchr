## Context

`launchr` is a greenfield macOS desktop app for managing `launchd` **user agents**. launchd exposes two surfaces per job: the plist file on disk (static config) and the running service manager (live state + control). There is no stable library binding for `launchctl`; the plist files, however, are well served by an existing Rust crate. The app is built with Tauri (Rust backend + system webview) and a Vite + React frontend using Vengeance UI on a shadcn base. Rust toolchain is installed (cargo 1.96).

## Goals / Non-Goals

**Goals:**
- Manage user agents in `~/Library/LaunchAgents` (`gui/<uid>` domain) end-to-end: discover, control, create/edit, tail logs.
- Be honest about runtime state (two-part status), approachable in vocabulary, and never require the terminal or hand-edited XML for the common case.
- Keep the backend surface tiny (~5 tauri commands) and never pollute user plists with app metadata.

**Non-Goals:**
- System daemons (`/Library/LaunchDaemons`), root, or any privilege escalation. Explicitly deferred.
- Non-user launchd domains (`system/`, other users).
- Windows/Linux support.

## Decisions

### Split responsibility by concern: `plist` crate for files, shell out for state/control
The plist file and the runtime are different in kind. **Config files** (read + write) go through the `plist` crate — type-safe serialization of a Rust struct modeling only the ~12 keys we support, correct handling of XML *and* binary plists, and correct escaping. **Runtime state and control** must shell out to `launchctl`, because no stable library exists and there is no file for live state.
- *Alternative considered:* hand-templating plist XML — rejected (escaping bugs, no binary-plist read). A private/semi-deprecated ServiceManagement C API — rejected (fragile, not worth the FFI).
- *Softening trick:* `launchctl list <label>` / `print` emit dict-structured output that can often be fed back through the plist parser rather than scraped as freeform text.

### Domain targeting is always `gui/<uid>`
The current user's uid is resolved once at startup. Control verbs use modern subcommands: `bootstrap` / `bootout` (not legacy `load`/`unload`), `enable` / `disable`, and `kickstart -k` for run-now/restart.

### "Mine" is tracked in an app-owned manifest, not in the plist
A JSON manifest at `~/Library/Application Support/launchr/` lists labels launchr created. Grouping reads from it. This keeps plists clean and makes "Mine vs System" a trivial set-membership check.

### Backend surface: ~5 tauri commands
`list_jobs` (readdir + plist-parse + merge `launchctl list`), `get_job(label)` (parse file + live status), `save_job(spec)` (serialize + write + manifest update on create), `set_state(label, action)` (bootstrap/bootout/enable/disable/kickstart), `tail_logs(label)` (stream stdout/stderr). All state and mutation live in Rust; React calls these over IPC — there is no HTTP/API layer.

### Frontend: shadcn primitives carry the UI, Vengeance for flourish
Master–detail shell. The dense workhorses (Table/list, Tabs, Dialog, Form) are plain shadcn; Vengeance UI components are used sparingly for polish. Editor is form-first with a raw-plist tab; schedule is presets + an Advanced disclosure.

## Risks / Trade-offs

- **`launchctl print` output format is not a stable contract** → Prefer the more structured `launchctl list <label>` output for status; treat `print` scraping as best-effort enrichment, and isolate all parsing behind one module so a macOS-version change is a localized fix.
- **Live log tail cost / file rotation** → Watch/poll the specific configured log paths only; handle missing/rotated files by re-opening, and stop the tail when the selection changes.
- **Writing to `~/Library/LaunchAgents` then loading can partially fail** (file written but `bootstrap` errors) → Report control failures explicitly (see agent-lifecycle) and never optimistically show a state the command did not confirm.
- **Editing a System (vendor) agent could break vendor software** → Editing is available but destructive/lifecycle actions on System agents should be clearly distinguished from Mine; consider a confirm step before mutating a System agent.
- **Next.js was dropped in favor of Vite** → smaller risk surface; documented so no one re-adds SSR assumptions that don't apply in a static Tauri frontend.
