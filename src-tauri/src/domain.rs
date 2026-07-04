//! Paths and the user launchd domain target. Agents-only, gui/<uid>.
use std::path::PathBuf;

pub fn uid() -> u32 {
    // ponytail: the native call; std has no getuid.
    unsafe { libc::getuid() }
}

/// launchd domain target for the current GUI session, e.g. "gui/501".
pub fn gui_domain() -> String {
    format!("gui/{}", uid())
}

/// Service target for a specific label, e.g. "gui/501/com.me.job".
pub fn service_target(label: &str) -> String {
    format!("{}/{}", gui_domain(), label)
}

fn home() -> PathBuf {
    PathBuf::from(std::env::var("HOME").expect("HOME must be set"))
}

/// ~/Library/LaunchAgents
pub fn launch_agents_dir() -> PathBuf {
    home().join("Library/LaunchAgents")
}

/// Plist path for a label: ~/Library/LaunchAgents/<label>.plist
pub fn plist_path(label: &str) -> PathBuf {
    launch_agents_dir().join(format!("{label}.plist"))
}

/// ~/Library/Application Support/launchr (created on demand)
pub fn app_support_dir() -> PathBuf {
    home().join("Library/Application Support/launchr")
}
