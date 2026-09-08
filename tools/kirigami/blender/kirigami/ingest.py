from pathlib import Path

import bpy

from . import validate
from .refine import simplify
from .repair import tidy
from .selection import activate


class IngestError(RuntimeError):
    pass


RETREAT = 0.95
ATTEMPTS = 5


def adopt(name: str, mesh_path: str, faces: int, min_feature_mm: float) -> bpy.types.Object:
    path = Path(mesh_path)
    if not path.exists():
        raise IngestError(f"There is no mesh to adopt at {path}.")

    arrived = _import(path)
    if not arrived:
        raise IngestError(f"{path.name} carried no mesh.")
    source = max(arrived, key=lambda candidate: len(candidate.data.polygons))
    for other in arrived:
        if other is not source:
            bpy.data.objects.remove(other, do_unlink=True)

    activate(source)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    _wear_colours(source)

    target = faces
    complaints: dict = {}
    for _ in range(ATTEMPTS):
        candidate = _reduce(source, name, target, min_feature_mm)
        complaints = _offenders(candidate)
        if not complaints:
            bpy.data.objects.remove(source, do_unlink=True)
            candidate["kirigami_scanned"] = True
            activate(candidate)
            return candidate
        bpy.data.objects.remove(candidate, do_unlink=True)
        target = int(target * RETREAT)

    raise IngestError(
        f"'{name}' still carries {complaints} after retreating to {target} faces. The scan is "
        f"too tangled for this tier's face budget."
    )


def _reduce(source: bpy.types.Object, name: str, target: int,
            min_feature_mm: float) -> bpy.types.Object:
    candidate = source.copy()
    candidate.data = source.data.copy()
    bpy.context.collection.objects.link(candidate)
    candidate.name = name
    candidate.data.name = name
    simplify(candidate, target)
    tidy(candidate, min_feature_mm)
    _wear_colours(candidate)
    return candidate


def _offenders(obj: bpy.types.Object) -> dict:
    counted = validate.inspect(obj).as_dict()["offenders"]
    return {kind: count for kind, count in counted.items() if count}


SEPARATION = 60


def palette_of(obj: bpy.types.Object, most: int) -> list[str]:
    layer = obj.data.color_attributes.active_color
    if layer is None:
        return []
    tally: dict[tuple[int, int, int], int] = {}
    for entry in layer.data:
        key = tuple(min(255, max(0, round(_encode(channel) * 255) // 8 * 8))
                    for channel in entry.color[:3])
        tally[key] = tally.get(key, 0) + 1

    chosen: list[tuple[int, int, int]] = []
    for key, _ in sorted(tally.items(), key=lambda row: row[1], reverse=True):
        if all(_apart(key, taken) >= SEPARATION for taken in chosen):
            chosen.append(key)
        if len(chosen) == most:
            break
    return ["#%02X%02X%02X" % key for key in chosen]


def _apart(left: tuple[int, int, int], right: tuple[int, int, int]) -> float:
    return sum(abs(left[axis] - right[axis]) for axis in range(3)) / 3.0


def _encode(channel: float) -> float:
    if channel <= 0.0031308:
        return 12.92 * channel
    return 1.055 * (channel ** (1 / 2.4)) - 0.055


def _import(path: Path) -> list[bpy.types.Object]:
    before = set(bpy.data.objects)
    try:
        bpy.ops.import_scene.gltf(filepath=str(path))
    except RuntimeError as error:
        raise IngestError(f"{path.name} could not be imported: {error}") from error
    fresh = [obj for obj in bpy.data.objects if obj not in before]
    meshes = [obj for obj in fresh if obj.type == "MESH"]
    for obj in fresh:
        if obj.type != "MESH":
            bpy.data.objects.remove(obj, do_unlink=True)
    return meshes


def _wear_colours(obj: bpy.types.Object) -> None:
    layer = obj.data.color_attributes.active_color
    if layer is None:
        raise IngestError(
            f"'{obj.name}' arrived without vertex colours, so the net would print blank."
        )
    material = bpy.data.materials.new(name=f"{obj.name}_scanned")
    material.use_nodes = True
    tree = material.node_tree
    surface = tree.nodes.get("Principled BSDF")
    attribute = tree.nodes.new("ShaderNodeVertexColor")
    attribute.layer_name = layer.name
    tree.links.new(surface.inputs["Base Color"], attribute.outputs["Color"])
    surface.inputs["Roughness"].default_value = 0.86
    obj.data.materials.clear()
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.material_index = 0
