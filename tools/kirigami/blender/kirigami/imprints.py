import json
from pathlib import Path

import bpy
from mathutils import Vector

from .shapes import MM

COVERAGE = 0.35


class ImprintError(RuntimeError):
    pass


def apply(obj: bpy.types.Object, features_path: str, most: int) -> list[dict]:
    path = Path(features_path)
    if not path.exists():
        raise ImprintError(f"There are no features to imprint at {path}.")
    catalogue = json.loads(path.read_text())
    regions = catalogue.get("features", [])
    if not regions:
        raise ImprintError(f"{path.name} lists no regions to imprint.")
    if len(regions) > most:
        raise ImprintError(f"{len(regions)} regions exceed the {most} the tier allows.")

    layer = obj.data.color_attributes.active_color
    if layer is None:
        raise ImprintError(f"'{obj.name}' has no colour layer to imprint onto.")

    frame = _frame(obj, regions)
    stuck = []
    for region in regions:
        art = _read(path.parent / region["art"])
        painted = _paste(obj, layer, region, art, frame)
        if not painted:
            raise ImprintError(
                f"Region '{region['kind']}' at {region['at']} covered no face of "
                f"'{obj.name}'. The reference and the mesh are not aligned."
            )
        stuck.append({"role": region["hex"], "region": region["kind"], "faces": painted})
        print(f"MEASURED imprint {region['kind']} covered {painted} loops")
    return stuck


def _frame(obj: bpy.types.Object, regions: list[dict]) -> tuple[float, float, float]:
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    low = Vector(min(c[axis] for c in corners) for axis in range(3))
    high = Vector(max(c[axis] for c in corners) for axis in range(3))
    across = (high.y - low.y) / MM
    tall = (high.z - low.z) / MM
    pairs = [region["at"][0] for region in regions if region["kind"] == "eye"]
    middle = sum(pairs) / len(pairs) if len(pairs) == 2 else 0.5
    return across, tall, middle


def _paste(obj: bpy.types.Object, layer, region: dict, art,
           frame: tuple[float, float, float]) -> int:
    across, tall, middle = frame
    pixels, width, height = art
    left = region["at"][0] - region["size"][0] / 2
    bottom = region["at"][1] - region["size"][1] / 2

    painted = 0
    mesh = obj.data
    for polygon in mesh.polygons:
        for index in polygon.loop_indices:
            point = obj.matrix_world @ mesh.vertices[mesh.loops[index].vertex_index].co
            across_at = middle - (point.y / MM) / across
            up_at = (point.z / MM) / tall
            u = (across_at - left) / region["size"][0]
            v = (up_at - bottom) / region["size"][1]
            if not (0.0 <= u < 1.0 and 0.0 <= v < 1.0):
                continue
            column = min(width - 1, int(u * width))
            row = min(height - 1, int(v * height))
            red, green, blue, alpha = pixels[row * width + column]
            if alpha < COVERAGE * 255:
                continue
            layer.data[index].color = (_linear(red), _linear(green), _linear(blue), 1.0)
            painted += 1
    return painted


def _read(path: Path):
    if not path.exists():
        raise ImprintError(f"The region artwork {path} is missing.")
    image = bpy.data.images.load(str(path))
    image.colorspace_settings.name = "Non-Color"
    width, height = image.size
    flat = list(image.pixels)
    pixels = [tuple(int(round(channel * 255)) for channel in flat[index:index + 4])
              for index in range(0, len(flat), 4)]
    bpy.data.images.remove(image)
    return pixels, width, height


def _linear(channel: int) -> float:
    value = channel / 255.0
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4
