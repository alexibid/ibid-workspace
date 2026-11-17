mod actions;
mod commands;
mod environment;
mod status;
mod tray;

use tauri::{App, RunEvent, WindowEvent};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

const LOGIN_FLAG: &str = "--at-login";

fn start_with_the_mac(app: &App) {
  if !cfg!(debug_assertions) {
    let _ = app.autolaunch().enable();
  }
}

fn opened_at_login() -> bool {
  std::env::args().any(|argument| argument == LOGIN_FLAG)
}

fn setup(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
  #[cfg(target_os = "macos")]
  app.set_activation_policy(tauri::ActivationPolicy::Accessory);
  start_with_the_mac(app);
  tray::create(app.handle())?;
  status::start_polling(app.handle().clone());
  if !opened_at_login() {
    tray::bring_forward(app.handle());
  }
  Ok(())
}

pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, _, _| tray::bring_forward(app)))
    .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec![LOGIN_FLAG])))
    .manage(status::StatusStore::default())
    .invoke_handler(tauri::generate_handler![
      commands::read_status,
      commands::refresh_status,
      commands::list_actions,
      commands::run_action,
      commands::merge_pull_request,
      commands::open_link,
      commands::quit_app
    ])
    .on_window_event(|window, event| {
      if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window.hide();
      }
    })
    .setup(setup)
    .build(tauri::generate_context!())
    .expect("the workspace menu failed to start")
    .run(|app, event| {
      if let RunEvent::Reopen { .. } = event {
        tray::bring_forward(app);
      }
    });
}
