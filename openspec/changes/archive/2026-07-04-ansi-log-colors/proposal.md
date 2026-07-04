## Why

Many CLI programs emit ANSI SGR escape codes to color their output. launchr's log viewer renders raw bytes, so those codes show as literal junk (e.g. `←[32m`) instead of coloring the text — the log becomes harder to read, not easier. Rendering the colors makes tailed output look the way the program intended.

## What Changes

- The Logs view **interprets ANSI SGR escape sequences** (`ESC[...m`) and renders them as colored/styled text: the 8 standard + 8 bright foreground colors, bold, and reset. Background colors and 256/truecolor are out of scope for v1 (rendered as their nearest effect or ignored, never shown as raw codes).
- **Color state persists across lines** — the tail splits output on newlines, but SGR state legitimately spans lines until reset, so the parser threads state through the rendered line sequence.
- **Partial/split escape sequences are handled** — a sequence split across a tail poll boundary is buffered until complete, never emitted as raw text (mirrors the UTF-8 leftover-byte handling already in the tail).
- **Unsupported or malformed codes are stripped**, never displayed raw.
- Colors map onto the app's palette so they read correctly on the dark code surface in both light and dark themes.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `agent-logs`: Adds ANSI SGR color rendering to the log view (a new requirement alongside the existing "Correct text rendering").

## Impact

- **Files:** `src/components/LogsView.tsx` (parse + render), plus a small ANSI parser helper (new `src/lib/ansi.ts` or inline).
- **No new dependency** — a hand-rolled SGR parser (~50 lines) covers the supported set.
- **No backend change** — the Rust tail already streams raw bytes including escape codes; all interpretation is frontend.
- **Out of scope:** background colors, 256-color/truecolor, cursor-movement/other non-SGR escapes, and a settings toggle to disable coloring.
