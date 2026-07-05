## Context

`form_to_value` (`src-tauri/src/plist_model.rs`) builds a fresh `Dictionary` from
`JobForm`'s modeled keys. The guided-form save path (`JobEditor.save` → `formToPlist`
→ `form_to_value`) therefore discards every key the form doesn't model. This was
proven on a live system: a duplicated `docker-compose` agent lost its
`WorkingDirectory` and failed with `no configuration file provided: not found`,
while the original kept working only because launchd still held a pre-strip
in-memory definition (`launchctl print` showed `working directory = …` for the
original and none for the duplicate, despite byte-identical on-disk files).

The frontend already has the source plist text available: `detail.rawPlist` is
passed to the editor for the parse-error path today.

## Goals / Non-Goals

**Goals:**
- No launchd key is silently dropped when saving/editing/duplicating via the form.
- `WorkingDirectory` is a first-class, editable field.
- New-agent creation is unchanged.

**Non-Goals:**
- Modeling every launchd key in the form (open-ended; the merge handles the rest).
- Re-bootstrapping already-loaded agents to pick up on-disk fixes (user reloads).
- Fixing that duplicate copies `StandardOutPath`/`StandardErrorPath` verbatim
  (separate log-collision footgun).

## Decisions

**Merge onto the original plist instead of rebuilding.**
`form_to_value(f: &JobForm, base: Option<Value>) -> Value`. Start from `base`'s
dictionary (cloned) or an empty one for new jobs. For each modeled key: insert
when the form value is set, and **remove** it when unset — otherwise a cleared
field would leave a stale value from the base. Unmodeled keys are left as-is.
- *Alternative rejected:* modeling more keys in `JobForm`. Never complete; the
  next unmodeled key silently breaks again. Merge fixes the whole class.

**Thread the base as raw plist text through the existing command boundary.**
`form_to_plist` gains `base_raw: Option<String>`, parsed with the existing
`parse_str`. `JobEditor` passes `initialRaw` as the base in `save()` and
`switchTab()`; `App.openDuplicate` passes `detail.rawPlist`; `App.openEdit`'s
normal path passes `detail.rawPlist` too. Reuses the raw text the editor already
carries — no new command, no new data model.

**`WorkingDirectory` as `Option<String>` on `JobForm`**, read via the existing
`string_key` helper and written like `standard_out_path`. UI: one `Field` in the
`Advanced` section next to the log paths, `value || null` on change.

## Risks / Trade-offs

- [Merge could keep a key the user meant to drop via the form] → Every modeled
  key is explicitly removed-when-unset, so the form stays authoritative over what
  it models; only genuinely unmodeled keys persist. Covered by the
  "clearing a modeled field removes its key" scenario/test.
- [Editing a parse-error job has no valid base] → that path already saves raw
  text directly (base is `None` / unused); unchanged.
- [Existing stripped plists (e.g. `local.pvemonitor`) can't be auto-recovered] →
  accepted; the new `WorkingDirectory` field lets the user re-set it.
