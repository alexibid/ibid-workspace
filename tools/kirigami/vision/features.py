import argparse
import json
import sys
from pathlib import Path
from typing import NamedTuple

sys.path.insert(0, str(Path(__file__).resolve().parent))

from store import RESOURCES, SEGMENTER, VIEWS  # noqa: E402

import numpy as np  # noqa: E402
import rembg  # noqa: E402
from PIL import Image  # noqa: E402
from ultralytics import SAM  # noqa: E402

from drawn import marks  # noqa: E402

SMALLEST = 0.0004
LARGEST = 0.06
PAIR_TOLERANCE = 0.22
UPPER_HALF = 0.62
FILL_RING = 9


class FeatureError(RuntimeError):
    pass


class Carving(NamedTuple):
    view: str
    image: Path
    flat: Path
    catalogue: Path
    art: Path
    looksForEyes: bool
    settings: dict


def main() -> int:
    options = read_options()
    jobs = _jobs(options)
    found = sum(_carve(job, options.device) for job in jobs)
    print(f"MEASURED subject figures={found} across {len(jobs)} view(s)")
    return 0


def read_options() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--subject")
    parser.add_argument("--image", type=Path)
    parser.add_argument("--out", type=Path)
    parser.add_argument("--device", default="mps")
    return parser.parse_args()


def _jobs(options: argparse.Namespace) -> list[Carving]:
    if options.subject:
        return _subject_jobs(RESOURCES / options.subject)
    if not options.image or not options.out:
        raise FeatureError("Give either --subject, or both --image and --out.")
    return [Carving("reference", options.image, options.out / "flat.png",
                    options.out / "features.json", options.out / "regions", True, {})]


def _subject_jobs(root: Path) -> list[Carving]:
    if not root.is_dir():
        raise FeatureError(f"There is no subject at {root}.")
    settings = _settings(root)
    jobs = [Carving(view, source, root / "flat" / f"{view}.png",
                    root / "figures" / f"{view}.json", root / "figures" / view,
                    view == "front", settings)
            for view in VIEWS for source in [_view(root, view)] if source]
    if not jobs:
        raise FeatureError(f"{root.name} holds none of the views {', '.join(VIEWS)}.")
    return jobs


def _settings(root: Path) -> dict:
    contract = root / "model.json"
    if not contract.exists():
        return {}
    return json.loads(contract.read_text()).get("figures", {}).get("detector", {})


def _view(root: Path, view: str) -> Path | None:
    for suffix in (".jpeg", ".jpg", ".png"):
        candidate = root / f"{view}{suffix}"
        if candidate.exists():
            return candidate
    return None


def _carve(job: Carving, device: str) -> int:
    picture = Image.open(job.image).convert("RGB")
    canvas = np.asarray(picture).astype(np.uint8)
    skin = _cutout(picture)
    subject = _bounds(skin, job.image.name)
    masks = _segment(job.image, device)

    eyes = _eye_pair(masks, canvas, subject) if job.looksForEyes else []
    found = [("eye", mask) for mask in eyes] + marks(canvas, subject, skin, job.settings)
    features = [_describe(kind, mask, canvas, subject) for kind, mask in found]
    print(f"MEASURED {job.view} masks={len(masks)} figures={len(features)}")
    for feature in features:
        print(f"MEASURED {job.view} {feature['kind']:5s} {feature['hex']} "
              f"at {[round(v, 3) for v in feature['at']]} "
              f"size {[round(v, 3) for v in feature['size']]}")

    chosen = [mask for _, mask in found]
    job.flat.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(_flatten(canvas, chosen)).save(job.flat)

    job.art.mkdir(parents=True, exist_ok=True)
    for index, (feature, mask) in enumerate(zip(features, chosen)):
        name = f"{feature['kind']}-{index}.png"
        _artwork(canvas, mask).save(job.art / name)
        feature["art"] = f"{job.art.name}/{name}"

    job.catalogue.parent.mkdir(parents=True, exist_ok=True)
    job.catalogue.write_text(json.dumps({
        "source": str(job.image),
        "view": job.view,
        "subject": {"x0": int(subject[0]), "y0": int(subject[1]),
                    "x1": int(subject[2]), "y1": int(subject[3])},
        "features": features,
    }, indent=2))
    print(f"CARVED {job.catalogue} {len(features)} figure(s)")
    return len(features)


def _segment(image: Path, device: str) -> list[np.ndarray]:
    result = SAM(SEGMENTER)(str(image), device=device, verbose=False)[0]
    if result.masks is None:
        raise FeatureError(f"The segmenter found nothing in {image.name}.")
    found = [mask > 0.5 for mask in result.masks.data.cpu().numpy()]
    return [mask for mask in found if mask.any()]


def _cutout(picture: Image.Image) -> np.ndarray:
    cut = rembg.remove(picture, session=_session())
    alpha = np.asarray(cut.convert("RGBA"))[:, :, 3]
    return alpha > 128


