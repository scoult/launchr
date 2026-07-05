## Context

CI exists (`.github/workflows/ci.yml`) but nothing publishes downloadable builds.
`tauri build` already produces a `.dmg` in `src-tauri/target/release/bundle/`. The
app is unsigned; `macos-latest` runners are Apple Silicon (arm64). Decisions:
unsigned, tag-automated via `tauri-apps/tauri-action`, arm64-only, draft release.

## Goals / Non-Goals

**Goals:** one-command release (push a tag) that publishes a downloadable `.dmg`
to a GitHub Release; clear unsigned-install docs.

**Non-Goals:** signing/notarization, universal (Intel) builds, auto-update,
auto-publishing (drafts only).

## Decisions

### tauri-action on tag push
`.github/workflows/release.yml`, `on: push: tags: ["v*"]`, single `macos-latest`
job. Reuse `ci.yml`'s setup: `actions/checkout` → `pnpm/action-setup` →
`actions/setup-node` (`node-version-file: .nvmrc`, `cache: pnpm`) → `pnpm install
--frozen-lockfile` → `Swatinem/rust-cache` (`workspaces: src-tauri`) →
`tauri-apps/tauri-action@v0`. *Why tauri-action:* it runs `tauri build`, finds
the bundle, and creates/uploads the release in one step — purpose-built for this.

### Release shape
tauri-action inputs: `tagName: ${{ github.ref_name }}`, `releaseName: "launchr
${{ github.ref_name }}"`, `releaseDraft: true`, `prerelease: false`, and a
`releaseBody` carrying the unsigned-install note. `env.GITHUB_TOKEN:
${{ secrets.GITHUB_TOKEN }}` with job `permissions: contents: write`. No `args`
→ arm64 default. tauri-action runs `beforeBuildCommand` (`pnpm build`) during
`tauri build`; the explicit `pnpm install` provides `node_modules`.

### Unsigned, documented not solved
Ship unsigned; the release body + README explain right-click → Open or
`xattr -dr com.apple.quarantine /Applications/launchr.app`. Upgrade path:
add Developer ID cert + notarization secrets to the same tauri-action step.

### Version/tag discipline
The bundle filename uses `tauri.conf.json` `version` (e.g.
`launchr_0.1.0_aarch64.dmg`); the runbook says bump `package.json` +
`tauri.conf.json` to match the tag before pushing it.

## Risks / Trade-offs

- **Gatekeeper friction (unsigned)** → documented; acceptable for now.
- **arm64-only** → no Intel Macs; switch later via `args: --target
  universal-apple-darwin` (+ add the rust target).
- **Can't fully verify headlessly** → the real run needs a tag pushed to GitHub;
  locally we only confirm `tauri build` yields the `.dmg` and the YAML is valid.
- **Tag/version drift** → mitigated by the runbook step; a stale version just
  mislabels the asset, not a build failure.
