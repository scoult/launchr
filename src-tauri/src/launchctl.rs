//! Thin wrapper over the `launchctl` binary + all of its output parsing.
//! launchctl has no stable library binding and no file for live state, so we
//! shell out. Its output formats are NOT a stable contract across macOS
//! versions — keep every bit of parsing in this module so a break is local.
use std::collections::{HashMap, HashSet};
use std::process::Command;

use crate::domain;

/// Result of a control command: ok, or the captured stderr on failure.
pub struct CmdResult {
    pub ok: bool,
    pub stderr: String,
}

fn run(args: &[&str]) -> CmdResult {
    match Command::new("launchctl").args(args).output() {
        Ok(out) => CmdResult {
            ok: out.status.success(),
            stderr: String::from_utf8_lossy(&out.stderr).trim().to_string(),
        },
        Err(e) => CmdResult {
            ok: false,
            stderr: e.to_string(),
        },
    }
}

fn run_stdout(args: &[&str]) -> String {
    Command::new("launchctl")
        .args(args)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_default()
}

/// Live runtime facts for a loaded job.
#[derive(Clone, Default)]
pub struct LiveState {
    pub pid: Option<i64>,
    pub last_exit: Option<i64>,
}

/// Parse `launchctl list` (TSV: PID\tStatus\tLabel) into label -> LiveState.
/// Presence in this map means the job is loaded.
pub fn loaded_states() -> HashMap<String, LiveState> {
    let text = run_stdout(&["list"]);
    let mut map = HashMap::new();
    for line in text.lines().skip(1) {
        // skip header "PID\tStatus\tLabel"
        let mut cols = line.split('\t');
        let pid = cols.next().unwrap_or("-");
        let status = cols.next().unwrap_or("-");
        let label = match cols.next() {
            Some(l) if !l.is_empty() => l,
            _ => continue,
        };
        map.insert(
            label.to_string(),
            LiveState {
                pid: pid.parse::<i64>().ok(),
                last_exit: status.parse::<i64>().ok(),
            },
        );
    }
    map
}

/// Parse `launchctl print-disabled gui/<uid>` into the set of disabled labels.
/// Line form: `"com.foo" => true` (older) or `"com.foo" => disabled` (newer).
pub fn disabled_labels() -> HashSet<String> {
    let text = run_stdout(&["print-disabled", &domain::gui_domain()]);
    let mut set = HashSet::new();
    for line in text.lines() {
        let Some((lhs, rhs)) = line.split_once("=>") else {
            continue;
        };
        let rhs = rhs.trim();
        // "enabled"/"false" => not disabled; "disabled"/"true" => disabled.
        if rhs.starts_with("disabled") || rhs.starts_with("true") {
            if let Some(label) = lhs
                .trim()
                .strip_prefix('"')
                .and_then(|s| s.strip_suffix('"'))
            {
                set.insert(label.to_string());
            }
        }
    }
    set
}

// --- Control verbs (modern launchctl) -------------------------------------

pub fn bootstrap(plist_path: &str) -> CmdResult {
    run(&["bootstrap", &domain::gui_domain(), plist_path])
}

pub fn bootout(label: &str) -> CmdResult {
    run(&["bootout", &domain::service_target(label)])
}

pub fn enable(label: &str) -> CmdResult {
    run(&["enable", &domain::service_target(label)])
}

pub fn disable(label: &str) -> CmdResult {
    run(&["disable", &domain::service_target(label)])
}

/// Run now / restart.
pub fn kickstart(label: &str) -> CmdResult {
    run(&["kickstart", "-k", &domain::service_target(label)])
}
