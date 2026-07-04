import { useState } from "react";
import type { Action, CalendarEntry, JobDetail } from "../types";
import { AvailabilityChip, HealthSignal } from "./StatusBadges";
import { LogsView } from "./LogsView";
import { CodeEditor } from "./CodeEditor";
import { Button, Tabs } from "./ui";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatEntry(c: CalendarEntry): string {
  const parts: string[] = [];
  if (c.month != null) parts.push(`month ${c.month}`);
  if (c.weekday != null) parts.push(WEEKDAYS[c.weekday] ?? `wd${c.weekday}`);
  if (c.day != null) parts.push(`day ${c.day}`);
  const pad = (n: number) => String(n).padStart(2, "0");
  parts.push(`${pad(c.hour ?? 0)}:${pad(c.minute ?? 0)}`);
  return parts.join(" ");
}

function ScheduleValue({ detail }: { detail: JobDetail }) {
  const cal = detail.form.calendar;
  if (cal.length > 0) {
    return (
      <div>
        <div>{cal.length > 1 ? "daily, at:" : "daily"}</div>
        <ul className="mt-0.5 space-y-0.5">
          {cal.map((c, i) => (
            <li key={i}>• {formatEntry(c)}</li>
          ))}
        </ul>
      </div>
    );
  }
  return <span>{detail.job.schedule}</span>;
}

function Overview({ detail }: { detail: JobDetail }) {
  const j = detail.job;
  const rows: [string, string][] = [
    ["Command", j.program || "—"],
    ["stdout", j.outPath ?? "—"],
    ["stderr", j.errPath ?? "—"],
    ["Group", j.group === "mine" ? "Mine" : "System"],
    ["File", j.path],
  ];
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex gap-3">
        <dt className="w-24 shrink-0 text-muted">Schedule</dt>
        <dd className="font-mono text-xs leading-5">
          <ScheduleValue detail={detail} />
        </dd>
      </div>
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-3">
          <dt className="w-24 shrink-0 text-muted">{k}</dt>
          <dd className="break-all font-mono text-xs leading-5">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailPane({
  detail,
  onAction,
  onEdit,
  onDelete,
  error,
}: {
  detail: JobDetail;
  onAction: (a: Action) => void;
  onEdit: () => void;
  onDelete: () => void;
  error: string | null;
}) {
  const [tab, setTab] = useState<"overview" | "logs" | "raw">("overview");
  const j = detail.job;

  return (
    <div className="flex h-full flex-1 flex-col p-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">{j.label}</h1>
          <div className="mt-1 flex items-center gap-2">
            <AvailabilityChip job={j} />
            <HealthSignal job={j} />
          </div>
        </div>
        <div className="flex gap-1">
          <Button onClick={onEdit}>⚙ Edit</Button>
          <Button variant="danger" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => onAction("restart")}>
          ▶ Run now
        </Button>
        {j.loaded ? (
          <Button onClick={() => onAction("unload")}>Unload</Button>
        ) : (
          <Button onClick={() => onAction("load")}>Load</Button>
        )}
        {j.disabled ? (
          <Button onClick={() => onAction("enable")}>Enable</Button>
        ) : (
          <Button onClick={() => onAction("disable")}>Disable</Button>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-md bg-fail/10 px-3 py-2 text-sm text-fail">
          {error}
        </div>
      )}

      <div className="mt-4">
        <Tabs
          tabs={[
            ["overview", "Overview"],
            ["logs", "Logs"],
            ["raw", "Raw plist"],
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div className="mt-4 min-h-0 flex-1">
        {tab === "overview" && (
          <div className="h-full overflow-y-auto">
            <Overview detail={detail} />
          </div>
        )}
        {tab === "logs" && <LogsView label={j.label} />}
        {tab === "raw" && (
          <div className="h-full overflow-hidden rounded-md">
            <CodeEditor value={detail.rawPlist} readOnly height="100%" />
          </div>
        )}
      </div>
    </div>
  );
}
