## 1. Scripts + Node pinning

- [x] 1.1 Add `.nvmrc` (Node 24) and `engines.node` to `package.json`
- [x] 1.2 Add package scripts: `typecheck` (`tsc --noEmit`), `test` (run `node src/lib/ansi.test.ts` + `node src/lib/shellwords.test.ts` + `cargo test --manifest-path src-tauri/Cargo.toml`), `lint` (`cargo fmt --manifest-path src-tauri/Cargo.toml --check` + `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`)

## 2. Normalize for the new gates

- [x] 2.1 Run `cargo fmt` in `src-tauri` and commit the formatting diff
- [x] 2.2 Run `cargo clippy -- -D warnings` and fix any findings (keep changes mechanical)

## 3. Workflow

- [x] 3.1 Add `.github/workflows/ci.yml` — trigger `pull_request` → `main` and `push` → `main`; single `macos-latest` job
- [x] 3.2 Steps: checkout → pnpm setup + `actions/setup-node` (Node 24, pnpm cache) → `pnpm install` → `pnpm build` → Node unit tests
- [x] 3.3 Rust steps: `Swatinem/rust-cache` → `cargo fmt --check` → `cargo clippy -- -D warnings` → `cargo test` (working dir `src-tauri`)
- [x] 3.4 Spec step: `brew install openspec` → `openspec validate --specs`

## 4. Verify

- [x] 4.1 Locally: `pnpm typecheck`, `pnpm test`, `pnpm lint`, and `openspec validate --specs` all pass; `act` or a pushed branch shows the workflow green
- [x] 4.2 Document (README or proposal note): enable the `ci` check as a required status check in GitHub branch-protection settings
