## Why

launchr has real checks — TypeScript typecheck, two Node unit-test files, Rust
tests — but nothing runs them automatically. Bugs and regressions can land on
`main` unnoticed (indeed the working tree was recently reverted with no safety
net). A GitHub Actions pipeline that runs the tests and linters on every PR and
push to `main` gives a green/red signal and a basis for branch protection.

## What Changes

- Add a **GitHub Actions workflow** (`.github/workflows/ci.yml`) that runs on
  `pull_request` → `main` and `push` → `main`, as a single **macOS** job
  (required: the Tauri Rust crate only compiles on macOS, and `cargo` needs the
  frontend `dist/` present, so the frontend is built first).
- The job runs: `pnpm build` (tsc typecheck + vite), the Node unit tests
  (`ansi`, `shellwords`), `cargo fmt --check`, `cargo clippy -- -D warnings`,
  `cargo test`, and `openspec validate --specs`.
- Add **npm scripts** (`test`, `lint`, `typecheck`) so CI and humans share one
  command, and **pin Node** (`.nvmrc` + `engines`) so the type-stripping tests
  run consistently.
- Add **caching** (pnpm store + Rust) so macOS runs stay fast.
- One-time normalization so the new gates pass: run `cargo fmt` and clear any
  `clippy` findings.

Out of scope: ESLint/Prettier (deferred), full `tauri build`/.app bundling and
code signing (a separate release workflow), and making the check *required* to
merge (a repo branch-protection setting, not the workflow).

## Capabilities

### New Capabilities
- `ci`: Automated pre-merge checks (typecheck, unit tests, Rust fmt/clippy/test,
  spec validation) run by GitHub Actions on PRs and pushes to `main`.

### Modified Capabilities
<!-- None. -->

## Impact

- **New:** `.github/workflows/ci.yml`, `.nvmrc`.
- **Edited:** `package.json` (scripts + `engines`); possibly small `cargo fmt`/
  `clippy` normalization across `src-tauri/src/*`.
- **No runtime/app behavior change.** CI-only.
- **Runner cost:** macOS minutes (free for public repos; 10× multiplier for
  private) — mitigated by caching.
- **Follow-up (manual):** enable the `ci` check as a required status check in
  GitHub branch-protection settings.