def _session():
    if not hasattr(_session, "held"):
        _session.held = rembg.new_session()
    return _session.held


def _bounds(skin: np.ndarray, name: str) -> tuple[int, int, int, int]:
    rows = np.where(skin.any(axis=1))[0]
    columns = np.where(skin.any(axis=0))[0]
    if not len(rows):
        raise FeatureError(f"The background remover found no subject in {name}.")
    return int(columns[0]), int(rows[0]), int(columns[-1]), int(rows[-1])


def _eye_pair(masks: list[np.ndarray], canvas: np.ndarray,
              subject: tuple[int, int, int, int]) -> list[np.ndarray]:
    candidates = [mask for mask in masks if _plausible(mask, canvas, subject)]
    middle = (subject[0] + subject[2]) / 2
    best = None
    for index, left in enumerate(candidates):
        for right in candidates[index + 1:]:
            score = _pairing(left, right, middle)
            if score is not None and (best is None or score < best[0]):
                order = sorted((left, right), key=lambda mask: _box(mask)[0])
                best = (score, order)
    return best[1] if best else []


def _plausible(mask: np.ndarray, canvas: np.ndarray,
               subject: tuple[int, int, int, int]) -> bool:
    span = (subject[2] - subject[0]) * (subject[3] - subject[1])
    area = int(mask.sum())
    if not span or not SMALLEST <= area / span <= LARGEST:
        return False
    x0, y0, x1, y1 = _box(mask)
    height = subject[3] - subject[1]
    above = 1.0 - ((y0 + y1) / 2 - subject[1]) / max(height, 1)
    return above >= 1.0 - UPPER_HALF


def _pairing(left: np.ndarray, right: np.ndarray, middle: float) -> float | None:
    one, two = _box(left), _box(right)
    if abs((one[1] + one[3]) - (two[1] + two[3])) / 2 > (one[3] - one[1]):
        return None
    sizes = [(one[2] - one[0]) * (one[3] - one[1]), (two[2] - two[0]) * (two[3] - two[1])]
    if min(sizes) <= 0 or max(sizes) / min(sizes) > 1 + PAIR_TOLERANCE:
        return None
    reach = [(one[0] + one[2]) / 2 - middle, (two[0] + two[2]) / 2 - middle]
    if reach[0] * reach[1] >= 0:
        return None
    return abs(abs(reach[0]) - abs(reach[1]))


def _describe(kind: str, mask: np.ndarray, canvas: np.ndarray,
              subject: tuple[int, int, int, int]) -> dict:
    x0, y0, x1, y1 = _box(mask)
    width = max(subject[2] - subject[0], 1)
    height = max(subject[3] - subject[1], 1)
    pixels = canvas[mask].astype(float)
    darkest = pixels[pixels.mean(axis=1) <= np.percentile(pixels.mean(axis=1), 35)]
    tone = darkest.mean(axis=0) if len(darkest) else pixels.mean(axis=0)
    return {
        "kind": kind,
        "hex": "#%02X%02X%02X" % tuple(int(round(channel)) for channel in tone),
        "at": [((x0 + x1) / 2 - subject[0]) / width,
               1.0 - ((y0 + y1) / 2 - subject[1]) / height],
        "size": [(x1 - x0) / width, (y1 - y0) / height],
    }


def _artwork(canvas: np.ndarray, mask: np.ndarray) -> Image.Image:
    x0, y0, x1, y1 = _box(mask)
    patch = canvas[y0:y1 + 1, x0:x1 + 1]
    alpha = (mask[y0:y1 + 1, x0:x1 + 1] * 255).astype(np.uint8)
    return Image.fromarray(np.dstack([patch, alpha]), mode="RGBA")


def _flatten(canvas: np.ndarray, masks: list[np.ndarray]) -> np.ndarray:
    flattened = canvas.copy()
    for mask in masks:
        x0, y0, x1, y1 = _box(mask)
        ring = np.zeros(mask.shape, dtype=bool)
        ring[max(0, y0 - FILL_RING):y1 + FILL_RING, max(0, x0 - FILL_RING):x1 + FILL_RING] = True
        ring &= ~_grown(mask)
        if not ring.any():
            continue
        flattened[mask] = np.median(canvas[ring], axis=0).astype(np.uint8)
    return flattened


def _grown(mask: np.ndarray) -> np.ndarray:
    grown = mask.copy()
    for shift in range(1, FILL_RING + 1):
        grown[shift:, :] |= mask[:-shift, :]
        grown[:-shift, :] |= mask[shift:, :]
        grown[:, shift:] |= mask[:, :-shift]
        grown[:, :-shift] |= mask[:, shift:]
    return grown


def _box(mask: np.ndarray) -> tuple[int, int, int, int]:
    rows = np.where(mask.any(axis=1))[0]
    columns = np.where(mask.any(axis=0))[0]
    return int(columns[0]), int(rows[0]), int(columns[-1]), int(rows[-1])


if __name__ == "__main__":
    sys.exit(main())
