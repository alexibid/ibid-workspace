import numpy as np
from scipy import ndimage

DEFAULTS = {
    "groundLuma": 170,
    "markLuma": 140,
    "tintSpread": 26,
    "smallestShare": 0.00004,
    "largestShare": 0.02,
}
SUPPORT_RING = 11
SUPPORT_SHARE = 0.55


def marks(canvas: np.ndarray, subject: tuple[int, int, int, int], skin: np.ndarray,
          settings: dict | None = None) -> list[tuple[str, np.ndarray]]:
    dials = {**DEFAULTS, **(settings or {})}
    tones = canvas.astype(np.int16)
    inside = skin & _inside(tones.shape[:2], subject)
    luma = tones.mean(axis=2)
    ground = (luma > dials["groundLuma"]) & inside

    dark = (luma < dials["markLuma"]) & inside
    spread = tones.max(axis=2) - tones.min(axis=2)
    warm = tones[:, :, 0] - tones[:, :, 2]
    tinted = (spread > dials["tintSpread"]) & (warm > dials["tintSpread"]) & inside & ~dark

    span = max((subject[2] - subject[0]) * (subject[3] - subject[1]), 1)
    limits = (dials["smallestShare"] * span, dials["largestShare"] * span)
    return ([("mark", blob) for blob in _blobs(dark, ground, limits)]
            + [("tint", blob) for blob in _blobs(tinted, ground, limits)])


def _blobs(candidate: np.ndarray, ground: np.ndarray,
           limits: tuple[float, float]) -> list[np.ndarray]:
    labels, count = ndimage.label(candidate)
    kept = []
    for index in range(1, count + 1):
        blob = labels == index
        if not limits[0] <= blob.sum() <= limits[1]:
            continue
        if _support(blob, ground) < SUPPORT_SHARE:
            continue
        kept.append(blob)
    return sorted(kept, key=lambda blob: -blob.sum())


def _support(blob: np.ndarray, ground: np.ndarray) -> float:
    window = _window(blob, SUPPORT_RING)
    near = blob[window]
    ring = ndimage.binary_dilation(near, iterations=SUPPORT_RING) & ~near
    return float(ground[window][ring].mean()) if ring.any() else 0.0


def _window(blob: np.ndarray, margin: int) -> tuple[slice, slice]:
    rows = np.where(blob.any(axis=1))[0]
    columns = np.where(blob.any(axis=0))[0]
    return (slice(max(0, rows[0] - margin), rows[-1] + margin + 1),
            slice(max(0, columns[0] - margin), columns[-1] + margin + 1))


def _inside(shape: tuple[int, int], subject: tuple[int, int, int, int]) -> np.ndarray:
    inside = np.zeros(shape, dtype=bool)
    inside[subject[1]:subject[3], subject[0]:subject[2]] = True
    return inside
