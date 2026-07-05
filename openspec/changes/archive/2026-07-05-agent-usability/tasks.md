## 1. Live status auto-refresh

- [x] 1.1 Backend: `job_statuses() -> HashMap<String, LiveStatus>` in `commands.rs` (launchctl list + print-disabled only; `LiveStatus { loaded, disabled, pid, lastExit }`, camelCase); register in `lib.rs`
- [x] 1.2 Frontend: `jobStatuses()` in `api.ts` + `LiveStatus` type; poll every ~3s in `App.tsx`, merging only status fields into `jobs` and the selected `detail.job`

## 2. Malformed-plist recovery

- [x] 2.1 Backend: make `get_job` resilient — on parse failure return `JobDetail` with `parseError`, empty form, and `raw_plist` = file text
- [x] 2.2 Frontend: `JobEditor` accepts `initialRaw`/`initialTab`; `App` opens a parse-error job's editor on the Raw tab; save via `save_job` (Rust guard unchanged)

## 3. Quoted command arguments

- [x] 3.1 Add `src/lib/shellwords.ts` (`splitArgs`/`joinArgs`, single/double quotes, `\`-escapes) + `shellwords.test.ts`
- [x] 3.2 Wire into `JobEditor` Command field (replace the `split(/\s+/)`)

## 4. Reveal / open externally

- [x] 4.1 Add `opener:allow-reveal-item-in-dir` and `opener:allow-open-path` to `capabilities/default.json`
- [x] 4.2 `DetailPane`: Reveal (plist in Finder), Open plist, and Open-log buttons via `@tauri-apps/plugin-opener`; surface failures via the error UI

## 5. Clone / duplicate

- [x] 5.1 `App` editor state gains an `initialForm` override; `DetailPane` Duplicate button (disabled on parse-error) opens a new job pre-filled with label + `.copy`

## 6. Verify

- [x] 6.1 `node src/lib/shellwords.test.ts` and `node src/lib/ansi.test.ts` pass; `cargo test` passes; `pnpm build` clean
- [x] 6.2 Run the app: status updates live after a `kickstart`; a malformed plist opens to a fixable Raw tab; a quoted command round-trips; Reveal/Open work; Duplicate creates a `.copy` job
