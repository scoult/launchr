//! Tauri command surface. All state and mutation live here; the frontend
//! calls these over IPC (no HTTP layer).
use std::collections::{HashMap, HashSet};
use std::fs;
use std::io::{Read, Seek, SeekFrom};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;

use plist::Value;
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::launchctl::{self, LiveState};
use crate::plist_model::{self, JobForm};
use crate::{domain, manifest};

/// Shared counter so a new tail cancels the previous one.
pub struct TailState(pub Arc<AtomicU64>);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Job {
    label: String,
    path: String,
    group: String, // "mine" | "system"
    schedule: String,
    program: String,
    out_path: Option<String>,
    err_path: Option<String>,
    loaded: bool,
    disabled: bool,
    pid: Option<i64>,
    last_exit: Option<i64>,
    parse_error: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobDetail {
    job: Job,
    form: JobForm,
    raw_plist: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct LogLine {
    stream: String, // "out" | "err"
    text: String,
}

fn build_job(
    label: &str,
    path: &str,
    value: Option<&Value>,
    parse_error: Option<String>,
    states: &HashMap<String, LiveState>,
    disabled: &HashSet<String>,
    mine: &HashSet<String>,
) -> Job {
    let live = states.get(label).cloned().unwrap_or_default();
    Job {
        label: label.to_string(),
        path: path.to_string(),
        group: if mine.contains(label) {
            "mine".into()
        } else {
            "system".into()
        },
        schedule: value
            .map(plist_model::schedule_desc)
            .unwrap_or_else(|| "?".into()),
        program: value.map(plist_model::program_of).unwrap_or_default(),
        out_path: value.and_then(plist_model::out_path),
        err_path: value.and_then(plist_model::err_path),
        loaded: states.contains_key(label),
        disabled: disabled.contains(label),
        pid: live.pid,
        last_exit: live.last_exit,
        parse_error,
    }
}

#[tauri::command]
pub fn list_jobs() -> Result<Vec<Job>, String> {
    let states = launchctl::loaded_states();
    let disabled = launchctl::disabled_labels();
    let mine = manifest::load();

    let dir = domain::launch_agents_dir();
    let mut jobs = Vec::new();
    let entries = match fs::read_dir(&dir) {
        Ok(e) => e,
        Err(_) => return Ok(jobs), // dir absent -> empty, not an error
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("plist") {
            continue;
        }
        let stem = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_string();
        let path_str = path.to_string_lossy().to_string();
        match plist_model::read_value(&path) {
            Ok(value) => {
                let label = plist_model::label_of(&value).unwrap_or_else(|| stem.clone());
                jobs.push(build_job(
                    &label,
                    &path_str,
                    Some(&value),
                    None,
                    &states,
                    &disabled,
                    &mine,
                ));
            }
            Err(e) => {
                jobs.push(build_job(
                    &stem,
                    &path_str,
                    None,
                    Some(e),
                    &states,
                    &disabled,
                    &mine,
                ));
            }
        }
    }
    // Mine first, then alphabetical.
    jobs.sort_by(|a, b| {
        (a.group != "mine", a.label.to_lowercase())
            .cmp(&(b.group != "mine", b.label.to_lowercase()))
    });
    Ok(jobs)
}

#[tauri::command]
pub fn get_job(label: String) -> Result<JobDetail, String> {
    let path = domain::plist_path(&label);
    let path_str = path.to_string_lossy().to_string();
    let states = launchctl::loaded_states();
    let disabled = launchctl::disabled_labels();
    let mine = manifest::load();

    match plist_model::read_value(&path) {
        Ok(value) => {
            let real_label = plist_model::label_of(&value).unwrap_or_else(|| label.clone());
            let job = build_job(
                &real_label,
                &path_str,
                Some(&value),
                None,
                &states,
                &disabled,
                &mine,
            );
            Ok(JobDetail {
                form: plist_model::value_to_form(&value),
                raw_plist: plist_model::to_xml(&value)?,
                job,
            })
        }
        Err(e) => {
            // Unparseable plist: still open it so the raw text can be fixed.
            let job = build_job(&label, &path_str, None, Some(e), &states, &disabled, &mine);
            Ok(JobDetail {
                form: JobForm::default(),
                raw_plist: fs::read_to_string(&path).unwrap_or_default(),
                job,
            })
        }
    }
}

/// Live runtime state only (no plist reads) — for cheap polling.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveStatus {
    loaded: bool,
    disabled: bool,
    pid: Option<i64>,
    last_exit: Option<i64>,
}

#[tauri::command]
pub fn job_statuses() -> HashMap<String, LiveStatus> {
    let states = launchctl::loaded_states();
    let disabled = launchctl::disabled_labels();
    let mut labels: HashSet<&String> = states.keys().collect();
    labels.extend(disabled.iter());
    labels
        .into_iter()
        .map(|label| {
            let live = states.get(label).cloned().unwrap_or_default();
            (
                label.clone(),
                LiveStatus {
                    loaded: states.contains_key(label),
                    disabled: disabled.contains(label),
                    pid: live.pid,
                    last_exit: live.last_exit,
                },
            )
        })
        .collect()
}

/// Render a form to plist XML (for the Raw tab / preview). `base_raw` is the
/// original plist when editing/duplicating, so keys the form does not model are
/// preserved rather than dropped; `None` for a brand-new job.
#[tauri::command]
pub fn form_to_plist(form: JobForm, base_raw: Option<String>) -> Result<String, String> {
    let base = base_raw
        .as_deref()
        .map(plist_model::parse_str)
        .transpose()?;
    plist_model::to_xml(&plist_model::form_to_value(&form, base))
}

/// Validate + write a plist. Same path for form-save and raw-save: the frontend
/// always hands us XML. Invalid plist -> Err (blocks the save).
#[tauri::command]
pub fn save_job(raw_plist: String, is_new: bool) -> Result<(), String> {
    let value = plist_model::parse_str(&raw_plist)?;
    let label = plist_model::label_of(&value).ok_or("plist is missing a Label")?;
    let path = domain::plist_path(&label);
    if is_new && path.exists() {
        return Err(format!("A job with label '{label}' already exists"));
    }
    fs::create_dir_all(domain::launch_agents_dir()).map_err(|e| e.to_string())?;
    fs::write(&path, raw_plist).map_err(|e| e.to_string())?;
    if is_new {
        manifest::add(&label)?;
    }
    Ok(())
}

#[tauri::command]
pub fn set_state(label: String, action: String) -> Result<(), String> {
    let res = match action.as_str() {
        "load" => {
            let path = domain::plist_path(&label);
            launchctl::bootstrap(&path.to_string_lossy())
        }
        "unload" => launchctl::bootout(&label),
        "enable" => launchctl::enable(&label),
        "disable" => launchctl::disable(&label),
        "restart" => launchctl::kickstart(&label),
        other => return Err(format!("unknown action '{other}'")),
    };
    if res.ok {
        Ok(())
    } else {
        Err(if res.stderr.is_empty() {
            format!("launchctl {action} failed")
        } else {
            res.stderr
        })
    }
}

#[tauri::command]
pub fn delete_job(label: String) -> Result<(), String> {
    let _ = launchctl::bootout(&label); // best-effort unload; ignore if not loaded
    let path = domain::plist_path(&label);
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    manifest::remove(&label)?;
    Ok(())
}

struct Tailer {
    path: String,
    stream: String,
    offset: u64,
    /// Trailing bytes of an incomplete UTF-8 char, carried to the next poll so
    /// a multi-byte char split across a read boundary is emitted whole.
    pending: Vec<u8>,
}

impl Tailer {
    fn emit(&self, app: &AppHandle, text: String) {
        if !text.is_empty() {
            let _ = app.emit(
                "log-line",
                LogLine {
                    stream: self.stream.clone(),
                    text,
                },
            );
        }
    }

