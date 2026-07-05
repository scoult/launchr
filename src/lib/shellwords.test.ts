import assert from "node:assert";
import { joinArgs, splitArgs } from "./shellwords.ts";

// Basic whitespace split.
assert.deepEqual(splitArgs("/bin/echo hi there"), ["/bin/echo", "hi", "there"]);

// Double-quoted arg with spaces stays one token.
assert.deepEqual(splitArgs('/bin/bash -lc "echo hi && date"'), [
  "/bin/bash",
  "-lc",
  "echo hi && date",
]);

// Single quotes.
assert.deepEqual(splitArgs("a 'b c' d"), ["a", "b c", "d"]);

// Empty / whitespace-only.
assert.deepEqual(splitArgs("   "), []);

// Escaped quote inside double quotes.
assert.deepEqual(splitArgs('say "a \\"b\\" c"'), ["say", 'a "b" c']);

// Round-trip: split → join → split is stable.
for (const s of [
  '/bin/bash -lc "echo hi && date"',
  "a 'b c' d",
  '/usr/bin/say "he said \\"hi\\""',
]) {
  const once = splitArgs(s);
  assert.deepEqual(splitArgs(joinArgs(once)), once, `round-trip: ${s}`);
}

// join quotes args with spaces.
assert.equal(joinArgs(["/bin/x", "a b"]), "/bin/x 'a b'");

console.log("shellwords: all assertions passed");
