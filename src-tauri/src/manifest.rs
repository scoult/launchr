//! App-owned record of which labels launchr created ("Mine"). Kept out of the
//! plists so user files are never polluted. Stored as a JSON string array.
use std::collections::HashSet;
use std::fs;

use crate::domain;

fn manifest_path() -> std::path::PathBuf {
    domain::app_support_dir().join("manifest.json")
}

pub fn load() -> HashSet<String> {
    let path = manifest_path();
    let Ok(text) = fs::read_to_string(&path) else { return HashSet::new() };
    serde_json::from_str::<Vec<String>>(&text)
        .map(|v| v.into_iter().collect())
        .unwrap_or_default()
}

fn save(set: &HashSet<String>) -> Result<(), String> {
    let dir = domain::app_support_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let list: Vec<&String> = set.iter().collect();
    let json = serde_json::to_string_pretty(&list).map_err(|e| e.to_string())?;
    fs::write(manifest_path(), json).map_err(|e| e.to_string())
}

pub fn add(label: &str) -> Result<(), String> {
    let mut set = load();
    set.insert(label.to_string());
    save(&set)
}

pub fn remove(label: &str) -> Result<(), String> {
    let mut set = load();
    set.remove(label);
    save(&set)
}
