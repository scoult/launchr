## ADDED Requirements

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
