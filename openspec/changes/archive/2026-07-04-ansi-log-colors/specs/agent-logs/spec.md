## ADDED Requirements

### Requirement: ANSI color rendering

The log view SHALL interpret ANSI SGR escape sequences (`ESC[…m`) and render them as styled text — the 8 standard and 8 bright foreground colors, bold, and reset. Color/style state SHALL persist across line boundaries until reset. Escape sequences that are unsupported, malformed, or incompletely received SHALL NOT be displayed as raw text.

#### Scenario: Colored output renders in color

- **WHEN** a log line contains an SGR color sequence (e.g. green text)
- **THEN** the affected text is shown in that color, and the escape codes themselves are not visible

#### Scenario: Color spans multiple lines

- **WHEN** a program sets a color and then emits several newlines before resetting
- **THEN** each of those lines is rendered in the active color, not just the first

#### Scenario: Sequence split across a read boundary

- **WHEN** an escape sequence is split between two tail reads
- **THEN** it is buffered until complete and rendered correctly, with no raw code shown

#### Scenario: Unsupported code is stripped

- **WHEN** the output contains an unsupported or malformed escape sequence
- **THEN** the sequence is removed rather than shown as literal text, and surrounding output renders normally
