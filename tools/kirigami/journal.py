import json
import time
from datetime import datetime, timezone
from pathlib import Path

LEDGER = "pipeline.json"


def record(root: Path, stage: str, tool: str, seconds: float, detail: dict | None = None) -> None:
    ledger = Path(root) / LEDGER
    rows = json.loads(ledger.read_text()) if ledger.exists() else []
    rows = [row for row in rows if row["stage"] != stage]
    rows.append({
        "stage": stage,
        "tool": tool,
        "seconds": round(seconds, 2),
        "at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        **({"detail": detail} if detail else {}),
    })
    ledger.write_text(json.dumps(rows, indent=2) + "\n")
    print(f"MEASURED stage={stage} seconds={seconds:.2f}")


class Timer:
    def __init__(self, root: Path, stage: str, tool: str) -> None:
        self.root, self.stage, self.tool = Path(root), stage, tool
        self.detail: dict = {}

    def __enter__(self) -> "Timer":
        self.started = time.monotonic()
        return self

    def __exit__(self, kind, value, trace) -> bool:
        if kind is None:
            record(self.root, self.stage, self.tool, time.monotonic() - self.started,
                   self.detail or None)
        return False
