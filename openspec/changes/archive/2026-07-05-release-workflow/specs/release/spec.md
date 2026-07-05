## ADDED Requirements

### Requirement: Tag-triggered release build

The project SHALL provide a GitHub Actions workflow that runs when a version tag
matching `v*` is pushed, builds the macOS app, and publishes a GitHub Release for
that tag. The build SHALL run on a macOS runner.

#### Scenario: Pushing a version tag creates a release

- **WHEN** a tag like `v0.1.0` is pushed to the repository
- **THEN** the workflow builds the app and creates a GitHub Release associated
  with that tag

#### Scenario: No release on normal pushes

- **WHEN** a commit is pushed without a matching version tag
- **THEN** the release workflow does not run

### Requirement: Downloadable installable artifact

The release SHALL attach an installable macOS artifact (a `.dmg`), not a bare
`.app` directory, so it can be downloaded and installed.

#### Scenario: Release has a .dmg asset

- **WHEN** the release workflow completes
- **THEN** the created release includes a `.dmg` asset for download

### Requirement: Unsigned build is documented

Because the build is unsigned, the project SHALL document the macOS first-launch
workaround where users obtain the download (README and release notes). The
documented method MUST be one that actually clears the download quarantine —
`xattr -dr com.apple.quarantine /Applications/launchr.app` — because on Apple
Silicon an unsigned download shows "is damaged … Move to Bin" with no Open
option, so a right-click → Open instruction does not work and MUST NOT be
presented as the fix.

#### Scenario: Install instructions are available and effective

- **WHEN** a user downloads an unsigned release build and hits the "damaged"
  Gatekeeper message
- **THEN** the release notes and README lead with the quarantine-clearing command
  that opens the app, and set the expectation that "damaged" is normal for an
  unsigned download

### Requirement: Reviewable release

The workflow SHALL create the release as a draft so a maintainer can review and
publish it, rather than publishing automatically.

#### Scenario: Release starts as a draft

- **WHEN** the release workflow finishes
- **THEN** the release exists in draft state until a maintainer publishes it
