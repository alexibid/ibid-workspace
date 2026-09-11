import cv2
import numpy as np
from scipy import ndimage


DARK_LUMA = 70
SMALLEST_MARK = 200
LARGEST_MARK_SHARE = 0.01
GROW = 12
RING = 10


def marks(colour: np.ndarray, skin: np.ndarray) -> np.ndarray:
    luma = cv2.cvtColor(colour, cv2.COLOR_RGB2GRAY)
    labels, count = ndimage.label((luma < DARK_LUMA) & skin)
    sizes = np.bincount(labels.ravel())
    ceiling = LARGEST_MARK_SHARE * float(skin.sum())
    chosen = [index for index in range(1, count + 1)
              if SMALLEST_MARK < sizes[index] < ceiling]
    return np.isin(labels, chosen)


def fill(colour: np.ndarray, found: np.ndarray, skin: np.ndarray) -> np.ndarray:
    grown = ndimage.binary_dilation(found, iterations=GROW)
    ring = ndimage.binary_dilation(grown, iterations=RING) & ~grown & skin
    filled = colour.copy()
    for channel in range(3):
        plane = filled[:, :, channel]
        source = plane[ring] if ring.any() else plane[skin]
        plane[grown] = int(np.median(source))
    return np.where(skin[:, :, None], filled, 255).astype(np.uint8)


BLACK_POINT = 70.0
WHITE_POINT = 95.0


def engrave(filled: np.ndarray, skin: np.ndarray) -> np.ndarray:
    grey = cv2.cvtColor(filled, cv2.COLOR_RGB2GRAY)
    across = cv2.Sobel(grey, cv2.CV_32F, 1, 0, ksize=3)
    down = cv2.Sobel(grey, cv2.CV_32F, 0, 1, ksize=3)
    edges = np.hypot(across, down)

    low = float(np.percentile(edges[skin], BLACK_POINT))
    high = float(np.percentile(edges[skin], WHITE_POINT))
    lifted = 1.0 - np.clip((edges - low) / max(high - low, 1e-9), 0, 1)

    engraved = np.clip(filled.astype(np.float32) * lifted[:, :, None], 0, 255)
    return np.where(skin[:, :, None], engraved, 255).astype(np.uint8)
