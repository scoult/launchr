//! Plist read/write via the `plist` crate (never string-templating).
//! `JobForm` is the editable shape shared with the frontend; reading vendor
//! plists is done leniently through `plist::Value` so exotic keys don't fail us.
use std::io::Cursor;
use std::path::Path;

use plist::{Dictionary, Value};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEntry {
    pub minute: Option<i64>,
    pub hour: Option<i64>,
    pub day: Option<i64>,
    pub weekday: Option<i64>,
    pub month: Option<i64>,
}

#[derive(Serialize, Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct JobForm {
    pub label: String,
    pub program_arguments: Vec<String>,
    pub run_at_load: bool,
    pub start_interval: Option<i64>,
    pub calendar: Vec<CalendarEntry>,
    pub watch_paths: Vec<String>,
    pub keep_alive: bool,
    pub standard_out_path: Option<String>,
    pub standard_error_path: Option<String>,
    pub working_directory: Option<String>,
    /// [key, value] pairs — a Vec is the simplest shape to round-trip with JS.
    pub environment_variables: Vec<[String; 2]>,
}

// --- Reading ---------------------------------------------------------------

pub fn read_value(path: &Path) -> Result<Value, String> {
    Value::from_file(path).map_err(|e| e.to_string())
}

/// Parse a raw plist string (XML or binary), returning the root Value.
pub fn parse_str(raw: &str) -> Result<Value, String> {
    Value::from_reader(Cursor::new(raw.as_bytes())).map_err(|e| e.to_string())
}

fn dict(v: &Value) -> Option<&Dictionary> {
    v.as_dictionary()
}

pub fn label_of(v: &Value) -> Option<String> {
    dict(v)?.get("Label")?.as_string().map(|s| s.to_string())
}

/// Join ProgramArguments into a display string.
pub fn program_of(v: &Value) -> String {
    dict(v)
        .and_then(|d| d.get("ProgramArguments"))
        .and_then(|a| a.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|x| x.as_string())
                .collect::<Vec<_>>()
                .join(" ")
        })
        .unwrap_or_default()
}

fn string_key(v: &Value, key: &str) -> Option<String> {
    dict(v)?.get(key)?.as_string().map(|s| s.to_string())
}

pub fn out_path(v: &Value) -> Option<String> {
    string_key(v, "StandardOutPath")
}
pub fn err_path(v: &Value) -> Option<String> {
    string_key(v, "StandardErrorPath")
}

/// Human-readable schedule summary for the sidebar/overview.
pub fn schedule_desc(v: &Value) -> String {
    let d = match dict(v) {
        Some(d) => d,
        None => return "manual".into(),
    };
    if let Some(n) = d.get("StartInterval").and_then(|x| x.as_signed_integer()) {
        return if n >= 3600 && n % 3600 == 0 {
            format!("every {} hr", n / 3600)
        } else if n >= 60 && n % 60 == 0 {
            format!("every {} min", n / 60)
        } else {
            format!("every {} sec", n)
        };
    }
    if let Some(cal) = d.get("StartCalendarInterval") {
        let entries: Vec<Dictionary> = match cal.as_array() {
            Some(a) => a
                .iter()
                .filter_map(|x| x.as_dictionary().cloned())
                .collect(),
            None => cal.as_dictionary().cloned().into_iter().collect(),
        };
        if entries.is_empty() {
            return "on schedule".into();
        }
        let time_only = |sd: &Dictionary| {
            !sd.contains_key("Day") && !sd.contains_key("Weekday") && !sd.contains_key("Month")
        };
        let fmt = |sd: &Dictionary| {
            let h = sd
                .get("Hour")
                .and_then(|x| x.as_signed_integer())
                .unwrap_or(0);
            let m = sd
                .get("Minute")
                .and_then(|x| x.as_signed_integer())
                .unwrap_or(0);
            format!("{:02}:{:02}", h, m)
        };
        if entries.iter().all(time_only) {
            return if entries.len() <= 2 {
                format!(
                    "daily at {}",
                    entries.iter().map(fmt).collect::<Vec<_>>().join(", ")
                )
            } else {
                format!("{} times daily", entries.len())
            };
        }
        return format!(
            "{} scheduled time{}",
            entries.len(),
            if entries.len() == 1 { "" } else { "s" }
        );
    }
    if d.contains_key("WatchPaths") {
        return "when files change".into();
    }
    if d.get("RunAtLoad")
        .and_then(|x| x.as_boolean())
        .unwrap_or(false)
    {
        return "at login".into();
    }
    "manual".into()
}

