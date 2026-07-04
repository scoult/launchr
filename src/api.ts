import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Action, Job, JobDetail, JobForm } from "./types";

export const listJobs = () => invoke<Job[]>("list_jobs");
export const getJob = (label: string) => invoke<JobDetail>("get_job", { label });
export const formToPlist = (form: JobForm) =>
  invoke<string>("form_to_plist", { form });
export const saveJob = (rawPlist: string, isNew: boolean) =>
  invoke<void>("save_job", { rawPlist, isNew });
export const setState = (label: string, action: Action) =>
  invoke<void>("set_state", { label, action });
export const deleteJob = (label: string) => invoke<void>("delete_job", { label });
export const tailLogs = (label: string) => invoke<void>("tail_logs", { label });
export const stopTail = () => invoke<void>("stop_tail");

export interface LogLine {
  stream: "out" | "err";
  text: string;
}
export const onLogLine = (cb: (l: LogLine) => void) =>
  listen<LogLine>("log-line", (e) => cb(e.payload));
