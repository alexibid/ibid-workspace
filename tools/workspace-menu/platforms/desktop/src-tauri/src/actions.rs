use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::OnceLock;

use crate::environment::{command, home_dir, workspace_dir};

const CATALOG_SOURCE: &str = include_str!("../actions.json");
const ACTIONS_SCRIPT: &str = "tools/workspace-menu/scripts/actions.sh";
const OWNER_PREFIX: &str = "alexibid/";

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RunMode {
  Terminal,
  Background,
  Open,
}

#[derive(Clone, Deserialize, Serialize)]
pub struct Action {
  pub key: String,
  pub label: String,
  pub run: RunMode,
  pub args: Vec<String>,
}

#[derive(Clone, Deserialize, Serialize)]
pub struct ActionGroup {
  pub title: String,
  pub actions: Vec<Action>,
}

#[derive(Clone, Deserialize, Serialize)]
pub struct Catalog {
  pub groups: Vec<ActionGroup>,
}

pub fn catalog() -> &'static Catalog {
  static CATALOG: OnceLock<Catalog> = OnceLock::new();
  CATALOG.get_or_init(|| serde_json::from_str(CATALOG_SOURCE).expect("actions.json is valid"))
}

fn find(key: &str) -> Result<Action, String> {
  catalog()
    .groups
    .iter()
    .flat_map(|group| group.actions.iter())
    .find(|action| action.key == key)
    .cloned()
    .ok_or_else(|| format!("unknown-action:{key}"))
}

pub fn run_action(key: &str) -> Result<(), String> {
  let action = find(key)?;
  ensure_not_running(&action.key)?;
  match action.run {
    RunMode::Open => open(&action.args),
    RunMode::Background => run_in_background(&action),
    RunMode::Terminal => run_in_terminal(&action),
  }
}

pub fn merge_pull_request(repository: &str, number: u32) -> Result<(), String> {
  if !is_owned_repository(repository) {
    return Err("invalid-repository".into());
  }
  let action = Action {
    key: format!("merge-pr:{}#{number}", repository.replace('/', "_")),
    label: format!("Merge da PR #{number} em {repository}"),
    run: RunMode::Terminal,
    args: vec!["merge-pr".into(), repository.into(), number.to_string()],
  };
  ensure_not_running(&action.key)?;
  run_in_terminal(&action)
}

fn is_owned_repository(repository: &str) -> bool {
  repository.strip_prefix(OWNER_PREFIX).is_some_and(|name| {
    !name.is_empty() && name.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
  })
}

fn lock_file(key: &str) -> PathBuf {
  let temp = std::env::var_os("TMPDIR").map(PathBuf::from).unwrap_or_else(|| PathBuf::from("/tmp"));
  temp.join("ibid-workspace-menu/locks").join(key)
}

fn ensure_not_running(key: &str) -> Result<(), String> {
  let Ok(pid) = fs::read_to_string(lock_file(key)) else {
    return Ok(());
  };
  let alive = command("kill")
    .args(["-0", pid.trim()])
    .status()
    .is_ok_and(|status| status.success());
  if alive {
    Err("already-running".into())
  } else {
    Ok(())
  }
}

fn expand(argument: &str) -> String {
  argument
    .replace("{workspace}", &workspace_dir().display().to_string())
    .replace("{home}", &home_dir().display().to_string())
}

fn open(args: &[String]) -> Result<(), String> {
  command("/usr/bin/open")
    .args(args.iter().map(|argument| expand(argument)))
    .spawn()
    .map(|_| ())
    .map_err(|error| error.to_string())
}

pub fn open_link(url: &str) -> Result<(), String> {
  let allowed = ["https://github.com/", "https://console.runpod.io/"];
  if !allowed.iter().any(|prefix| url.starts_with(prefix)) {
    return Err("link-not-allowed".into());
  }
  open(&[url.to_string()])
}

fn run_in_background(action: &Action) -> Result<(), String> {
  command("bash")
    .arg(ACTIONS_SCRIPT)
    .args(&action.args)
    .env("ACTION_KEY", &action.key)
    .env("ACTION_LABEL", &action.label)
    .spawn()
    .map(|_| ())
    .map_err(|error| error.to_string())
}

fn shell_quote(value: &str) -> String {
  format!("'{}'", value.replace('\'', "'\\''"))
}

fn terminal_script(action: &Action) -> String {
  let args: Vec<String> = action.args.iter().map(|argument| shell_quote(argument)).collect();
  format!(
    "cd {} && ACTION_KEY={} ACTION_LABEL={} bash {} {}; echo; read -r -p 'Enter para fechar…' _; exit",
    shell_quote(&workspace_dir().display().to_string()),
    shell_quote(&action.key),
    shell_quote(&action.label),
    ACTIONS_SCRIPT,
    args.join(" ")
  )
}

fn run_in_terminal(action: &Action) -> Result<(), String> {
  command("osascript")
    .args([
      "-e",
      "on run argv",
      "-e",
      "tell application \"Terminal\" to do script (item 1 of argv)",
      "-e",
      "tell application \"Terminal\" to activate",
      "-e",
      "end run",
      &terminal_script(action),
    ])
    .spawn()
    .map(|_| ())
    .map_err(|error| error.to_string())
}
