import assert from "node:assert";
import { chunkToLines, emptyCarry, parseAnsi } from "./ansi.ts";

// 1. A colored run + reset, codes not visible in output text.
{
  const { segments } = parseAnsi("\x1b[32mgreen\x1b[0m done", emptyCarry());
  assert.equal(segments.map((s) => s.text).join(""), "green done");
  assert.equal(segments[0].color, "#4ade80");
  assert.equal(segments[1].color, undefined);
}

// 2. Bold.
{
  const { segments } = parseAnsi("\x1b[1mB", emptyCarry());
  assert.equal(segments[0].bold, true);
}

// 3. Color carried across a newline (state persists across lines).
{
  const { lines } = chunkToLines("\x1b[31mone\ntwo\x1b[0m", emptyCarry());
  assert.equal(lines.length, 2);
  assert.equal(lines[0][0].color, "#f87171");
  assert.equal(lines[1][0].color, "#f87171"); // still red on line 2
  assert.equal(lines[1][0].text, "two");
}

// 4. Sequence split mid-code across two calls → buffered, then applied.
{
  const a = parseAnsi("pre\x1b[3", emptyCarry());
  assert.equal(a.segments.map((s) => s.text).join(""), "pre");
  assert.equal(a.carry.pending, "\x1b[3");
  const b = parseAnsi("2mgreen", a.carry);
  assert.equal(b.segments.map((s) => s.text).join(""), "green");
  assert.equal(b.segments[0].color, "#4ade80");
}

// 5. Unsupported/malformed CSI is stripped, surrounding text kept.
{
  const { segments } = parseAnsi("a\x1b[?25lb", emptyCarry()); // hide-cursor, non-SGR
  assert.equal(segments.map((s) => s.text).join(""), "ab");
}

// 6. Color state carries across chunks (carry threaded).
{
  const a = parseAnsi("\x1b[34m", emptyCarry());
  const b = parseAnsi("blue", a.carry);
  assert.equal(b.segments[0].color, "#60a5fa");
}

console.log("ansi: all assertions passed");
