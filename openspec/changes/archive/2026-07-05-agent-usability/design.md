## Context

Five independent usability gaps in launchr, from an approved plan. All reuse
existing utilities and add no runtime dependencies. The Rust command surface and
React components are already established; these are targeted additions.

## Goals / Non-Goals

**Goals:** live status without re-selecting; malformed plists are recoverable;
guided command field handles quoting; reveal/open files; clone a job.

**Non-Goals:** background/daemon scope changes; shell expansion in commands;
plist *schema* validation; new dependencies.

## Decisions

### Status polling via a dedicated lightweight command
Add `job_statuses() -> HashMap<String, LiveStatus>` that calls only
`launchctl::loaded_states()` + `disabled_labels()` — no plist file reads. The
frontend polls every ~3s and merges **only** status fields into the jobs list and
the selected `detail.job`. *Why:* re-running `list_jobs` (readdir + parse every
plist) on a timer is wasteful, and merging only status fields leaves the open
editor and CodeMirror untouched (no churn). *Alternative:* reuse `list_jobs` —
rejected for the file-I/O cost.

### `get_job` degrades instead of erroring
On `read_value` failure, return a `JobDetail` with `parseError` set, an empty
form, and `raw_plist` = the actual file text (via `fs::read_to_string`). The
editor gains optional `initialRaw`/`initialTab` so a parse-error job opens on the
Raw tab. Save still flows through `save_job`, which parses and rejects invalid
input — the authoritative guard is unchanged. *Trade-off:* if the user changes
the Label while fixing, the file is written under the new label and the old
malformed file remains (acceptable edge).

### Shell-style tokenizer, hand-rolled
`src/lib/shellwords.ts`: `splitArgs` (respects `'`/`"`, `\`-escapes inside double
quotes) and `joinArgs` (re-quotes args with whitespace). launchd runs no shell,
so argv semantics — not full shell parsing — is exactly right, and it's ~30 lines
with a unit test. No dependency.

### Opener plugin, already present
Use `@tauri-apps/plugin-opener` (`revealItemInDir`, `openPath`) directly in
`DetailPane`; add `opener:allow-reveal-item-in-dir` and `opener:allow-open-path`
to `capabilities/default.json`. Failures surface via the existing error UI.

### Clone is frontend-only
Duplicate opens the editor in `new` mode with `initialForm = { ...detail.form,
label: label + ".copy" }`, reusing `save_job(is_new=true)`. No backend change.

## Risks / Trade-offs

- **Polling churn / flicker** → merge only the four status fields by label; never
  replace whole objects; keyed components stay mounted.
- **Opener permissions** → the specific `allow-*` permissions are added explicitly
  in case `opener:default` doesn't grant them; verify at build.
- **Tokenizer round-trip** → `splitArgs`/`joinArgs` are covered by a unit test
  (quotes, escapes, round-trip); the form's `programArguments` array remains the
  source of truth, so display is lossy-safe.
