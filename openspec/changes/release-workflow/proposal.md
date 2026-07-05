## Why

launchr has CI for checks but no way to ship a build people can download. Users
need an installable macOS artifact from the repo. A tag-triggered GitHub Actions
release workflow builds the app and publishes it to a GitHub Release.

## What Changes

- Add a **release workflow** (`.github/workflows/release.yml`) triggered on
  version tags (`v*`), running on macOS, that uses `tauri-apps/tauri-action` to
  build the app and create a **GitHub Release** with the `.dmg` attached.
- **Unsigned** build for now — the release notes document the macOS Gatekeeper
  first-launch workaround (right-click → Open / clear the quarantine attribute).
- **Apple Silicon only** (arm64, the `macos-latest` default).
- Release is created as a **draft** for human review before publishing.
- **README** gains a Download/Install section (with the unsigned-install note)
  and a short Releasing runbook.

Out of scope: code signing + notarization (documented as the upgrade path),
universal (Intel) builds, auto-update, and marking releases non-draft.

## Capabilities

### New Capabilities
- `release`: Publish downloadable macOS builds to GitHub Releases via a
  tag-triggered CI workflow.

### Modified Capabilities
<!-- None. -->

## Impact

- **New:** `.github/workflows/release.yml`.
- **Edited:** `README.md` (Download/Install + Releasing sections).
- **No app/runtime change.** Reuses the pnpm/node/rust-cache setup from
  `ci.yml`; no new local dependency.
- **Secrets:** none beyond the default `GITHUB_TOKEN` (unsigned build).
- **Follow-up (manual):** push a `vX.Y.Z` tag to cut the first release; keep the
  tag in sync with the `version` in `package.json` / `tauri.conf.json`.
