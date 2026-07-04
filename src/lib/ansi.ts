// Minimal ANSI SGR parser for the log viewer. Interprets the 8 standard + 8
// bright foreground colors, bold, and reset. State is threaded across calls so
// color persists across lines, and an incomplete trailing escape is buffered
// (carry.pending) so a sequence split across tail reads renders whole.
// Non-SGR / unsupported escapes are consumed and dropped, never shown raw.

export interface Segment {
  text: string;
  color?: string;
  bold?: boolean;
}

interface Style {
  color?: string;
  bold?: boolean;
}

export interface AnsiCarry {
  style: Style;
  pending: string;
}

export const emptyCarry = (): AnsiCarry => ({ style: {}, pending: "" });

// Foreground colors, tuned to read on the dark code surface (30/black → gray so
// it stays visible; the rest lean bright).
const COLORS: Record<number, string> = {
  30: "#6b7280", 31: "#f87171", 32: "#4ade80", 33: "#facc15",
  34: "#60a5fa", 35: "#e879f9", 36: "#22d3ee", 37: "#e5e5e5",
  90: "#9ca3af", 91: "#fca5a5", 92: "#86efac", 93: "#fde047",
  94: "#93c5fd", 95: "#f0abfc", 96: "#67e8f9", 97: "#ffffff",
};

function applySgr(style: Style, params: string): Style {
  const codes = params === "" ? [0] : params.split(";").map((p) => parseInt(p || "0", 10));
  let s: Style = { ...style };
  for (const c of codes) {
    if (c === 0) s = {}; // reset
    else if (c === 1) s.bold = true;
    else if (c === 22) s.bold = false;
    else if (c === 39) delete s.color; // default fg
    else if (COLORS[c]) s.color = COLORS[c];
    // else: background colors, 256/truecolor, etc. — ignored
  }
  return s;
}

// A complete CSI sequence: ESC [ <params 0x30-0x3f> <intermediates 0x20-0x2f> <final 0x40-0x7e>
const CSI = /\x1b\[([\x30-\x3f]*)[\x20-\x2f]*([\x40-\x7e])/y;
// A run so far that is still a valid *incomplete* CSI (no final byte yet).
const CSI_PREFIX = /^\x1b(\[[\x30-\x3f]*[\x20-\x2f]*)?$/;

export function parseAnsi(
  text: string,
  carry: AnsiCarry,
): { segments: Segment[]; carry: AnsiCarry } {
  const input = carry.pending + text;
  let style: Style = { ...carry.style };
  let pending = "";
  const segments: Segment[] = [];
  const push = (t: string) => {
    if (t) segments.push({ text: t, color: style.color, bold: style.bold });
  };

  let i = 0;
  while (i < input.length) {
    const esc = input.indexOf("\x1b", i);
    if (esc === -1) {
      push(input.slice(i));
      break;
    }
    if (esc > i) push(input.slice(i, esc));

    if (input[esc + 1] === "[") {
      CSI.lastIndex = esc;
      const m = CSI.exec(input);
      if (m && m.index === esc) {
        if (m[2] === "m") style = applySgr(style, m[1]);
        // else: non-SGR CSI (cursor move, mode set…) → dropped
        i = esc + m[0].length;
      } else if (CSI_PREFIX.test(input.slice(esc))) {
        pending = input.slice(esc); // incomplete CSI at end → carry to next chunk
        break;
      } else {
        i = esc + 2; // malformed CSI → drop "ESC["
      }
    } else if (esc + 1 >= input.length) {
      pending = input.slice(esc); // lone trailing ESC → carry
      break;
    } else {
      i = esc + 2; // non-CSI escape (ESC + one byte) → drop both
    }
  }

  return { segments, carry: { style, pending } };
}

// Split a chunk of raw log text into styled lines, threading SGR state through
// `carry`. Empty lines are dropped (matches the prior plain-text behavior).
export function chunkToLines(
  text: string,
  carry: AnsiCarry,
): { lines: Segment[][]; carry: AnsiCarry } {
  const { segments, carry: next } = parseAnsi(text, carry);
  const lines: Segment[][] = [];
  let cur: Segment[] = [];
  for (const seg of segments) {
    const parts = seg.text.split(/\r?\n/);
    parts.forEach((part, idx) => {
      if (idx > 0) {
        if (cur.length) lines.push(cur);
        cur = [];
      }
      if (part) cur.push({ text: part, color: seg.color, bold: seg.bold });
    });
  }
  if (cur.length) lines.push(cur);
  return { lines, carry: next };
}
