## ADDED Requirements

### Requirement: Working directory field

The guided form SHALL let the user view and set the agent's working directory (`WorkingDirectory`), so a command that depends on its working directory (e.g. `docker-compose`, which reads a compose file relative to the current directory) runs in the correct location. An empty value SHALL omit the key.

#### Scenario: Set a working directory

- **WHEN** the user enters a path in the working directory field and saves
- **THEN** the generated plist contains a `WorkingDirectory` key with that path

#### Scenario: Empty working directory omits the key

- **WHEN** the working directory field is left blank and the user saves
- **THEN** the generated plist has no `WorkingDirectory` key

## MODIFIED Requirements

### Requirement: Plist read and write fidelity

The system SHALL read and write plist files using a structured plist serializer (not string templating), correctly handling XML and binary plist input and producing valid plist output. When saving edits made through the guided form, the system SHALL preserve keys present in the original plist that the form does not model (for example `WorkingDirectory`, `ProcessType`, `Nice`), rather than regenerating the plist from only the modeled fields. Clearing a field the form does model SHALL still remove that key.

#### Scenario: Round-trip a binary plist

- **WHEN** the user opens an agent whose plist is in binary format and saves it
- **THEN** the system parses it correctly and writes a valid plist without corrupting values

#### Scenario: Unmodeled keys survive a form save

- **WHEN** the user edits an agent whose plist contains keys the guided form does not model (e.g. `ProcessType`) and saves from the form
- **THEN** those keys remain present in the written plist

#### Scenario: Clearing a modeled field removes its key

- **WHEN** the user clears a field the form models (e.g. deletes the stdout log path) and saves
- **THEN** the corresponding key is removed from the written plist

### Requirement: Duplicate an existing agent

The system SHALL let the user duplicate an existing agent, opening the editor as a new job pre-filled from the source job's configuration with a distinct label. The duplicate SHALL preserve keys present in the source plist that the guided form does not model.

#### Scenario: Duplicate pre-fills a new job

- **WHEN** the user chooses Duplicate on a job
- **THEN** the editor opens in create mode pre-filled from that job with a modified label (e.g. suffixed `.copy`), and saving creates a new agent

#### Scenario: Duplicate preserves unmodeled keys

- **WHEN** the user duplicates an agent whose plist has a key the form does not model (e.g. `WorkingDirectory`) and saves
- **THEN** the new agent's plist retains that key with its original value
