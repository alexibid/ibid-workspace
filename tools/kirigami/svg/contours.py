import json
from pathlib import Path
from typing import Dict, List, Tuple

def load_precise_view_contours(contours_json_path: Path) -> Dict[str, List[Tuple[float, float]]]:
    if not contours_json_path.exists():
        raise FileNotFoundError(f"Contours JSON not found: {contours_json_path}")
    with open(contours_json_path, "r") as f:
        data = json.load(f)
    result = {}
    for k, pts in data.items():
        vname = k.capitalize()
        result[vname] = [(float(p[0]), float(p[1])) for p in pts]
    return result
