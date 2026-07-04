import { useState } from "react";
import type { Job } from "../types";
import { Button, Input, Logo } from "./ui";
import { StatusDot } from "./StatusBadges";

function Row({
  job,
  selected,
  onSelect,
}: {
  job: Job;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
        selected ? "bg-selection font-medium text-fg" : "hover:bg-selection"
      }`}
    >
      <StatusDot job={job} />
      <span className="truncate">{job.label}</span>
    </button>
  );
}

export function Sidebar({
  jobs,
  selected,
  onSelect,
  onNew,
}: {
  jobs: Job[];
  selected: string | null;
  onSelect: (label: string) => void;
  onNew: () => void;
}) {
  const [query, setQuery] = useState("");
  const [showSystem, setShowSystem] = useState(false);

  const q = query.trim().toLowerCase();
  const match = (j: Job) => !q || j.label.toLowerCase().includes(q);
  const mine = jobs.filter((j) => j.group === "mine" && match(j));
  const system = jobs.filter((j) => j.group === "system" && match(j));

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-border">
      <div className="flex items-center gap-2 px-2 pt-2">
        <Logo size={22} />
        <span className="text-sm font-semibold tracking-tight">launchr</span>
      </div>
      <div className="flex items-center gap-2 p-2">
        <Input
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
        <Button variant="primary" onClick={onNew} title="New job">
          + New
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-2 pb-2">
        <div>
          <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Mine
          </div>
          {mine.length === 0 ? (
            <div className="px-2 py-1 text-sm text-muted">No jobs yet</div>
          ) : (
            mine.map((j) => (
              <Row
                key={j.label}
                job={j}
                selected={selected === j.label}
                onSelect={() => onSelect(j.label)}
              />
            ))
          )}
        </div>

        <div>
          <button
            onClick={() => setShowSystem((s) => !s)}
            className="flex w-full items-center gap-1 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted hover:text-fg"
          >
            <span>{showSystem ? "▾" : "▸"}</span>
            System ({system.length})
          </button>
          {showSystem &&
            system.map((j) => (
              <Row
                key={j.label}
                job={j}
                selected={selected === j.label}
                onSelect={() => onSelect(j.label)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