    fn poll(&mut self, app: &AppHandle) {
        let mut file = match fs::File::open(&self.path) {
            Ok(f) => f,
            Err(_) => return, // file not created yet / rotated away
        };
        let len = file.metadata().map(|m| m.len()).unwrap_or(0);
        if len < self.offset {
            self.offset = 0; // truncated/rotated -> start over
            self.pending.clear();
        }
        if len == self.offset {
            return;
        }
        if file.seek(SeekFrom::Start(self.offset)).is_err() {
            return;
        }
        let mut fresh: Vec<u8> = Vec::new();
        if file.read_to_end(&mut fresh).is_err() {
            return;
        }
        self.offset = len;

        // Decode leftover + fresh bytes; keep only a trailing incomplete char.
        let mut bytes = std::mem::take(&mut self.pending);
        bytes.extend_from_slice(&fresh);
        match std::str::from_utf8(&bytes) {
            Ok(s) => self.emit(app, s.to_string()),
            Err(e) if e.error_len().is_none() => {
                // Incomplete trailing char: emit the valid prefix, carry the rest.
                let valid = e.valid_up_to();
                self.emit(app, String::from_utf8_lossy(&bytes[..valid]).into_owned());
                self.pending = bytes[valid..].to_vec();
            }
            Err(_) => {
                // Genuinely invalid bytes: lossy-decode rather than drop the chunk.
                self.emit(app, String::from_utf8_lossy(&bytes).into_owned());
            }
        }
    }
}

/// Start streaming a job's stdout/stderr as `log-line` events. Calling again
/// (any label) cancels the previous tail.
#[tauri::command]
pub fn tail_logs(label: String, app: AppHandle, state: State<TailState>) -> Result<(), String> {
    let value = plist_model::read_value(&domain::plist_path(&label))?;
    let mut tailers: Vec<Tailer> = Vec::new();
    if let Some(p) = plist_model::out_path(&value) {
        tailers.push(Tailer {
            path: p,
            stream: "out".into(),
            offset: 0,
            pending: Vec::new(),
        });
    }
    if let Some(p) = plist_model::err_path(&value) {
        tailers.push(Tailer {
            path: p,
            stream: "err".into(),
            offset: 0,
            pending: Vec::new(),
        });
    }
    if tailers.is_empty() {
        return Err("no log paths configured for this job".into());
    }

    let gen = state.0.clone();
    let my_gen = gen.fetch_add(1, Ordering::SeqCst) + 1;
    std::thread::spawn(move || {
        // ponytail: poll-based tail, 500ms. Swap to `notify` if latency matters.
        loop {
            if gen.load(Ordering::SeqCst) != my_gen {
                break; // a newer tail took over
            }
            for t in tailers.iter_mut() {
                t.poll(&app);
            }
            std::thread::sleep(Duration::from_millis(500));
        }
    });
    Ok(())
}

/// Stop any active tail (e.g. when the detail view closes).
#[tauri::command]
pub fn stop_tail(state: State<TailState>) {
    state.0.fetch_add(1, Ordering::SeqCst);
}
