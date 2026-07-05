# agent-editor Specification

## Purpose

Create and edit launchd user agents through a guided form with schedule presets, and a raw plist editor/viewer with syntax highlighting, line numbers, and inline XML validation, backed by faithful plist serialization.

## Requirements

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

### Requirement: Raw plist syntax highlighting

The raw plist SHALL be shown with XML syntax highlighting in both the editable Raw tab and the read-only Raw plist viewer, themed to match the app's code surface.

#### Scenario: Highlighted in the editor

- **WHEN** the user opens the Raw tab in the editor
- **THEN** the plist XML is shown with syntax highlighting and remains editable

#### Scenario: Highlighted in the viewer

- **WHEN** the user opens the Raw plist tab in the detail view
- **THEN** the plist XML is shown with syntax highlighting and is read-only

### Requirement: Line numbers

The raw plist SHALL display line numbers in a gutter in both the editor and the viewer.

#### Scenario: Gutter shows line numbers

- **WHEN** the raw plist is shown in either the editor or viewer
- **THEN** a line-number gutter is displayed alongside the content

### Requirement: Inline XML validation

The raw plist editor SHALL validate XML well-formedness and indicate errors inline (an underline and/or gutter marker at the offending location), in addition to blocking save on invalid input.

#### Scenario: Malformed XML flagged inline

- **WHEN** the user edits the raw plist into malformed XML
- **THEN** the error is indicated inline near the offending line, and saving remains blocked

#### Scenario: Valid XML shows no errors

- **WHEN** the raw plist is well-formed XML
- **THEN** no validation errors are shown and saving is allowed

### Requirement: Recover and fix malformed plists

The system SHALL open an agent whose plist cannot be parsed rather than erroring, presenting the raw file text so it can be edited and fixed. Opening the editor for such a job SHALL start on the raw plist so the user can correct it; saving remains gated by plist validity.

#### Scenario: Malformed plist still opens

- **WHEN** the user selects an agent whose plist is not valid
- **THEN** the job opens showing a parse-error indicator and its raw file text, rather than failing to open

#### Scenario: Fixing a malformed plist

- **WHEN** the user edits a parse-error job
- **THEN** the editor opens on the raw plist tab with the file's current text, and correcting the XML and saving writes a valid plist

### Requirement: Quoted-argument command parsing

The command entry field SHALL parse arguments with shell-style single and double quotes so arguments containing spaces are preserved as single argv entries (literal argv — no shell variable expansion). Displaying the arguments SHALL re-quote entries that contain spaces so the field round-trips.

#### Scenario: Quoted argument stays one entry

- **WHEN** the user enters a command like `/bin/bash -lc "echo hi && date"`
- **THEN** the generated `ProgramArguments` are `/bin/bash`, `-lc`, and `echo hi && date` (three entries, the quoted part intact)

#### Scenario: Round-trips in the field

- **WHEN** a job's arguments include one containing spaces
- **THEN** the command field shows it quoted, and re-parsing that text yields the same arguments

### Requirement: Duplicate an existing agent

The system SHALL let the user duplicate an existing agent, opening the editor as a new job pre-filled from the source job's configuration with a distinct label.

#### Scenario: Duplicate pre-fills a new job

- **WHEN** the user chooses Duplicate on a job
- **THEN** the editor opens in create mode pre-filled from that job with a modified label (e.g. suffixed `.copy`), and saving creates a new agent
