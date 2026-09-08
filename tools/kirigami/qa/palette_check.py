import base64
import re
import tempfile
from pathlib import Path

import bpy
import numpy

EMBEDDED = re.compile(r"data:image/png;base64,([A-Za-z0-9+/=\s]+?)['\"]")
QUANTISE = 20
INK_THRESHOLD = 0.90


def colours_in_net(svg: Path, keep: Path | None = None) -> dict:
    payloads = EMBEDDED.findall(svg.read_text())
    if not payloads:
        return {"embedded": 0, "colours": 0, "inked": 0.0, "preview": None}
    if keep is not None:
        keep.write_bytes(base64.b64decode("".join(_widest(payloads).split())))

    seen: set[tuple[int, int, int]] = set()
    inked = 0.0
    for payload in payloads:
        pixels = _load(payload)
        if pixels is None:
            continue
        flat = pixels.reshape(-1, 4)
        solid = flat[flat[:, 3] > 0.5][:, :3]
        if len(solid) == 0:
            continue
        inked = max(inked, float((solid.max(axis=1) < INK_THRESHOLD).mean()))
        buckets = numpy.floor(solid * QUANTISE).astype(int)
        seen.update(map(tuple, numpy.unique(buckets, axis=0)))
    return {"embedded": len(payloads), "colours": len(seen), "inked": round(inked, 4),
            "preview": keep.name if keep is not None else None}


def _widest(payloads: list[str]) -> str:
    return max(payloads, key=len)


def _load(payload: str):
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as handle:
        handle.write(base64.b64decode("".join(payload.split())))
        path = handle.name
    image = bpy.data.images.load(path)
    try:
        pixels = numpy.array(image.pixels[:], dtype=numpy.float32)
        return pixels.reshape(image.size[1], image.size[0], 4)
    finally:
        bpy.data.images.remove(image)
        Path(path).unlink(missing_ok=True)
