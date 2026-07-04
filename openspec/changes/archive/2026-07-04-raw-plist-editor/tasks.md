## 1. Dependencies + wrapper

- [x] 1.1 Add deps: `@uiw/react-codemirror`, `@codemirror/lang-xml`, `@codemirror/lint`
- [x] 1.2 Add a `CodeEditor` wrapper component: CodeMirror + `xml()` language + a dark theme matching the code surface; props `value`, `readOnly`, `onChange`; line numbers on
- [x] 1.3 Add an XML linter (CodeMirror `linter`) using `DOMParser` well-formedness check → diagnostics at the reported position (fallback to doc start)

## 2. Wire the surfaces

- [x] 2.1 `DetailPane` Raw plist tab: replace the `<pre>` with `CodeEditor` in read-only mode (highlight + line numbers)
- [x] 2.2 `JobEditor` Raw tab: replace the `<textarea>` with `CodeEditor` (editable) + the linter; keep `onChange` → `raw` state
- [x] 2.3 Reflect validity in the save flow: surface the inline diagnostic and keep Save blocked on invalid XML (Rust `save_job` remains the final guard)

## 3. Verify

- [x] 3.1 `pnpm build` clean
- [x] 3.2 Ran the app: viewer shows highlighted plist with line numbers and scrolls; editor highlights + numbers; malformed XML shows inline error and blocks save; fixing clears it. Confirmed by user.
