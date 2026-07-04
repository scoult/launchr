## Why

The raw plist surfaces are plain text today: the editor tab is a bare `<textarea>` and the detail viewer is a `<pre>`. For hand-editing XML that's hard to read and error-prone — no color, no line references, and errors only surface as an opaque parse failure on save. Syntax highlighting, line numbers, and inline validation make the raw plist genuinely usable for power edits.

## What Changes

- **Syntax-highlighted XML** in both the raw plist **editor** (JobEditor's Raw tab) and the read-only **viewer** (DetailPane's Raw plist tab), using CodeMirror 6 for both.
- **Line numbers** in the gutter of both surfaces.
- **Inline XML validation** in the editor: well-formedness errors are shown as an inline underline + gutter marker at the offending line, not just a message on save. Save remains blocked on invalid plist (existing behavior, now with in-place feedback).
- The read-only viewer is a CodeMirror instance in read-only mode (highlighting + line numbers, not editable).
- CodeMirror is themed to match the app's dark code surface.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `agent-editor`: The raw plist editor and viewer gain syntax highlighting, line numbers, and inline XML validation.

## Impact

- **New dependencies:** `@uiw/react-codemirror`, `@codemirror/lang-xml`, `@codemirror/lint` (+ their transitive `@codemirror/*` cores).
- **Files:** a small `CodeEditor`/`PlistView` wrapper component; `JobEditor.tsx` (Raw tab → editor) and `DetailPane.tsx` (Raw plist tab → viewer).
- **No backend change** — validation is client-side (XML well-formedness via the browser parser / a CodeMirror linter); the Rust `save_job` already rejects invalid plists as the final guard.
- **Out of scope:** full plist *schema* validation (valid launchd keys/types), plist autocomplete, and folding.
