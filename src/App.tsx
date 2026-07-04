import { useEffect, useState } from "react";
import {
  deleteJob,
  getJob,
  listJobs,
  setState,
} from "./api";
import type { Action, Job, JobDetail } from "./types";
import { emptyForm } from "./types";
import { Sidebar } from "./components/Sidebar";
import { DetailPane } from "./components/DetailPane";
import { JobEditor } from "./components/JobEditor";
import { ConfirmDialog, Logo } from "./components/ui";

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [editor, setEditor] = useState<{ mode: "new" | "edit" } | null>(null);
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
          onEdit={() => setEditor({ mode: "edit" })}
          onDelete={() => setConfirmingDelete(true)}
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
          initial={editor.mode === "edit" && detail ? detail.form : emptyForm()}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            const label =
              editor.mode === "edit" ? selected : undefined;
            setEditor(null);
            await refresh(label ?? selected);
          }}
        />
      )}
    </div>
  );
}