/// Best-effort extraction of an editable form from a plist Value.
pub fn value_to_form(v: &Value) -> JobForm {
    let d = dict(v).cloned().unwrap_or_default();
    let str_arr = |key: &str| -> Vec<String> {
        d.get(key)
            .and_then(|x| x.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|x| x.as_string().map(String::from))
                    .collect()
            })
            .unwrap_or_default()
    };
    let cal = d
        .get("StartCalendarInterval")
        .map(|c| {
            let entries = match c.as_array() {
                Some(a) => a.clone(),
                None => vec![c.clone()],
            };
            entries
                .iter()
                .filter_map(|e| e.as_dictionary())
                .map(|ed| CalendarEntry {
                    minute: ed.get("Minute").and_then(|x| x.as_signed_integer()),
                    hour: ed.get("Hour").and_then(|x| x.as_signed_integer()),
                    day: ed.get("Day").and_then(|x| x.as_signed_integer()),
                    weekday: ed.get("Weekday").and_then(|x| x.as_signed_integer()),
                    month: ed.get("Month").and_then(|x| x.as_signed_integer()),
                })
                .collect()
        })
        .unwrap_or_default();
    let env = d
        .get("EnvironmentVariables")
        .and_then(|x| x.as_dictionary())
        .map(|ed| {
            ed.iter()
                .filter_map(|(k, val)| val.as_string().map(|s| [k.clone(), s.to_string()]))
                .collect()
        })
        .unwrap_or_default();
    JobForm {
        label: d
            .get("Label")
            .and_then(|x| x.as_string())
            .unwrap_or("")
            .to_string(),
        program_arguments: str_arr("ProgramArguments"),
        run_at_load: d
            .get("RunAtLoad")
            .and_then(|x| x.as_boolean())
            .unwrap_or(false),
        start_interval: d.get("StartInterval").and_then(|x| x.as_signed_integer()),
        calendar: cal,
        watch_paths: str_arr("WatchPaths"),
        keep_alive: d
            .get("KeepAlive")
            .and_then(|x| x.as_boolean())
            .unwrap_or(false),
        standard_out_path: string_key(v, "StandardOutPath"),
        standard_error_path: string_key(v, "StandardErrorPath"),
        working_directory: string_key(v, "WorkingDirectory"),
        environment_variables: env,
    }
}

// --- Writing ---------------------------------------------------------------

fn cal_to_value(c: &CalendarEntry) -> Value {
    let mut d = Dictionary::new();
    let mut put = |k: &str, val: Option<i64>| {
        if let Some(n) = val {
            d.insert(k.into(), Value::Integer(n.into()));
        }
    };
    put("Minute", c.minute);
    put("Hour", c.hour);
    put("Day", c.day);
    put("Weekday", c.weekday);
    put("Month", c.month);
    Value::Dictionary(d)
}

