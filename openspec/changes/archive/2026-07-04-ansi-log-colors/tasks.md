## 1. Parser

- [x] 1.1 Add `src/lib/ansi.ts`: a `parseAnsi(text, carryState)` that returns styled segments `{ text, color?, bold? }[]` plus the trailing `carryState` (active style + any incomplete escape) to thread into the next call
- [x] 1.2 Support SGR: reset (`0`), bold (`1`), standard fg (`30–37`), bright fg (`90–97`); consume-and-drop any other `ESC[…<final>` sequence
- [x] 1.3 Map the 16 color codes to CSS values that read on the dark code surface (bright-leaning), returned per segment

## 2. Wire into LogsView

- [x] 2.1 Thread parser state across the incoming stream so color persists across lines (not reset per line)
- [x] 2.2 Render each line's segments as `<span style={{color, fontWeight}}>`; keep the follow/pause/clear behavior unchanged
- [x] 2.3 Buffer an incomplete trailing escape across `log-line` events (mirror the UTF-8 leftover-byte handling)

## 3. Verify

- [x] 3.1 Unit test `parseAnsi`: colored run, reset, bold, color carried across a newline, and a sequence split mid-code across two calls
- [x] 3.2 `pnpm build` clean; ran a job emitting ANSI and confirmed colors render with no raw codes, correct on the code surface. Confirmed by user.
