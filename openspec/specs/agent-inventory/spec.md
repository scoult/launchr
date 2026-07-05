# agent-inventory Specification

## Purpose

Discover, group, and present launchd user agents with an accurate status model and human-readable schedules.

## Requirements

### Requirement: Discover user agents

The system SHALL discover all launchd user agents by reading `.plist` files from `~/Library/LaunchAgents` and merging each file's on-disk configuration with its live runtime state obtained from `launchctl`.

#### Scenario: List populated on launch

- **WHEN** the app starts and `~/Library/LaunchAgents` contains one or more `.plist` files
- **THEN** each valid agent appears in the sidebar with its label, availability chip, and health signal

#### Scenario: Empty agents directory

- **WHEN** `~/Library/LaunchAgents` is empty or absent
- **THEN** the sidebar shows an empty state inviting the user to create a job, and does not error

#### Scenario: Malformed plist is surfaced, not fatal

- **WHEN** a `.plist` file in the directory cannot be parsed
- **THEN** that entry is shown with a parse-error indicator and the remaining agents still load

### Requirement: Group agents as Mine vs System

The system SHALL group discovered agents into "Mine" (agents whose label appears in the app-owned manifest at `~/Library/Application Support/launchr/`) and "System" (all others). The System group SHALL be collapsed by default.

#### Scenario: launchr-created job appears under Mine

- **WHEN** an agent's label is present in the launchr manifest
- **THEN** it is listed under the "Mine" group

#### Scenario: Vendor agent appears under System

- **WHEN** an agent's label is not in the launchr manifest
- **THEN** it is listed under the "System" group, which is collapsed by default

### Requirement: Two-part status model

The system SHALL represent each agent's status as two independent facts: an availability chip (Loaded, Disabled, or Not loaded) and a health signal (idle, running now, or last-run failed). The system SHALL NOT collapse these into a single "running" indicator.

#### Scenario: Scheduled agent between runs

- **WHEN** an agent is loaded and enabled but has no current PID
- **THEN** it shows availability "Loaded" and health "idle" (not "running")

#### Scenario: Agent currently executing

- **WHEN** an agent has a live PID reported by `launchctl`
- **THEN** it shows health "running now"

#### Scenario: Agent whose last run failed

- **WHEN** an agent's last exit status reported by `launchctl` is non-zero
- **THEN** it shows a "last-run failed" health signal including the exit code

#### Scenario: Disabled agent

- **WHEN** an agent is disabled in its domain
- **THEN** it shows availability "Disabled" and is presented as unable to run

### Requirement: Human-readable schedule summary

The system SHALL present each agent's schedule in human terms. The sidebar SHALL show a terse summary; the detail Overview SHALL show the full schedule, rendering a calendar schedule as a small list of its entries rather than a generic label.

#### Scenario: Terse summary in the sidebar

- **WHEN** an agent runs on a multi-entry calendar schedule
- **THEN** the sidebar shows a short summary (e.g. "2 times daily") rather than an opaque "on schedule"

#### Scenario: Full schedule listed in the Overview

- **WHEN** the user views an agent whose `StartCalendarInterval` has entries at 09:30 and 11:30
- **THEN** the Overview lists both times (e.g. "09:30" and "11:30"), not a single generic "on schedule" line

#### Scenario: Interval schedule described

- **WHEN** an agent uses `StartInterval`
- **THEN** the summary describes the interval in human units (e.g. "every 30 min")

### Requirement: Live status auto-refresh

The system SHALL refresh agents' live runtime state (loaded/disabled, PID, last exit) automatically on an interval, updating the sidebar and the selected job's status without the user re-selecting or acting. The refresh SHALL read runtime state only (not re-parse plist files) and SHALL NOT disrupt an open editor.

#### Scenario: Status updates without re-selecting

- **WHEN** a job's runtime state changes (it starts running, returns to idle, or records a new exit status) while its detail is shown
- **THEN** the displayed availability/health updates within a few seconds without the user re-selecting the job

#### Scenario: Refresh does not disturb editing

- **WHEN** the auto-refresh runs while the job editor is open
- **THEN** the editor's contents and cursor are unaffected

### Requirement: Reveal and open files externally

The system SHALL let the user reveal a job's plist file in Finder and open the plist and its configured log files in the default application.

#### Scenario: Reveal plist in Finder

- **WHEN** the user chooses Reveal for a job
- **THEN** the job's `.plist` is revealed in Finder

#### Scenario: Open a log file

- **WHEN** the user chooses to open a job's stdout or stderr log and the path is configured
- **THEN** that log file opens in the default application

#### Scenario: Open failure is surfaced

- **WHEN** an open/reveal action fails
- **THEN** the error is shown to the user rather than failing silently
