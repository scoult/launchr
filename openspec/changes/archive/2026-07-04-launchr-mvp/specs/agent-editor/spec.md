## ADDED Requirements

### Requirement: Create a new agent

The system SHALL let the user create a new user agent through a guided form, generating a valid `.plist` file in `~/Library/LaunchAgents` and recording the new label in the launchr manifest so it is grouped under "Mine".

#### Scenario: Create via guided form

- **WHEN** the user fills the form (name/label, command, schedule) and saves
- **THEN** the system writes a valid plist to `~/Library/LaunchAgents/<label>.plist` and adds the label to the manifest

#### Scenario: Duplicate label rejected

- **WHEN** the user tries to create an agent whose label matches an existing agent
- **THEN** the system prevents the save and explains the conflict

### Requirement: Edit an existing agent

The system SHALL let the user edit an existing agent's configuration via the same guided form, writing changes back to its plist file.

#### Scenario: Edit and save

- **WHEN** the user changes fields on an existing agent and saves
- **THEN** the system writes the updated plist to disk preserving the label

### Requirement: Guided form with raw plist toggle

The system SHALL present editing as a guided form by default with a toggle to view and edit the raw plist XML. The form SHALL use plain vocabulary (e.g. Name, Command, Run at login) with the corresponding launchd key shown secondarily (e.g. Label, ProgramArguments, RunAtLoad).

#### Scenario: Toggle to raw view

- **WHEN** the user switches to the Raw plist tab
- **THEN** the current form values are reflected as valid plist XML that the user can edit directly

#### Scenario: Invalid raw plist blocked

- **WHEN** the user edits the raw plist into invalid XML/plist and attempts to save
- **THEN** the system blocks the save and reports the parse error

### Requirement: Schedule presets with advanced options

The system SHALL offer common schedule presets — at login (`RunAtLoad`), every N minutes (`StartInterval`), at one or more times of day (`StartCalendarInterval`), and when a folder changes (`WatchPaths`) — plus an Advanced section exposing full calendar intervals (including weekday/day/month constraints) and watch paths. The times-of-day preset SHALL let the user add and remove multiple time entries; per-time weekday/day/month constraints live in the Advanced section.

#### Scenario: Choose an interval preset

- **WHEN** the user selects "every N minutes" and enters a value
- **THEN** the generated plist contains a `StartInterval` key with that value in seconds

#### Scenario: Add a single time of day

- **WHEN** the user selects the times preset and picks one time
- **THEN** the generated plist contains a `StartCalendarInterval` with the corresponding hour and minute

#### Scenario: Add multiple times of day

- **WHEN** the user adds two or more times in the times preset (e.g. 09:30 and 11:30)
- **THEN** the generated plist contains a `StartCalendarInterval` array with one entry per time

#### Scenario: Editing a multi-entry job preserves all entries

- **WHEN** the user opens an agent that already has multiple `StartCalendarInterval` entries and edits an unrelated field
- **THEN** all existing calendar entries are preserved; the UI never silently drops entries it did not display

#### Scenario: Advanced calendar entry

- **WHEN** the user adds calendar entries with weekday/day/month constraints in the Advanced section
- **THEN** the generated plist contains a `StartCalendarInterval` array with each full entry

### Requirement: Plist read and write fidelity

The system SHALL read and write plist files using a structured plist serializer (not string templating), correctly handling XML and binary plist input and producing valid plist output.

#### Scenario: Round-trip a binary plist

- **WHEN** the user opens an agent whose plist is in binary format and saves it
- **THEN** the system parses it correctly and writes a valid plist without corrupting values
