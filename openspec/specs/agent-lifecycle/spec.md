# agent-lifecycle Specification

## Purpose

Control launchd user agents — load, unload, enable, disable, run, and delete — with reliable outcome reporting.

## Requirements

### Requirement: Load and unload an agent

The system SHALL load an agent into the user's `gui/<uid>` domain using `launchctl bootstrap` and unload it using `launchctl bootout`, targeting the agent's plist path and label respectively.

#### Scenario: Load an unloaded agent

- **WHEN** the user chooses Load on an agent that is not loaded
- **THEN** the system runs `launchctl bootstrap gui/<uid> <plist-path>` and the agent's availability updates to "Loaded"

#### Scenario: Unload a loaded agent

- **WHEN** the user chooses Unload on a loaded agent
- **THEN** the system runs `launchctl bootout gui/<uid>/<label>` and the agent's availability updates to "Not loaded"

### Requirement: Enable and disable an agent

The system SHALL enable and disable an agent in its domain using `launchctl enable` and `launchctl disable`.

#### Scenario: Disable an enabled agent

- **WHEN** the user chooses Disable
- **THEN** the system runs `launchctl disable gui/<uid>/<label>` and the availability chip shows "Disabled"

#### Scenario: Enable a disabled agent

- **WHEN** the user chooses Enable
- **THEN** the system runs `launchctl enable gui/<uid>/<label>` and the availability chip no longer shows "Disabled"

### Requirement: Run now / restart an agent

The system SHALL start or restart an agent immediately using `launchctl kickstart -k gui/<uid>/<label>`.

#### Scenario: Run now

- **WHEN** the user chooses Run now
- **THEN** the system runs `launchctl kickstart -k gui/<uid>/<label>` and the health signal reflects the new run

### Requirement: Report control success and failure

The system SHALL report the outcome of every control action, surfacing `launchctl` failures (non-zero exit or stderr) to the user rather than silently ignoring them.

#### Scenario: Control command fails

- **WHEN** a `launchctl` control command exits non-zero
- **THEN** the system shows an error to the user including the command's stderr, and the displayed state is not falsely updated to the intended state

### Requirement: Delete an agent

The system SHALL let the user delete an agent: unload it (best-effort `bootout`), remove its plist file, and remove it from the launchr manifest. The action SHALL require a confirmation, and that confirmation MUST use an in-app dialog — not the DOM `window.confirm`, which is a non-functional no-op in the Tauri webview.

#### Scenario: Confirmed delete removes the agent

- **WHEN** the user chooses Delete and confirms
- **THEN** the system unloads the agent, removes `~/Library/LaunchAgents/<label>.plist`, removes the label from the manifest, and the agent disappears from the list

#### Scenario: Cancelled delete is a no-op

- **WHEN** the user chooses Delete and cancels the confirmation
- **THEN** nothing is removed and the agent remains unchanged

#### Scenario: Confirmation actually appears

- **WHEN** the user clicks Delete
- **THEN** a working confirmation prompt is shown (an in-app dialog), rather than the click silently doing nothing
