import { useState } from "react";
import { formToPlist, saveJob } from "../api";
import type { CalendarEntry, JobForm } from "../types";
import { Button, Field, Input, Tabs } from "./ui";
import { CodeEditor, isXmlValid } from "./CodeEditor";
import { joinArgs, splitArgs } from "../lib/shellwords";

type Preset = "login" | "interval" | "times" | "watch" | "manual";

function detectPreset(f: JobForm): Preset {
  if (f.startInterval != null) return "interval";
  if (f.calendar.length >= 1) return "times";
  if (f.watchPaths.length > 0) return "watch";
  if (f.runAtLoad) return "login";
  return "manual";
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const newTime = (): CalendarEntry => ({
  minute: 0,
  hour: 9,
  day: null,
  weekday: null,
  month: null,
});

const numOrNull = (s: string): number | null =>
  s.trim() === "" ? null : Number(s);

export function JobEditor({
  mode,
  initial,
  initialRaw,
  initialTab,
  onClose,
  onSaved,
}: {
  mode: "new" | "edit";
  initial: JobForm;
  initialRaw?: string;
  initialTab?: "form" | "raw";
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<JobForm>(initial);
  const [preset, setPreset] = useState<Preset>(detectPreset(initial));
  const [tab, setTab] = useState<"form" | "raw">(initialTab ?? "form");
  const [raw, setRaw] = useState(initialRaw ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const patch = (p: Partial<JobForm>) => setForm((f) => ({ ...f, ...p }));

  function applyPreset(kind: Preset) {
    setPreset(kind);
    const cleared = { runAtLoad: false, startInterval: null, calendar: [], watchPaths: [] };
    if (kind === "login") patch({ ...cleared, runAtLoad: true });
    else if (kind === "interval") patch({ ...cleared, startInterval: 1800 });
    else if (kind === "times")
      // Keep existing entries when switching in, so we never drop times.
      patch({ ...cleared, calendar: form.calendar.length ? form.calendar : [newTime()] });
    else if (kind === "watch") patch({ ...cleared, watchPaths: [""] });
    else patch(cleared);
  }

  async function switchTab(next: "form" | "raw") {
    if (next === "raw") {
      try {
        setRaw(await formToPlist(form, initialRaw));
        setError(null);
      } catch (e) {
        setError(String(e));
      }
    }
    setTab(next);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const xml = tab === "raw" ? raw : await formToPlist(form, initialRaw);
      await saveJob(xml, mode === "new");
      onSaved();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  const command = joinArgs(form.programArguments);
  // In raw mode, block save on malformed XML (Rust save_job is the final guard).
  const rawInvalid = tab === "raw" && raw.trim() !== "" && !isXmlValid(raw);

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-6">
      <div className="flex max-h-full w-full max-w-2xl flex-col rounded-xl border border-border bg-surface shadow-xl">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold">
            {mode === "new" ? "New job" : `Edit ${form.label}`}
          </h2>
        </div>

        <div className="px-4 pt-3">
          <Tabs
            tabs={[
              ["form", "Form"],
              ["raw", "Raw plist"],
            ]}
            value={tab}
            onChange={switchTab}
          />
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {tab === "form" ? (
            <>
              <Field label="Name" hint="Label">
                <Input
                  value={form.label}
                  disabled={mode === "edit"}
                  placeholder="com.me.backup"
                  onChange={(e) => patch({ label: e.currentTarget.value })}
                />
              </Field>

              <Field label="Command" hint="ProgramArguments">
                <Input
                  value={command}
                  placeholder="/usr/bin/backup.sh --flag"
                  onChange={(e) =>
                    patch({ programArguments: splitArgs(e.currentTarget.value) })
                  }
                />
              </Field>

              <div className="space-y-2">
                <span className="text-sm font-medium">When it runs</span>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ["login", "At login"],
                      ["interval", "Every N min"],
                      ["times", "At times"],
                      ["watch", "On folder change"],
                      ["manual", "Manual"],
                    ] as [Preset, string][]
                  ).map(([k, lbl]) => (
                    <Button
                      key={k}
                      variant={preset === k ? "primary" : "secondary"}
                      onClick={() => applyPreset(k)}
                    >
                      {lbl}
                    </Button>
                  ))}
                </div>

                {preset === "interval" && (
                  <div className="flex items-center gap-2 text-sm">
                    every
                    <Input
                      type="number"
                      className="w-24"
                      value={form.startInterval != null ? form.startInterval / 60 : ""}
                      onChange={(e) =>
                        patch({ startInterval: numOrNull(e.currentTarget.value) != null ? Number(e.currentTarget.value) * 60 : null })
                      }
                    />
                    minutes
                  </div>
                )}
                {preset === "times" && (
                  <div className="space-y-1">
                    {form.calendar.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="time"
                          className="h-8 rounded-md border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
                          value={`${pad2(c.hour ?? 0)}:${pad2(c.minute ?? 0)}`}
                          onChange={(e) => {
                            const [h, m] = e.currentTarget.value.split(":").map(Number);
                            // Update only this entry, preserving its other fields.
                            patch({
                              calendar: form.calendar.map((x, j) =>
                                j === i ? { ...x, hour: h, minute: m } : x,
                              ),
                            });
                          }}
                        />
                        {(c.day != null || c.weekday != null || c.month != null) && (
                          <span className="text-xs text-muted">
                            + day/month constraints (see Advanced)
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            patch({ calendar: form.calendar.filter((_, j) => j !== i) })
                          }
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      onClick={() => patch({ calendar: [...form.calendar, newTime()] })}
                    >
                      + Add time
                    </Button>
                  </div>
                )}
                {preset === "watch" && (
                  <Input
                    placeholder="/path/to/folder"
                    value={form.watchPaths[0] ?? ""}
                    onChange={(e) => patch({ watchPaths: [e.currentTarget.value] })}
                  />
                )}
              </div>

              <Advanced form={form} patch={patch} />
            </>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              <CodeEditor value={raw} onChange={setRaw} height="384px" />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-fail/10 px-3 py-2 text-sm text-fail">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={save}
            disabled={busy || (tab === "form" ? !form.label : rawInvalid)}
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Advanced({
  form,
  patch,
}: {
  form: JobForm;
  patch: (p: Partial<JobForm>) => void;
}) {
  const setCal = (i: number, key: keyof CalendarEntry, v: number | null) => {
    const calendar = form.calendar.map((c, j) => (j === i ? { ...c, [key]: v } : c));
    patch({ calendar });
  };
  return (
    <details className="rounded-md border border-border p-3">
      <summary className="cursor-pointer text-sm font-medium">Advanced</summary>
      <div className="mt-3 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.runAtLoad}
            onChange={(e) => patch({ runAtLoad: e.currentTarget.checked })}
          />
          Also run at load (RunAtLoad)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.keepAlive}
            onChange={(e) => patch({ keepAlive: e.currentTarget.checked })}
          />
          Keep alive (KeepAlive)
        </label>

        <Field label="Log: stdout" hint="StandardOutPath">
          <Input
            value={form.standardOutPath ?? ""}
            placeholder="~/Library/Logs/job.out"
            onChange={(e) =>
              patch({ standardOutPath: e.currentTarget.value || null })
            }
          />
        </Field>
        <Field label="Log: stderr" hint="StandardErrorPath">
          <Input
            value={form.standardErrorPath ?? ""}
            placeholder="~/Library/Logs/job.err"
            onChange={(e) =>
              patch({ standardErrorPath: e.currentTarget.value || null })
            }
          />
        </Field>

        <Field label="Working directory" hint="WorkingDirectory">
          <Input
            value={form.workingDirectory ?? ""}
            placeholder="/path/to/project"
            onChange={(e) =>
              patch({ workingDirectory: e.currentTarget.value || null })
            }
          />
        </Field>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Calendar entries{" "}
              <span className="font-normal text-muted">(StartCalendarInterval)</span>
            </span>
            <Button
              variant="ghost"
              onClick={() =>
                patch({
                  calendar: [
                    ...form.calendar,
                    { minute: null, hour: null, day: null, weekday: null, month: null },
                  ],
                })
              }
            >
              + Add
            </Button>
          </div>
          {form.calendar.map((c, i) => (
            <div key={i} className="flex items-center gap-1">
              {(["minute", "hour", "day", "weekday", "month"] as (keyof CalendarEntry)[]).map(
                (k) => (
                  <Input
                    key={k}
                    type="number"
                    className="w-full"
                    placeholder={k}
                    value={c[k] ?? ""}
                    onChange={(e) => setCal(i, k, numOrNull(e.currentTarget.value))}
                  />
                ),
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => patch({ calendar: form.calendar.filter((_, j) => j !== i) })}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>

        <Field label="Watch paths" hint="WatchPaths, one per line">
          <textarea
            className="w-full rounded-md border border-border bg-surface p-2 text-sm text-fg outline-none focus:border-accent"
            rows={2}
            value={form.watchPaths.join("\n")}
            onChange={(e) =>
              patch({
                watchPaths: e.currentTarget.value.split("\n").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </Field>
      </div>
    </details>
  );
}
