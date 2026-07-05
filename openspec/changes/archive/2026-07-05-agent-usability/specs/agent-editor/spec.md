## ADDED Requirements

### Requirement: Recover and fix malformed plists

The system SHALL open an agent whose plist cannot be parsed rather than erroring,
presenting the raw file text so it can be edited and fixed. Opening the editor
for such a job SHALL start on the raw plist so the user can correct it; saving
remains gated by plist validity.

#### Scenario: Malformed plist still opens

- **WHEN** the user selects an agent whose plist is not valid
- **THEN** the job opens showing a parse-error indicator and its raw file text,
  rather than failing to open

#### Scenario: Fixing a malformed plist

- **WHEN** the user edits a parse-error job
- **THEN** the editor opens on the raw plist tab with the file's current text, and
  correcting the XML and saving writes a valid plist

### Requirement: Quoted-argument command parsing

The command entry field SHALL parse arguments with shell-style single and double
quotes so arguments containing spaces are preserved as single argv entries
(literal argv — no shell variable expansion). Displaying the arguments SHALL
re-quote entries that contain spaces so the field round-trips.

#### Scenario: Quoted argument stays one entry

- **WHEN** the user enters a command like `/bin/bash -lc "echo hi && date"`
- **THEN** the generated `ProgramArguments` are `/bin/bash`, `-lc`, and
  `echo hi && date` (three entries, the quoted part intact)

#### Scenario: Round-trips in the field

- **WHEN** a job's arguments include one containing spaces
- **THEN** the command field shows it quoted, and re-parsing that text yields the
  same arguments

### Requirement: Duplicate an existing agent

The system SHALL let the user duplicate an existing agent, opening the editor as a
new job pre-filled from the source job's configuration with a distinct label.

#### Scenario: Duplicate pre-fills a new job

- **WHEN** the user chooses Duplicate on a job
- **THEN** the editor opens in create mode pre-filled from that job with a
  modified label (e.g. suffixed `.copy`), and saving creates a new agent
