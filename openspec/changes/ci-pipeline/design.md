## Context

launchr has checks but no automation. Two hard constraints shape the pipeline:
the Tauri Rust crate only compiles on macOS (objc2/cocoa/webkit deps), and
`cargo` fails unless the frontend `dist/` exists (`generate_context!` validates
`frontendDist` at compile time). There is no ESLint; tests are two `node
file.ts` scripts relying on Node's TS type-stripping; `openspec` is a
homebrew-core CLI.

## Goals / Non-Goals

**Goals:** one green/red signal on PRs and `main`; run typecheck, unit tests,
Rust fmt/clippy/test, and spec validation; fast via caching; reproducible Node.

**Non-Goals:** ESLint/Prettier; `.app` bundling / signing / release; enforcing
merge-blocking (a branch-protection setting); multi-OS (macOS-only app).

## Decisions

### Single macOS job, frontend before Rust
One `macos-latest` job. Order: `pnpm install` → `pnpm build` (typecheck + vite,
produces `dist/`) → Node tests → `cargo fmt --check`/`clippy`/`test` →
`openspec validate --specs`. *Why:* the Rust crate needs macOS and needs `dist/`;
a single job keeps `dist` available and avoids artifact passing. Splitting the
frontend onto Ubuntu saves little since Rust still needs `dist` on macOS.

### openspec via Homebrew
Install with `brew install openspec` (homebrew-core, bottled, brew preinstalled
on GitHub macOS runners). *Alternative rejected:* the npm `openspec` package is a
`0.0.0` squat — not the real tool.

### Lint = typecheck + rustfmt + clippy (no ESLint)
`tsc` (via `pnpm build`) covers TS; `cargo fmt --check` and `cargo clippy -- -D
warnings` cover Rust. ESLint is deferred to avoid turning "add CI" into "adopt
and satisfy ESLint." A one-time `cargo fmt` + clippy cleanup normalizes the
existing hand-written Rust so the gates pass.

### Pin Node + expose scripts
Add `.nvmrc` and `engines.node` pinned to a version with unflagged TS stripping
(Node 24). Add package scripts: `typecheck` (`tsc --noEmit`), `test` (runs both
node test files + `cargo test`), `lint` (`cargo fmt --check` + clippy). CI calls
these so local and CI match.

### Caching
`pnpm/action-setup` + `actions/setup-node` cache for the pnpm store, and
`Swatinem/rust-cache` for the cargo registry/target (Tauri's dep tree is a
multi-minute cold compile).

## Risks / Trade-offs

- **fmt/clippy fail on first run** → expected; the change includes a one-time
  `cargo fmt` and clippy fixup. Keep those diffs mechanical/separate.
- **macOS runner minutes** → free for public repos; caching keeps runs short.
- **Node test discovery** → the two `.ts` tests are invoked explicitly via the
  `test` script; if more are added, prefer a glob or a tiny runner rather than
  listing each.
- **openspec version drift** → `brew install openspec` tracks latest; if a spec
  format bump ever breaks CI, pin the formula version.
- **Merge-blocking not automatic** → document that the `ci` check must be marked
  required in branch-protection settings after the first successful run.
