mod commands;
mod domain;
mod launchctl;
mod manifest;
mod plist_model;

use std::sync::atomic::AtomicU64;
use std::sync::Arc;

use commands::TailState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(TailState(Arc::new(AtomicU64::new(0))))
        .invoke_handler(tauri::generate_handler![
            commands::list_jobs,
            commands::get_job,
            commands::job_statuses,
            commands::form_to_plist,
            commands::save_job,
            commands::set_state,
            commands::delete_job,
            commands::tail_logs,
            commands::stop_tail,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
