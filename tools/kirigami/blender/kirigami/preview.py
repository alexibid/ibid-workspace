from pathlib import Path

import bpy

from .selection import select_only


class PreviewError(RuntimeError):
    pass


def export_glb(parts: list[bpy.types.Object], target: Path) -> dict:
    if not parts:
        raise PreviewError("There is nothing to preview: the model has no parts.")
    target.parent.mkdir(parents=True, exist_ok=True)
    stand_ins = [_stand_in(part) for part in parts]
    try:
        return _write(stand_ins, target)
    finally:
        for stand_in in stand_ins:
            bpy.data.objects.remove(stand_in, do_unlink=True)


def _stand_in(part: bpy.types.Object) -> bpy.types.Object:
    copy = part.copy()
    copy.data = part.data.copy()
    bpy.context.collection.objects.link(copy)
    layer = copy.data.color_attributes.active_color
    if layer is not None:
        for entry in layer.data:
            entry.color = (*(_decode(channel) for channel in entry.color[:3]), entry.color[3])
    return copy


def _decode(channel: float) -> float:
    if channel <= 0.04045:
        return channel / 12.92
    return ((channel + 0.055) / 1.055) ** 2.4


def _write(parts: list[bpy.types.Object], target: Path) -> dict:
    select_only(parts)
    bpy.ops.export_scene.gltf(
        filepath=str(target),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
    )
    if not target.exists():
        raise PreviewError(f"The glTF exporter wrote no file at {target}.")
    return {"file": target.name, "bytes": target.stat().st_size, "parts": len(parts)}
