import { useEffect, useState } from "react";
import { deleteJob, getJob, jobStatuses, listJobs, setState } from "./api";
import type { Action, Job, JobDetail, JobForm, LiveStatus } from "./types";
import { emptyForm } from "./types";
import { Sidebar } from "./components/Sidebar";
import { DetailPane } from "./components/DetailPane";
import { JobEditor } from "./components/JobEditor";
import { ConfirmDialog, Logo } from "./components/ui";

interface EditorState {
  mode: "new" | "edit";
  initialForm?: JobForm;
  initialRaw?: string;
  initialTab?: "form" | "raw";
}

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function refresh(keep = selected) {
    const list = await listJobs();
    setJobs(list);
    if (keep && list.some((j) => j.label === keep)) {
      setDetail(await getJob(keep));
    } else {
      setSelected(null);
      setDetail(null);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live status polling — cheap (no plist reads); merges only status fields so
  // the open editor / CodeMirror are untouched.
  useEffect(() => {
    const apply = (s: LiveStatus | undefined) => ({
      loaded: !!s?.loaded,
      disabled: !!s?.disabled,
      pid: s?.pid ?? null,
      lastExit: s?.lastExit ?? null,
    });
    const id = setInterval(async () => {
      let statuses: Record<string, LiveStatus>;
      try {
        statuses = await jobStatuses();
      } catch {
        return;
      }
      setJobs((prev) => prev.map((j) => ({ ...j, ...apply(statuses[j.label]) })));
      setDetail((prev) =>
        prev ? { ...prev, job: { ...prev.job, ...apply(statuses[prev.job.label]) } } : prev,
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  async function select(label: string) {
    setSelected(label);
    setActionError(null);
    try {
      setDetail(await getJob(label));
    } catch (e) {
      setActionError(String(e));
    }
  }

  async function act(action: Action) {
    if (!selected) return;
    setActionError(null);
    try {
      await setState(selected, action);
    } catch (e) {
      setActionError(String(e));
    }
    await refresh(selected);
  }

  async function doDelete() {
    if (!selected) return;
    setConfirmingDelete(false);
    try {
      await deleteJob(selected);
    } catch (e) {
      setActionError(String(e));
    }
    await refresh(null);
  }

  function openEdit() {
    if (!detail) return;
    // A parse-error job has no usable form — open straight to the raw text.
    if (detail.job.parseError) {
      setEditor({ mode: "edit", initialRaw: detail.rawPlist, initialTab: "raw" });
    } else {
      // Carry the original plist so unmodeled keys survive a form save.
      setEditor({ mode: "edit", initialRaw: detail.rawPlist });
    }
  }

  function openDuplicate() {
    if (!detail) return;
    setEditor({
      mode: "new",
      initialForm: {
        ...detail.form,
        label: detail.form.label ? `${detail.form.label}.copy` : "",
      },
      // Merge base: preserve keys the form doesn't model in the duplicate.
      initialRaw: detail.rawPlist,
    });
  }

  return (
    <div className="flex h-full bg-canvas text-fg">
      <Sidebar
        jobs={jobs}
        selected={selected}
        onSelect={select}
        onNew={() => setEditor({ mode: "new" })}
      />

      {detail ? (
        <DetailPane
          key={detail.job.label}
          detail={detail}
          onAction={act}
          onEdit={openEdit}
          onDuplicate={openDuplicate}
          onDelete={() => setConfirmingDelete(true)}
          onError={setActionError}
          error={actionError}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted">
          <Logo size={96} className="opacity-90" />
          <p className="text-lg">No job selected</p>
          <p className="text-sm">
            Pick an agent on the left, or create one with “+ New”.
          </p>
        </div>
      )}

      {confirmingDelete && selected && (
        <ConfirmDialog
          title={`Delete “${selected}”?`}
          message="This unloads the agent and removes its plist file."
          onConfirm={doDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      {editor && (
        <JobEditor
          mode={editor.mode}
          initial={
            editor.initialForm ??
            (editor.mode === "edit" && detail ? detail.form : emptyForm())
          }
          initialRaw={editor.initialRaw}
          initialTab={editor.initialTab}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            setEditor(null);
            await refresh(selected);
          }}
        />
      )}
    </div>
  );
}
