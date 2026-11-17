use serde_json::Value;
use tauri::image::Image;
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, WebviewWindow};

const TRAY_ID: &str = "workspace";
const TRAY_ICON: &[u8] = include_bytes!("../icons/tray-icon.png");
const WINDOW_LABEL: &str = "main";

pub fn create(app: &AppHandle) -> tauri::Result<TrayIcon> {
  TrayIconBuilder::with_id(TRAY_ID)
    .icon(Image::from_bytes(TRAY_ICON)?)
    .icon_as_template(true)
    .tooltip("ibid workspace")
    .show_menu_on_left_click(false)
    .on_tray_icon_event(|tray, event| {
      if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
        bring_forward(tray.app_handle());
      }
    })
    .build(app)
}

pub fn main_window(app: &AppHandle) -> Option<WebviewWindow> {
  app.get_webview_window(WINDOW_LABEL)
}

pub fn bring_forward(app: &AppHandle) {
  if let Some(window) = main_window(app) {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
  }
}

fn count_problems(status: &Value) -> usize {
  status.get("problems").and_then(Value::as_array).map_or(0, Vec::len)
}

fn any_runner_busy(status: &Value) -> bool {
  status
    .get("runners")
    .and_then(Value::as_array)
    .is_some_and(|runners| runners.iter().any(|runner| runner.get("state").and_then(Value::as_str) == Some("busy")))
}

fn summary_title(status: &Value) -> String {
  let busy = if any_runner_busy(status) { "⟳" } else { "" };
  match count_problems(status) {
    0 => busy.to_string(),
    problems => format!("{busy}⚠ {problems}"),
  }
}

pub fn show_summary(app: &AppHandle, status: &Value) {
  if let Some(tray) = app.tray_by_id(TRAY_ID) {
    let title = summary_title(status);
    let _ = tray.set_title(if title.is_empty() { None } else { Some(title) });
  }
}
