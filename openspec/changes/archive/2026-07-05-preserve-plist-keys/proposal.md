## Why

Saving an agent through the guided form silently destroys any launchd key the
form does not model. `form_to_value` rebuilds the plist from scratch using only
the ~10 keys `JobForm` knows about, so `WorkingDirectory`, `ProcessType`, `Nice`,
`ThrottleInterval`, `UserName`, and every other key are dropped on every
form-based save, edit, and duplicate. This corrupted a real agent: duplicating a
`docker-compose` job lost its `WorkingDirectory`, so the copy ran in `/` and
failed with `no configuration file provided: not found`. Data loss on save is a
correctness bug, not a missing feature.

## What Changes

- Add `WorkingDirectory` as a first-class field in the guided form (read, write,
  and an input in the Advanced section) — a common, legitimately-missing key and
  the immediate unblock for the broken agent.
- Make form-based saves **non-destructive**: when regenerating a plist from the
  form, merge the form's modeled keys onto the original plist so keys the form
  does not model survive. Clearing a modeled field still removes that key.
- Duplicate and edit carry the source plist as the merge base, so unmodeled keys
  are preserved through both flows. Creating a brand-new agent has no base and
  behaves exactly as today.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `agent-editor`: plist read/write fidelity now requires preserving unmodeled
  keys through the guided form; the guided form gains `WorkingDirectory`; edit and
  duplicate must not drop keys they don't display.

## Impact

- `src-tauri/src/plist_model.rs`: `JobForm` gains `working_directory`;
  `form_to_value` becomes merge-based (`base: Option<Value>`); `value_to_form`
  reads `WorkingDirectory`; new/updated round-trip tests.
- `src-tauri/src/commands.rs`: `form_to_plist` accepts an optional base plist.
- `src/api.ts`, `src/types.ts`, `src/components/JobEditor.tsx`, `src/App.tsx`:
  thread the original raw plist as the merge base through edit/duplicate/save and
  add the `WorkingDirectory` input.
- Scope unchanged: user agents only (`~/Library/LaunchAgents`, `gui/<uid>`); no
  daemons, no root. No new dependencies.
