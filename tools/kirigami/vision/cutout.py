import argparse
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from journal import Timer  # noqa: E402
from progress import Meter, Step, announce  # noqa: E402
from store import RESOURCES, VIEWS  # noqa: E402

import rembg  # noqa: E402
from PIL import Image  # noqa: E402

MODEL = "birefnet-general"


class CutoutError(RuntimeError):
    pass


def main() -> int:
    options = _options()
    root = RESOURCES / options.subject
    if not root.is_dir():
        raise CutoutError(f"There is no subject at {root}.")
    out = root / "cutouts"
    out.mkdir(parents=True, exist_ok=True)

    with Timer(root, "cutout", "vision/cutout.py") as clock:
        clock.detail = {"model": options.model}
        _carve_all(root, out, options)
    _frame(root, out, options.height)
    print(f"CUT {out} model={options.model}")
    return 0


def _carve_all(root: Path, out: Path, options: argparse.Namespace) -> None:
    announce("cutter", options.model)
    with Step("load cutter"):
        session = rembg.new_session(options.model)

    found = [(view, _source(root, view)) for view in VIEWS]
    found = [(view, source) for view, source in found if source is not None]
    meter = Meter("cutout", len(found))
    for view, source in found:
        meter.retitle(f"cutout {view}")
        cut = rembg.remove(Image.open(source).convert("RGB"), session=session,
                           post_process_mask=options.polish)
        alpha = np.asarray(cut.convert("RGBA"))[:, :, 3]
        cut.save(out / f"{view}.png")
        meter.advance()
        print(f"MEASURED {view:6s} {source.name:12s} solid={int((alpha > 250).sum())} "
              f"soft={int(((alpha > 5) & (alpha <= 250)).sum())} "
              f"empty={int((alpha <= 5).sum())}")
    meter.close()


def _options() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--subject", required=True)
    parser.add_argument("--model", default=MODEL)
    parser.add_argument("--polish", action="store_true")
    parser.add_argument("--height", type=float, default=200.0)
    return parser.parse_args()


def _frame(root: Path, out: Path, height_mm: float) -> None:
    boxes = {}
    for view in VIEWS:
        cut = out / f"{view}.png"
        if not cut.exists():
            continue
        alpha = np.asarray(Image.open(cut).convert("RGBA"))[:, :, 3] > 128
        rows, columns = np.where(alpha.any(axis=1))[0], np.where(alpha.any(axis=0))[0]
        boxes[view] = (int(columns[-1] - columns[0] + 1), int(rows[-1] - rows[0] + 1))

    tall = [boxes[v][1] for v in ("front", "back", "left", "right") if v in boxes]
    lengths = [boxes[v][0] for v in ("left", "right") if v in boxes]
    widths = [boxes[v][0] for v in ("front", "back") if v in boxes]
    if not tall or not lengths or not widths:
        raise CutoutError("Need at least one side view and one facing view to measure the frame.")

    per_pixel = height_mm / (sum(tall) / len(tall))
    frame = {
        "heightMm": height_mm,
        "lengthMm": round(sum(lengths) / len(lengths) * per_pixel, 2),
        "widthMm": round(sum(widths) / len(widths) * per_pixel, 2),
        "heightSpread": round(max(tall) / min(tall) - 1, 4),
        "views": {view: {"pixels": list(box)} for view, box in boxes.items()},
    }
    (root / "frame.json").write_text(json.dumps(frame, indent=2) + "\n")
    print(f"MEASURED frame length={frame['lengthMm']}mm width={frame['widthMm']}mm "
          f"height={height_mm}mm spread={frame['heightSpread'] * 100:.1f}%")


def _source(root: Path, view: str) -> Path | None:
    for suffix in (".png", ".jpeg", ".jpg"):
        candidate = root / f"{view}{suffix}"
        if candidate.exists():
            return candidate
    return None


if __name__ == "__main__":
    sys.exit(main())
