## ADDED Requirements

### Requirement: Live status auto-refresh

The system SHALL refresh agents' live runtime state (loaded/disabled, PID, last
exit) automatically on an interval, updating the sidebar and the selected job's
status without the user re-selecting or acting. The refresh SHALL read runtime
state only (not re-parse plist files) and SHALL NOT disrupt an open editor.

#### Scenario: Status updates without re-selecting

- **WHEN** a job's runtime state changes (it starts running, returns to idle, or
  records a new exit status) while its detail is shown
- **THEN** the displayed availability/health updates within a few seconds without
  the user re-selecting the job

#### Scenario: Refresh does not disturb editing

- **WHEN** the auto-refresh runs while the job editor is open
- **THEN** the editor's contents and cursor are unaffected

### Requirement: Reveal and open files externally

The system SHALL let the user reveal a job's plist file in Finder and open the
plist and its configured log files in the default application.

#### Scenario: Reveal plist in Finder

- **WHEN** the user chooses Reveal for a job
- **THEN** the job's `.plist` is revealed in Finder

#### Scenario: Open a log file

- **WHEN** the user chooses to open a job's stdout or stderr log and the path is
  configured
- **THEN** that log file opens in the default application

#### Scenario: Open failure is surfaced

- **WHEN** an open/reveal action fails
- **THEN** the error is shown to the user rather than failing silently
