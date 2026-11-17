use std::env;
use std::path::PathBuf;
use std::process::Command;

const EXTRA_PATH: &str = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin";

pub fn home_dir() -> PathBuf {
  env::var_os("HOME").map(PathBuf::from).unwrap_or_else(|| PathBuf::from("/"))
}

pub fn workspace_dir() -> PathBuf {
  env::var_os("WORKSPACE_DIR")
    .map(PathBuf::from)
    .unwrap_or_else(|| home_dir().join("Projects/ibid-workspace"))
}

pub fn search_path() -> String {
  format!("{}/.n/bin:{}", home_dir().display(), EXTRA_PATH)
}

pub fn command(program: &str) -> Command {
  let mut command = Command::new(program);
  command
    .current_dir(workspace_dir())
    .env("PATH", search_path())
    .env("WORKSPACE_DIR", workspace_dir());
  command
}

pub fn notify(subtitle: &str, message: &str) {
  let _ = Command::new("osascript")
    .args([
      "-e",
      "on run argv",
      "-e",
      "display notification (item 2 of argv) with title \"workspace\" subtitle (item 1 of argv)",
      "-e",
      "end run",
      subtitle,
      message,
    ])
    .spawn();
}
