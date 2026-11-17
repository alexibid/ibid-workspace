use serde_json::Value;
use std::thread;
use tauri::{AppHandle, State};

use crate::actions::{self, Catalog};
use crate::status::{self, StatusStore};

#[tauri::command]
pub fn read_status(store: State<'_, StatusStore>) -> Result<Value, String> {
  store.latest().ok_or_else(|| "not-ready".into())
}

#[tauri::command]
pub fn refresh_status(app: AppHandle) {
  thread::spawn(move || status::refresh(&app));
}

#[tauri::command]
pub fn list_actions() -> Catalog {
  actions::catalog().clone()
}

#[tauri::command]
pub fn run_action(key: String) -> Result<(), String> {
  actions::run_action(&key)
}

#[tauri::command]
pub fn merge_pull_request(repository: String, number: u32) -> Result<(), String> {
  actions::merge_pull_request(&repository, number)
}

#[tauri::command]
pub fn open_link(url: String) -> Result<(), String> {
  actions::open_link(&url)
}

#[tauri::command]
pub fn quit_app(app: AppHandle) {
  app.exit(0);
}
