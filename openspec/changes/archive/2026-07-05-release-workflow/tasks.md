## 1. Release workflow

- [x] 1.1 Add `.github/workflows/release.yml`: trigger `on: push: tags: ["v*"]`; single `macos-latest` job; `permissions: contents: write`
- [x] 1.2 Setup steps (reuse `ci.yml` versions): checkout → `pnpm/action-setup` → `actions/setup-node` (`node-version-file: .nvmrc`, `cache: pnpm`) → `pnpm install --frozen-lockfile` → `Swatinem/rust-cache` (`workspaces: src-tauri`)
- [x] 1.3 `tauri-apps/tauri-action@v0` step: `env.GITHUB_TOKEN`; inputs `tagName`/`releaseName` from `github.ref_name`, `releaseDraft: true`, `prerelease: false`, `releaseBody` with the unsigned-install note; no `args` (arm64)

## 2. Docs

- [x] 2.1 README **Download / Install**: link to Releases + unsigned first-launch steps (right-click → Open, or `xattr -dr com.apple.quarantine /Applications/launchr.app`)
- [x] 2.2 README **Releasing** runbook: bump `version` in `package.json` + `src-tauri/tauri.conf.json`, then `git tag vX.Y.Z && git push origin vX.Y.Z`; publish the draft release

## 3. Verify

- [x] 3.1 Validate `release.yml` (YAML parses); confirm `pnpm tauri build --bundles dmg` produces `src-tauri/target/release/bundle/dmg/*.dmg`
- [ ] 3.2 End-to-end (requires remote): push `v0.1.0` → workflow runs → a draft Release appears with the `.dmg` → download, clear quarantine, confirm it launches

## 4. Fix install docs (Gatekeeper "damaged")

- [x] 4.1 README **Download / Install**: lead with `xattr -dr com.apple.quarantine /Applications/launchr.app`; state the "is damaged … Move to Bin" message is expected for an unsigned download; remove the non-working right-click → Open step
- [x] 4.2 `.github/workflows/release.yml` `releaseBody`: same correction (xattr as the method; drop right-click → Open)
