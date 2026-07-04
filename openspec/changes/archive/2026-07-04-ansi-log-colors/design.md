## Context

`LogsView` receives log text via `log-line` events from the Rust tail and renders each line as plain text. Program output often contains ANSI SGR escape codes, which currently render as literal junk. The Rust tail already streams raw bytes (with a UTF-8 leftover-byte buffer); ANSI is ASCII, so this is a frontend-only concern. The palette is token-based (light/dark), and the log pane is a dark code surface in both themes.

## Goals / Non-Goals

**Goals:**
- Render standard + bright foreground colors, bold, and reset.
- Persist color state across lines; handle sequences split across chunks.
- Never show raw or malformed codes.

**Non-Goals:**
- Background colors, 256-color / truecolor, non-SGR escapes (cursor moves, clears).
- A user setting to toggle coloring.
- Backend changes.

## Decisions

### Hand-rolled SGR parser, no dependency
A small parser scans text for `ESC[` … `m`, splitting it into runs of `{ text, style }` where style = `{ color?, bold? }`. Only SGR (`m`-terminated) is interpreted; other escapes are consumed and dropped. *Why:* the supported set is tiny (~16 colors + bold + reset); a dep (`anser`/`ansi-to-html`) is unwarranted per the project's lazy-first rule. *Alternative:* `anser` — rejected, not worth the dependency.

### State is threaded, not per-line
The parser carries the active style forward across lines (SGR state persists until reset `0`). Since `LogsView` holds an array of line strings, we either (a) parse the full buffer into styled segments and re-split on newlines keeping carried style, or (b) keep a running "current style" as new chunks arrive and store styled segments per line. We take (a)-style threading: maintain current style across the incoming stream so multi-line colored blocks render correctly.

### Partial escape sequences are buffered
A sequence can split across a tail poll (e.g. chunk ends `\x1b[3`, next starts `2m`). The parser holds an incomplete trailing escape (from the last `ESC` with no terminator yet) and prepends it to the next chunk — the same leftover-buffer idea used for UTF-8 in the Rust tail, now for escapes on the JS side.

### Colors map to the token palette
The 16 ANSI colors map to CSS values that read well on the dark code surface (bright variants for the standard slots, since the surface is dark). Rendered as inline `color` styles or utility classes on `<span>`s within each log line.

## Risks / Trade-offs

- **Escape sequence split across chunks** → buffer the incomplete trailing escape; unit-test with a sequence broken mid-code.
- **Performance on high-volume logs** → parsing is linear per chunk and only over appended text; fine for tail volumes. If it ever bites, cap retained lines (already a `Clear` control exists).
- **Unsupported escapes leaking through** → default path strips any `ESC[...<final-byte>` we don't handle, so nothing raw reaches the DOM.
