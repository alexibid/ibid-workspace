import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from ultralytics import SAM

SEGMENTER = "mobile_sam.pt"
SMALLEST = 0.0004
LARGEST = 0.06
PAIR_TOLERANCE = 0.22
UPPER_HALF = 0.62
FILL_RING = 9
MOUTH_REACH = 1.1


class FeatureError(RuntimeError):
    pass


def main() -> int:
    options = read_options()
    options.out.mkdir(parents=True, exist_ok=True)

    picture = Image.open(options.image).convert("RGB")
    canvas = np.asarray(picture).astype(np.uint8)
    subject = _subject(canvas)
    masks = _segment(options.image, options.device)
    print(f"MEASURED segment masks={len(masks)}")

    eyes = _eye_pair(masks, canvas, subject)
    if not eyes:
        raise FeatureError(
            "No symmetric pair of eyes was found. Check that the reference is a front view "
            "with both eyes visible and unoccluded."
        )
    features = [_describe("eye", mask, canvas, subject) for mask in eyes]
    mouth = _mouth(masks, canvas, subject, eyes)
    if mouth is not None:
        features.append(_describe("mouth", mouth, canvas, subject))

    for feature in features:
        print(f"MEASURED feature {feature['kind']:6s} {feature['hex']} "
              f"at {[round(v, 3) for v in feature['at']]} size {[round(v, 3) for v in feature['size']]}")

    chosen = eyes + ([mouth] if mouth is not None else [])
    flattened = _flatten(canvas, chosen)
    Image.fromarray(flattened).save(options.out / "flat.png")

    art = options.out / "regions"
    art.mkdir(exist_ok=True)
    for index, (feature, mask) in enumerate(zip(features, chosen)):
        name = f"{feature['kind']}-{index}.png"
        _artwork(canvas, mask).save(art / name)
        feature["art"] = f"regions/{name}"

    (options.out / "features.json").write_text(json.dumps({
        "source": str(options.image),
        "subject": {"x0": int(subject[0]), "y0": int(subject[1]),
                    "x1": int(subject[2]), "y1": int(subject[3])},
        "features": features,
    }, indent=2))
    print(f"CARVED {options.out / 'flat.png'} {len(features)} feature(s)")
    return 0


def read_options() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--device", default="mps")
    return parser.parse_args()


def _segment(image: Path, device: str) -> list[np.ndarray]:
    result = SAM(SEGMENTER)(str(image), device=device, verbose=False)[0]
    if result.masks is None:
        raise FeatureError(f"The segmenter found nothing in {image.name}.")
    found = [mask > 0.5 for mask in result.masks.data.cpu().numpy()]
    return [mask for mask in found if mask.any()]


def _subject(canvas: np.ndarray) -> tuple[int, int, int, int]:
    lum = canvas.mean(axis=2)
    edge = np.concatenate([lum[:, :8], lum[:, -8:]], axis=1)
    ground = float(np.median(edge))
    body = np.abs(lum - ground) > 18
    rows = np.where(body.any(axis=1))[0]
    columns = np.where(body.any(axis=0))[0]
    if not len(rows):
        raise FeatureError("The reference has no subject against its background.")
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


def _mouth(masks: list[np.ndarray], canvas: np.ndarray,
           subject: tuple[int, int, int, int], eyes: list[np.ndarray]) -> np.ndarray | None:
    boxes = [_box(eye) for eye in eyes]
    middle = sum((box[0] + box[2]) / 2 for box in boxes) / 2
    floor = max(box[3] for box in boxes)
    apart = abs((boxes[0][0] + boxes[0][2]) / 2 - (boxes[1][0] + boxes[1][2]) / 2)
    widest = max(box[2] - box[0] for box in boxes)
    found = None
    for mask in masks:
        x0, y0, x1, y1 = _box(mask)
        if y0 < floor or (y0 + y1) / 2 > floor + apart * MOUTH_REACH:
            continue
        if abs((x0 + x1) / 2 - middle) > widest * 0.5:
            continue
        if x1 - x0 > widest or int(mask.sum()) < 1:
            continue
        if found is None or int(mask.sum()) > int(found.sum()):
            found = mask
    return found


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
