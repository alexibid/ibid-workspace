import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

VIEWS = ("front", "back", "left", "right", "top")
BACKGROUND_MARGIN = 40
HEIGHT_TOLERANCE = 0.06
WIDTH_TOLERANCE = 0.08
WIRE_TOLERANCE = 0.05


class MeasureError(RuntimeError):
    pass


def main() -> int:
    options = _options()
    if not options.root.is_dir():
        raise MeasureError(f"No such folder: {options.root}")

    boxes = _measure_all(options.root)
    if not boxes:
        raise MeasureError(f"{options.root} carries no recognised view image.")

    flagged = 0
    flagged += _check_group("standing height", boxes,
                            [(view, "shaded") for view in ("front", "back", "left", "right")],
                            "height", HEIGHT_TOLERANCE)
    flagged += _check_pair("front vs back width", boxes,
                           ("front", "shaded"), ("back", "shaded"), "width", WIDTH_TOLERANCE)
    flagged += _check_pair("left vs right width, mirrored", boxes,
                           ("left", "shaded"), ("right", "shaded"), "width", WIDTH_TOLERANCE)
    for view in VIEWS:
        flagged += _check_pair(f"{view} shaded vs wireframe", boxes,
                               (view, "shaded"), (view, "wire"), "height", WIRE_TOLERANCE)

    if flagged:
        print(f"\n{flagged} check(s) exceeded tolerance — look at those views before building on them.")
    else:
        print("\nAll proportion checks within tolerance.")
    return 0


def _options() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, type=Path)
    return parser.parse_args()


def _measure_all(root: Path) -> dict[tuple[str, str], dict]:
    boxes = {}
    for view in VIEWS:
        for kind, tag in (("shaded", view), ("wire", f"{view}-wire")):
            source = _source(root, tag)
            if source is None:
                continue
            box = _measure(source)
            boxes[(view, kind)] = box
            print(f"MEASURED {view:6s} {kind:6s} {box['width']:4d}x{box['height']:4d}px  "
                  f"{box['widthShare'] * 100:4.1f}%W {box['heightShare'] * 100:4.1f}%H  "
                  f"bg={box['background']}")
    return boxes


def _measure(path: Path) -> dict:
    raw = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
    height, width = raw.shape[:2]
    corner = raw[:BACKGROUND_MARGIN, :BACKGROUND_MARGIN].reshape(-1, 3)
    background = np.median(corner, axis=0)
    gap = np.abs(raw - background).sum(axis=2)
    subject = gap > BACKGROUND_MARGIN
    if not subject.any():
        raise MeasureError(f"{path.name} carries no subject distinct from its background.")
    rows = np.where(subject.any(axis=1))[0]
    columns = np.where(subject.any(axis=0))[0]
    box_height = int(rows[-1] - rows[0] + 1)
    box_width = int(columns[-1] - columns[0] + 1)
    return {
        "width": box_width, "height": box_height,
        "widthShare": box_width / width, "heightShare": box_height / height,
        "background": background.astype(int).tolist(),
    }


def _check_group(label: str, boxes: dict, keys: list[tuple[str, str]],
                  field: str, tolerance: float) -> int:
    present = [(key, boxes[key][field]) for key in keys if key in boxes]
    if len(present) < 2:
        return 0
    values = [value for _, value in present]
    spread = (max(values) - min(values)) / (sum(values) / len(values))
    verdict = "OK" if spread <= tolerance else "WARN"
    detail = ", ".join(f"{key[0]}={value}px" for key, value in present)
    print(f"CHECK {label:<28} {detail}  spread={spread * 100:.1f}%  {verdict}")
    return 0 if verdict == "OK" else 1


def _check_pair(label: str, boxes: dict, first: tuple[str, str], second: tuple[str, str],
                field: str, tolerance: float) -> int:
    if first not in boxes or second not in boxes:
        return 0
    a, b = boxes[first][field], boxes[second][field]
    spread = abs(a - b) / ((a + b) / 2)
    verdict = "OK" if spread <= tolerance else "WARN"
    print(f"CHECK {label:<28} {first[0]}={a}px {second[0]}={b}px  "
          f"spread={spread * 100:.1f}%  {verdict}")
    return 0 if verdict == "OK" else 1


def _source(root: Path, tag: str) -> Path | None:
    for suffix in (".png", ".jpeg", ".jpg", ".webp"):
        candidate = root / f"{tag}{suffix}"
        if candidate.exists():
            return candidate
    return None


if __name__ == "__main__":
    sys.exit(main())
