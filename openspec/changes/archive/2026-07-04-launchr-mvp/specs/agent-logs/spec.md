## ADDED Requirements

### Requirement: View agent logs

The system SHALL display the contents of an agent's configured `StandardOutPath` and `StandardErrorPath` files in a Logs view for the selected agent.

#### Scenario: Agent with configured log paths

- **WHEN** the user opens the Logs view for an agent that defines log paths
- **THEN** the current contents of those files are shown

#### Scenario: Agent without log paths

- **WHEN** the selected agent defines no `StandardOutPath` or `StandardErrorPath`
- **THEN** the Logs view explains that no log files are configured

#### Scenario: Log file missing

- **WHEN** a configured log path points to a file that does not exist yet
- **THEN** the Logs view indicates the file has not been created rather than erroring

### Requirement: Live tail with follow and pause

The system SHALL stream new lines appended to the agent's log files in real time while "follow" is active, and SHALL stop auto-scrolling and updating when the user pauses.

#### Scenario: Follow mode streams new output

- **WHEN** follow is active and the agent writes new lines to its log file
- **THEN** the new lines appear and the view auto-scrolls to the latest

#### Scenario: Pause halts streaming

- **WHEN** the user pauses
- **THEN** the view stops auto-scrolling and holds its position while the user reads

#### Scenario: Switching agents stops the previous tail

- **WHEN** the user selects a different agent
- **THEN** the tail on the previous agent's files stops and streaming begins for the newly selected agent

### Requirement: Correct text rendering

The system SHALL render log output as correct UTF-8 text, including multi-byte characters, and SHALL NOT drop or garble output when a multi-byte character straddles a read/poll boundary.

#### Scenario: Multi-byte characters render intact

- **WHEN** a log file contains multi-byte UTF-8 (e.g. box-drawing, accented letters, emoji)
- **THEN** those characters display correctly rather than as replacement/garbage glyphs

#### Scenario: Character split across a poll boundary is not lost

- **WHEN** a multi-byte character spans the boundary between two consecutive tail reads
- **THEN** the character is buffered and emitted whole, and no surrounding output is dropped
