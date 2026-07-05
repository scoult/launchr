## ADDED Requirements

### Requirement: Automated checks on pull requests and main

The project SHALL run an automated CI pipeline on every pull request targeting
`main` and on every push to `main`. The pipeline SHALL fail if any check fails,
providing a single pass/fail status.

#### Scenario: PR triggers the pipeline

- **WHEN** a pull request against `main` is opened or updated
- **THEN** the CI pipeline runs and reports a pass/fail status on the PR

#### Scenario: A failing check fails the pipeline

- **WHEN** any check (typecheck, test, lint, or spec validation) fails
- **THEN** the pipeline reports failure

### Requirement: Checks cover frontend, backend, and specs

The pipeline SHALL run the TypeScript typecheck and frontend build, the Node unit
tests, the Rust tests, Rust formatting and lint checks, and OpenSpec validation.

#### Scenario: Frontend checks

- **WHEN** the pipeline runs
- **THEN** it performs the TypeScript typecheck + build and runs the Node unit
  tests (ansi and shellwords)

#### Scenario: Backend checks

- **WHEN** the pipeline runs
- **THEN** it runs `cargo test`, `cargo fmt --check`, and `cargo clippy` treating
  warnings as errors

#### Scenario: Spec validation

- **WHEN** the pipeline runs
- **THEN** it validates the OpenSpec specifications and fails on any invalid spec

### Requirement: Runs on macOS with dependency ordering

The pipeline SHALL run on a macOS runner (the Tauri crate is macOS-only) and
SHALL build the frontend before the Rust build so the required `dist/` output
exists when `cargo` compiles.

#### Scenario: Rust build has the frontend output available

- **WHEN** the Rust compilation/tests run
- **THEN** the frontend `dist/` has already been produced in the same job

### Requirement: Reproducible tooling

The repository SHALL pin the Node version used by CI and local development, and
SHALL expose the checks as package scripts so the same commands run in CI and
locally.

#### Scenario: Node version is pinned

- **WHEN** a developer or CI sets up the toolchain
- **THEN** a pinned Node version (compatible with the TypeScript-stripping tests)
  is used

#### Scenario: Checks are runnable via scripts

- **WHEN** a developer runs the project's test/lint scripts locally
- **THEN** they run the same checks the pipeline runs