/// Build a plist Value from the form, merging the modeled keys onto `base` when
/// provided so keys the form does not model (e.g. WorkingDirectory when unshown,
/// ProcessType, Nice) survive an edit/duplicate. A set field is written; an unset
/// modeled field is removed, so clearing a field in the form still clears the key.
/// `base` is `None` for brand-new jobs, giving the same output as building fresh.
pub fn form_to_value(f: &JobForm, base: Option<Value>) -> Value {
    let mut d = base
        .and_then(|v| v.as_dictionary().cloned())
        .unwrap_or_default();

    // set_or_remove: authoritative over every key the form models.
    let mut put = |key: &str, val: Option<Value>| match val {
        Some(v) => {
            d.insert(key.into(), v);
        }
        None => {
            d.remove(key);
        }
    };

    put("Label", Some(Value::String(f.label.clone())));
    put(
        "ProgramArguments",
        Some(Value::Array(
            f.program_arguments
                .iter()
                .cloned()
                .map(Value::String)
                .collect(),
        )),
    );
    put("RunAtLoad", f.run_at_load.then_some(Value::Boolean(true)));
    put(
        "StartInterval",
        f.start_interval.map(|n| Value::Integer(n.into())),
    );
    put(
        "StartCalendarInterval",
        (!f.calendar.is_empty())
            .then(|| Value::Array(f.calendar.iter().map(cal_to_value).collect())),
    );
    put(
        "WatchPaths",
        (!f.watch_paths.is_empty())
            .then(|| Value::Array(f.watch_paths.iter().cloned().map(Value::String).collect())),
    );
    put("KeepAlive", f.keep_alive.then_some(Value::Boolean(true)));
    put(
        "StandardOutPath",
        f.standard_out_path.clone().map(Value::String),
    );
    put(
        "StandardErrorPath",
        f.standard_error_path.clone().map(Value::String),
    );
    put(
        "WorkingDirectory",
        f.working_directory.clone().map(Value::String),
    );
    put(
        "EnvironmentVariables",
        (!f.environment_variables.is_empty()).then(|| {
            let mut env = Dictionary::new();
            for [k, v] in &f.environment_variables {
                env.insert(k.clone(), Value::String(v.clone()));
            }
            Value::Dictionary(env)
        }),
    );

    Value::Dictionary(d)
}

