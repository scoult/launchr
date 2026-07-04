import { useEffect, useRef, useState } from "react";
import { onLogLine, stopTail, tailLogs } from "../api";
import { chunkToLines, emptyCarry, type Segment } from "../lib/ansi";
import { Button } from "./ui";

type Line = Segment[];

export function LogsView({ label }: { label: string }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [following, setFollowing] = useState(true);
  const followingRef = useRef(true);
  const buffer = useRef<Line[]>([]);
  const carry = useRef(emptyCarry());
  const boxRef = useRef<HTMLDivElement>(null);

  // Start/stop the tail when the selected job changes.
  useEffect(() => {
    setLines([]);
    buffer.current = [];
    carry.current = emptyCarry();
    let unlisten: (() => void) | undefined;
    tailLogs(label).catch((e) => setLines([[{ text: `⚠ ${e}`, color: "#f87171" }]]));
    const sub = onLogLine((l) => {
      const text = (l.stream === "err" ? "[err] " : "") + l.text;
      const { lines: newLines, carry: next } = chunkToLines(text, carry.current);
      carry.current = next;
      if (newLines.length === 0) return;
      if (followingRef.current) setLines((prev) => [...prev, ...newLines]);
      else buffer.current.push(...newLines);
    });
    sub.then((fn) => (unlisten = fn));
    return () => {
      unlisten?.();
      stopTail();
    };
  }, [label]);

  // Toggle follow: on resume, flush anything buffered while paused.
  useEffect(() => {
    followingRef.current = following;
    if (following && buffer.current.length) {
      setLines((prev) => [...prev, ...buffer.current]);
      buffer.current = [];
    }
  }, [following]);

  // Auto-scroll only while following.
  useEffect(() => {
    if (following && boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [lines, following]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 pb-2">
        <span className="text-xs text-muted">
          {following ? "● following" : "∥ paused"}
        </span>
        <Button variant="ghost" onClick={() => setFollowing((f) => !f)}>
          {following ? "∥ Pause" : "▶ Follow"}
        </Button>
        <Button variant="ghost" onClick={() => setLines([])}>
          Clear
        </Button>
      </div>
      <div
        ref={boxRef}
        className="flex-1 overflow-auto rounded-md bg-code p-3 font-mono text-xs leading-relaxed text-code-fg"
      >
        {lines.length === 0 ? (
          <span className="text-muted">Waiting for output… (nothing written yet)</span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-all">
              {line.map((seg, j) => (
                <span
                  key={j}
                  style={{ color: seg.color, fontWeight: seg.bold ? 600 : undefined }}
                >
                  {seg.text}
                </span>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
