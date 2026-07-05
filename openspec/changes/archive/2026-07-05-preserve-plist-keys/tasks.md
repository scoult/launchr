## 1. Backend: merge-based serialization + WorkingDirectory

- [x] 1.1 Add `working_directory: Option<String>` to `JobForm` in `src-tauri/src/plist_model.rs`.
- [x] 1.2 Read `WorkingDirectory` in `value_to_form` via the existing `string_key` helper.
- [x] 1.3 Change `form_to_value` to `form_to_value(f: &JobForm, base: Option<Value>) -> Value`: start from the base dictionary (cloned) or empty; for each modeled key insert-when-set and remove-when-unset; write `WorkingDirectory` from `working_directory`.
- [x] 1.4 Update `form_to_plist` in `src-tauri/src/commands.rs` to accept `base_raw: Option<String>`, parse it with `parse_str`, and pass to `form_to_value`. Update all internal callers of `form_to_value`.

## 2. Frontend: thread the base plist and add the field

- [x] 2.1 Add `workingDirectory: string | null` to `JobForm` in `src/types.ts`.
- [x] 2.2 Update `formToPlist(form, baseRaw?)` in `src/api.ts` to pass `baseRaw`.
- [x] 2.3 In `src/components/JobEditor.tsx`, pass `initialRaw` as the base in `save()` and `switchTab()`; add a `WorkingDirectory` `Field` in the `Advanced` section (mirror the stdout/stderr path fields, `value || null`).
- [x] 2.4 In `src/App.tsx`, pass `initialRaw: detail.rawPlist` from `openDuplicate`, and thread `detail.rawPlist` through the normal (non-parse-error) `openEdit` path.

## 3. Tests

- [x] 3.1 Extend `form_round_trips_through_xml` in `plist_model.rs` to cover `working_directory`.
- [x] 3.2 Add a Rust test: parse a plist with `WorkingDirectory` + `ProcessType`, `value_to_form` it, `form_to_value(form, Some(original))`, and assert both keys survive.
- [x] 3.3 Add a Rust test: `form_to_value(form_with_cleared_field, Some(base_with_that_key))` removes the modeled key.
- [x] 3.4 Run `pnpm test`, `pnpm typecheck`, `pnpm lint` — all green.

## 4. Manual verification

- [x] 4.1 Set WorkingDirectory to `/Users/samcoult/development/php_utils` on the duplicate, reload, Run now → `no configuration file provided` gone, job runs (verified: err log empty, program produced output).
- [ ] 4.2 Add `ProcessType` to an agent via the raw tab, then Duplicate it via the form → confirm `ProcessType` survives in the saved copy's plist.