/// Serialize a Value to an XML plist string.
pub fn to_xml(v: &Value) -> Result<String, String> {
    let mut buf: Vec<u8> = Vec::new();
    v.to_writer_xml(&mut buf).map_err(|e| e.to_string())?;
    String::from_utf8(buf).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample() -> JobForm {
        JobForm {
            label: "com.me.test".into(),
            program_arguments: vec!["/usr/bin/backup.sh".into(), "--flag".into()],
            run_at_load: true,
            start_interval: Some(1800),
            calendar: vec![CalendarEntry {
                minute: Some(0),
                hour: Some(9),
                ..Default::default()
            }],
            watch_paths: vec!["/tmp/watch".into()],
            keep_alive: true,
            standard_out_path: Some("/tmp/out.log".into()),
            standard_error_path: None,
            working_directory: Some("/tmp/wd".into()),
            environment_variables: vec![["FOO".into(), "bar".into()]],
        }
    }

    #[test]
    fn form_round_trips_through_xml() {
        let f = sample();
        let xml = to_xml(&form_to_value(&f, None)).unwrap();
        let back = value_to_form(&parse_str(&xml).unwrap());
        assert_eq!(back.label, f.label);
        assert_eq!(back.program_arguments, f.program_arguments);
        assert_eq!(back.start_interval, f.start_interval);
        assert_eq!(back.watch_paths, f.watch_paths);
        assert!(back.run_at_load && back.keep_alive);
        assert_eq!(back.calendar.len(), 1);
        assert_eq!(back.calendar[0].hour, Some(9));
        assert_eq!(back.working_directory, f.working_directory);
        assert_eq!(back.environment_variables, f.environment_variables);
    }

    #[test]
    fn pvemonitor_multi_entry_calendar_survives_round_trip() {
        // The real pvemonitor plist: two StartCalendarInterval entries.
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>local.pvemonitor</string>
    <key>ProgramArguments</key>
    <array><string>/bin/bash</string><string>-lc</string><string>echo hi</string></array>
    <key>StartCalendarInterval</key>
    <array>
        <dict><key>Minute</key><integer>30</integer><key>Hour</key><integer>9</integer></dict>
        <dict><key>Minute</key><integer>30</integer><key>Hour</key><integer>11</integer></dict>
    </array>
    <key>StandardOutPath</key><string>/tmp/pve_monitor.log</string>
</dict>
</plist>"#;
        // Open -> edit-shaped form -> regenerate -> reparse (mirrors save flow).
        let form = value_to_form(&parse_str(xml).unwrap());
        assert_eq!(form.calendar.len(), 2);
        let back =
            value_to_form(&parse_str(&to_xml(&form_to_value(&form, None)).unwrap()).unwrap());
        assert_eq!(back.calendar.len(), 2, "both scheduled times must survive");
        assert_eq!(
            (back.calendar[0].hour, back.calendar[0].minute),
            (Some(9), Some(30))
        );
        assert_eq!(
            (back.calendar[1].hour, back.calendar[1].minute),
            (Some(11), Some(30))
        );
        assert_eq!(
            schedule_desc(&parse_str(xml).unwrap()),
            "daily at 09:30, 11:30"
        );
    }

    #[test]
    fn form_save_preserves_unmodeled_keys() {
        // A plist with keys the form doesn't model (WorkingDirectory, ProcessType).
        let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>com.me.job</string>
    <key>ProgramArguments</key><array><string>/bin/echo</string></array>
    <key>WorkingDirectory</key><string>/opt/project</string>
    <key>ProcessType</key><string>Background</string>
</dict>
</plist>"#;
        let original = parse_str(xml).unwrap();
        // WorkingDirectory IS modeled now, but ProcessType is not — it must survive
        // a form save via the merge base.
        let form = value_to_form(&original);
        assert_eq!(form.working_directory.as_deref(), Some("/opt/project"));
        let saved = form_to_value(&form, Some(original));
        let d = saved.as_dictionary().unwrap();
        assert_eq!(
            d.get("ProcessType").and_then(|x| x.as_string()),
            Some("Background"),
            "unmodeled key must be preserved"
        );
        assert_eq!(
            d.get("WorkingDirectory").and_then(|x| x.as_string()),
            Some("/opt/project")
        );
    }

    #[test]
    fn clearing_a_modeled_field_removes_its_key() {
        let base = form_to_value(&sample(), None); // has StandardOutPath = /tmp/out.log
        assert!(base
            .as_dictionary()
            .unwrap()
            .contains_key("StandardOutPath"));
        let cleared = JobForm {
            standard_out_path: None,
            ..sample()
        };
        let saved = form_to_value(&cleared, Some(base));
        assert!(
            !saved
                .as_dictionary()
                .unwrap()
                .contains_key("StandardOutPath"),
            "clearing a modeled field must remove the key from the base"
        );
    }

    #[test]
    fn reads_binary_plist_without_corruption() {
        // Serialize to binary, read back, values intact (task 7.2).
        let v = form_to_value(&sample(), None);
        let mut bin: Vec<u8> = Vec::new();
        plist::to_writer_binary(&mut bin, &v).unwrap();
        let read = Value::from_reader(Cursor::new(&bin)).unwrap();
        assert_eq!(label_of(&read).as_deref(), Some("com.me.test"));
        assert_eq!(program_of(&read), "/usr/bin/backup.sh --flag");
    }

    #[test]
    fn schedule_desc_reads_interval_and_daily() {
        let interval = form_to_value(
            &JobForm {
                start_interval: Some(1800),
                ..Default::default()
            },
            None,
        );
        assert_eq!(schedule_desc(&interval), "every 30 min");
        let daily = form_to_value(
            &JobForm {
                calendar: vec![CalendarEntry {
                    minute: Some(5),
                    hour: Some(9),
                    ..Default::default()
                }],
                ..Default::default()
            },
            None,
        );
        assert_eq!(schedule_desc(&daily), "daily at 09:05");
        // pvemonitor case: two time-only entries -> both listed.
        let twice = form_to_value(
            &JobForm {
                calendar: vec![
                    CalendarEntry {
                        minute: Some(30),
                        hour: Some(9),
                        ..Default::default()
                    },
                    CalendarEntry {
                        minute: Some(30),
                        hour: Some(11),
                        ..Default::default()
                    },
                ],
                ..Default::default()
            },
            None,
        );
        assert_eq!(schedule_desc(&twice), "daily at 09:30, 11:30");
        // more than two -> count summary.
        let many = form_to_value(
            &JobForm {
                calendar: (0..4)
                    .map(|h| CalendarEntry {
                        minute: Some(0),
                        hour: Some(h),
                        ..Default::default()
                    })
                    .collect(),
                ..Default::default()
            },
            None,
        );
        assert_eq!(schedule_desc(&many), "4 times daily");
    }
}
