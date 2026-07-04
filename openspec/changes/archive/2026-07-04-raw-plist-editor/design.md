## Context

Two raw plist surfaces exist: JobEditor's Raw tab (editable `<textarea>`) and DetailPane's Raw plist tab (read-only `<pre>`). Both are plain text. The user wants highlighting on both, line numbers, and inline XML validation. CodeMirror 6 was chosen (over a Prism-based or hand-rolled approach) because it provides highlighting, a line-number gutter, and a lint gutter in one well-maintained library, uniformly for editable and read-only modes.

## Goals / Non-Goals

**Goals:**
- XML highlighting + line numbers on both surfaces.
- Inline well-formedness validation in the editor; save still blocked on invalid.
- Theme matches the app's dark code surface.

**Non-Goals:**
- plist *schema* validation (valid launchd keys/types) — well-formedness only.
- Autocomplete, folding, search UI.
- Backend changes.

## Decisions

### One `CodeEditor` wrapper, two modes
A single component wraps `@uiw/react-codemirror` with the `xml()` language and a fixed dark theme, taking `value`, `readOnly`, and `onChange`. The editor uses it read-write; the viewer uses it with `readOnly` + `editable={false}`. Line numbers are on by default in CodeMirror (basic setup). *Why:* one component keeps the two surfaces visually identical and the config in one place.

### Validation via a CodeMirror linter using the browser XML parser
A `linter` extension runs `new DOMParser().parseFromString(text, "application/xml")` and checks for a `<parsererror>` node; on error it emits a diagnostic at the reported position (best-effort line/col, fall back to the document start). This drives the inline underline + gutter marker. The editor also lifts a boolean "is valid" up so the surrounding save flow can block. *Why:* DOMParser is native (no parser dep), and CodeMirror's lint gutter renders the diagnostic. *Trade-off:* DOMParser error position granularity varies by engine; we place the marker as precisely as the parser reports, else at the top.

### Save flow keeps the Rust guard
Client validation is UX; `save_job` in Rust still parses and rejects invalid plists as the authoritative guard. The editor disables Save (or surfaces the diagnostic) when the linter reports errors, but the backend remains the final word. *Why:* defense in depth; never rely on the client for correctness.

### Dependency footprint
Add `@uiw/react-codemirror`, `@codemirror/lang-xml`, `@codemirror/lint`. These pull `@codemirror/*` cores transitively. Acceptable for a desktop app; this is the deliberate trade for not hand-rolling an editor.

## Risks / Trade-offs

- **Bundle size grows** (CodeMirror cores) → acceptable for a Tauri desktop app; not a web load-budget context. Import only the extensions used.
- **DOMParser error localization is imprecise** → place the diagnostic where reported, otherwise at document start; the message still tells the user what's wrong. Well-formedness (not schema) keeps this tractable.
- **Theming drift vs the app tokens** → CodeMirror themes use their own config, not Tailwind tokens; pin a dark theme that matches the `--code`/`--code-fg` surface so it reads consistently. Verify in light and dark app appearance (the code surface is dark in both).
- **Controlled-value churn** → feed CodeMirror the current raw string and treat its `onChange` as the source of truth for the editor (as the textarea was), to avoid cursor jumps.
