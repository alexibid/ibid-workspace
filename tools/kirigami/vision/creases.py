import argparse
import re
import sys
from pathlib import Path

import cv2
import numpy as np
import vtracer
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import ink  # noqa: E402
import planar  # noqa: E402
from journal import Timer  # noqa: E402
from progress import Meter  # noqa: E402
from store import RESOURCES, VIEWS  # noqa: E402

TRACE = {
    "colormode": "color", "hierarchical": "cutout", "mode": "polygon",
    "filter_speckle": 32, "color_precision": 6, "layer_difference": 8,
    "corner_threshold": 60, "length_threshold": 4.0, "max_iterations": 10,
    "splice_threshold": 45, "path_precision": 2,
}


INSIDE_SHARE = 0.6
SHAPE = re.compile(r'<path[^>]*?d="([^"]+)"[^>]*?transform="translate\(([-\d.]+),([-\d.]+)\)"')
PAIR = re.compile(r"(-?[\d.]+),(-?[\d.]+)")


class CreaseError(RuntimeError):
    pass


def main() -> int:
    options = _options()
    root = RESOURCES / options.subject
    if not root.is_dir():
        raise CreaseError(f"There is no subject at {root}.")
    out = root / "scan" / "creases"
    out.mkdir(parents=True, exist_ok=True)

    with Timer(root, "creases", "vision/creases.py") as clock:
        clock.detail = {"views": _trace_all(root, out)}
    return 0


def _options() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--subject", required=True)
    return parser.parse_args()


def _trace_all(root: Path, out: Path) -> int:
    found = [(view, root / "cutouts" / f"{view}.png") for view in VIEWS]
    found = [(view, source) for view, source in found if source.exists()]
    if not found:
        raise CreaseError(f"{root.name} carries no cutouts; run the cutout stage first.")

    meter = Meter("creases", len(found))
    for view, source in found:
        meter.retitle(f"creases {view}")
        _trace(view, source, out)
        meter.advance()
    meter.close()
    return len(found)


def _trace(view: str, source: Path, out: Path) -> None:
    raw = np.asarray(Image.open(source).convert("RGBA"))
    colour, skin = np.ascontiguousarray(raw[:, :, :3]), raw[:, :, 3] > 128
    if not skin.any():
        raise CreaseError(f"The cutout {source.name} carries no subject.")

    optimised = out / f"{view}-optimized.png"
    Image.fromarray(ink.engrave(ink.fill(colour, ink.marks(colour, skin), skin),
                                skin)).save(optimised)

    scratch = out / f"{view}.trace.svg"
    vtracer.convert_image_to_svg_py(str(optimised), str(scratch), **TRACE)
    rings = _rings(scratch, skin)
    scratch.unlink()

    height, width = skin.shape
    built = planar.faces(rings, float(np.hypot(height, width)))
    counted = planar.survey(built, float(skin.sum()))
    _write(out / f"{view}.svg", width, height, built)
    print(f"MEASURED {view:6s} rings={len(rings)} faces={counted['faces']} "
          f"corners={counted['corners']} covered={counted['covered'] * 100:.1f}%")




def _rings(scratch: Path, skin: np.ndarray) -> list[np.ndarray]:
    inner = cv2.erode(skin.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    kept = []
    for chunk, across, down in SHAPE.findall(scratch.read_text()):
        pairs = PAIR.findall(chunk)
        if len(pairs) < 3:
            continue
        ring = np.array([[float(x) + float(across), float(y) + float(down)]
                         for x, y in pairs], np.float64)
        rows = np.clip(ring[:, 1].astype(int), 0, skin.shape[0] - 1)
        columns = np.clip(ring[:, 0].astype(int), 0, skin.shape[1] - 1)
        if inner[rows, columns].mean() >= INSIDE_SHARE:
            kept.append(ring)
    return kept


def _write(target: Path, width: int, height: int, built: list) -> None:
    body = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}">',
            '<g fill="none" stroke="#000000" stroke-width="1">']
    for shape in built:
        corners = list(shape.exterior.coords)[:-1]
        moves = " ".join(f"L{x:.2f},{y:.2f}" for x, y in corners[1:])
        body.append(f'<path d="M{corners[0][0]:.2f},{corners[0][1]:.2f} {moves} Z"/>')
    body += ["</g>", "</svg>"]
    target.write_text("\n".join(body) + "\n")


if __name__ == "__main__":
    sys.exit(main())
