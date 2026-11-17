use serde_json::Value;
use std::collections::HashSet;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

use crate::environment::{command, notify};
use crate::tray::show_summary;

const STATUS_SCRIPT: &str = "tools/workspace-menu/scripts/status.mjs";
const POLL_INTERVAL: Duration = Duration::from_secs(20);
pub const STATUS_EVENT: &str = "status-changed";

#[derive(Default)]
pub struct StatusStore {
  latest: Mutex<Option<Value>>,
  notified: Mutex<HashSet<String>>,
  refreshing: Mutex<()>,
}

impl StatusStore {
  pub fn latest(&self) -> Option<Value> {
    self.latest.lock().ok().and_then(|latest| latest.clone())
  }

  fn store(&self, status: Value) {
    if let Ok(mut latest) = self.latest.lock() {
      *latest = Some(status);
    }
  }

  fn take_new_problems(&self, problems: &[Value]) -> Vec<Value> {
    let Ok(mut notified) = self.notified.lock() else {
      return Vec::new();
    };
    let current: HashSet<String> = problems.iter().filter_map(problem_id).collect();
    let fresh = problems
      .iter()
      .filter(|problem| problem_id(problem).is_some_and(|id| !notified.contains(&id)))
      .cloned()
      .collect();
    *notified = current;
    fresh
  }
}

fn problem_id(problem: &Value) -> Option<String> {
  problem.get("id").and_then(Value::as_str).map(str::to_owned)
}

fn read_status() -> Result<Value, String> {
  let output = command("node").arg(STATUS_SCRIPT).output().map_err(|error| error.to_string())?;
  if !output.status.success() {
    return Err(String::from_utf8_lossy(&output.stderr).into_owned());
  }
  serde_json::from_slice(&output.stdout).map_err(|error| error.to_string())
}

fn announce(problems: &[Value]) {
  for problem in problems {
    let title = problem.get("title").and_then(Value::as_str).unwrap_or_default();
    let detail = problem.get("detail").and_then(Value::as_str).unwrap_or_default();
    notify(title, detail);
  }
}

pub fn refresh(app: &AppHandle) {
  let store = app.state::<StatusStore>();
  let Ok(_guard) = store.refreshing.try_lock() else {
    return;
  };
  let Ok(status) = read_status() else {
    return;
  };
  let problems = status.get("problems").and_then(Value::as_array).cloned().unwrap_or_default();
  announce(&store.take_new_problems(&problems));
  show_summary(app, &status);
  store.store(status.clone());
  let _ = app.emit(STATUS_EVENT, status);
}

pub fn start_polling(app: AppHandle) {
  thread::spawn(move || loop {
    refresh(&app);
    thread::sleep(POLL_INTERVAL);
  });
}
