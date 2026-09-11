import os
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parents[3]
RESOURCES = WORKSPACE_ROOT / "apps" / "kirigami-studio" / "resources"
VIEWS = ("front", "back", "left", "right", "top")

DEFAULT_ROOT = Path.home() / "Projects" / "local-models" / "kirigami"

ROOT = Path(os.environ.get("KIRIGAMI_MODELS", DEFAULT_ROOT))
TRIPOSR_ROOT = ROOT / "TripoSR"
WEIGHTS_ROOT = ROOT / "models"
SEGMENTER = str(WEIGHTS_ROOT / "mobile_sam.pt")

os.environ.setdefault("HF_HOME", str(WEIGHTS_ROOT))
os.environ.setdefault("YOLO_CONFIG_DIR", str(WEIGHTS_ROOT / "Ultralytics"))
os.environ.setdefault("U2NET_HOME", str(WEIGHTS_ROOT / "rembg"))
