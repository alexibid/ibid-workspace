# Kirigami MCP server

Gives an agent orchestrator the local Blender, headless, behind eight typed tools. Speaks MCP
over stdio.

```json
{
  "mcpServers": {
    "kirigami": { "command": "node", "args": ["tools/kirigami/mcp/server.mjs"] }
  }
}
```

Registered in `.agents/mcp_config.json`. `KIRIGAMI_BLENDER` overrides the binary; on macOS it
defaults to `/Applications/Blender.app/Contents/MacOS/Blender`, elsewhere to `blender` on PATH.

## Tools

| Tool | What it does |
| --- | --- |
| `kirigami_environment` | Blender binary, version, whether Export Paper Model is installed, the roots |
| `kirigami_tiers` | The four tier budgets and their palettes, read from `tiers.py` |
| `kirigami_validate` | Build, weld, count offenders. Exports nothing — the fast loop |
| `kirigami_build` | The same, then one PDF net per part and one GLB. Returns every PDF path |
| `kirigami_job` | The manifest and the model script of a job that already ran |
| `kirigami_jobs` | Every job on this machine, newest first |
| `kirigami_publish` | Copy a finished job into the studio uploads and index it |
| `kirigami_catalogue` | The models currently published |
| `kirigami_unpublish` | Drop one from the index, keeping its artifacts |

## Layout

| File | Responsibility |
| --- | --- |
| `server.mjs` | Tool registration and the stdio transport |
| `actions.mjs` | What each tool does, and the fix hint for each failure stage |
| `blender.mjs` | Spawning Blender, the timeout, parsing `KIRIGAMI_RESULT` |
| `jobs.mjs` | Job directories, the job file, reading results back |
| `catalogue.mjs` | Publishing into `apps/kirigami-studio/uploads` and the gallery index |
| `screen.mjs` | What a model script is allowed to contain |
| `paths.mjs` | Every path the server touches, in one place |

## The script screen

`kirigami_validate` and `kirigami_build` take Python source and execute it inside Blender. That
is the design — the modelling agent writes geometry code. `screen.mjs` narrows what may reach
the interpreter: the source must expose `def build(studio)` and must not import host modules,
call `eval`, `exec` or `open`, install Blender handlers, or drive the session through
`bpy.ops.wm`. A model script needs none of those.

The screen is a narrowing, not a sandbox. Attach this server to an orchestrator you trust, the
same way you would trust anything else that runs code on your machine.

Runs are confined to `dist/kirigami/jobs/<id>/`, Blender starts with `--factory-startup` so no
user script loads, and every run carries a timeout that defaults to five minutes.
