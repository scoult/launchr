import type { Job } from "../types";

// The two-part status model: availability chip + independent health signal.
// A scheduled agent is idle-waiting ~99% of the time, so we never collapse
// these into a single "running" dot. Hue carries status meaning only.

export function AvailabilityChip({ job }: { job: Job }) {
  let text: string;
  let cls: string;
  if (job.disabled) {
    text = "Disabled";
    cls = "border-warn/40 text-warn";
  } else if (job.loaded) {
    text = "Loaded";
    cls = "border-ok/40 text-ok";
  } else {
    text = "Not loaded";
    cls = "border-border text-muted";
  }
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {text}
    </span>
  );
}

export function HealthSignal({ job }: { job: Job }) {
  if (job.parseError) {
    return <span className="text-xs text-fail">⚠ parse error</span>;
  }
  if (!job.loaded) {
    return <span className="text-xs text-muted">—</span>;
  }
  if (job.pid != null) {
    return <span className="text-xs text-run">● running now (pid {job.pid})</span>;
  }
  if (job.lastExit != null && job.lastExit !== 0) {
    return (
      <span className="text-xs text-fail">⚠ last exit {job.lastExit} (failed)</span>
    );
  }
  return <span className="text-xs text-muted">○ idle · last exit 0</span>;
}

/** Compact dot for the sidebar row. */
export function StatusDot({ job }: { job: Job }) {
  let cls = "bg-muted";
  if (job.parseError) cls = "bg-fail";
  else if (job.disabled || !job.loaded) cls = "bg-muted";
  else if (job.pid != null) cls = "bg-run";
  else if (job.lastExit != null && job.lastExit !== 0) cls = "bg-fail";
  else cls = "bg-ok";
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${cls}`} />;
}
