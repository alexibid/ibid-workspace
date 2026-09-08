import bpy

from .selection import activate
from .shapes import MM

VOXEL_SHARE = 3.5
RELAX_FACTOR = 0.55
RELAX_PASSES = 4


class RefineError(RuntimeError):
    pass


def voxel_for(min_feature_mm: float) -> float:
    return min_feature_mm / VOXEL_SHARE


def unify(obj: bpy.types.Object, voxel_mm: float, triangles: int) -> None:
    if voxel_mm <= 0:
        raise RefineError(f"'{obj.name}' needs a positive voxel size, got {voxel_mm}.")
    if triangles <= 0:
        raise RefineError(f"'{obj.name}' needs a positive triangle target, got {triangles}.")
    activate(obj)
    _apply(obj, "skin", "REMESH", mode="VOXEL", voxel_size=voxel_mm * MM)
    _apply(obj, "relax", "SMOOTH", factor=RELAX_FACTOR, iterations=RELAX_PASSES)
    _apply(obj, "facet", "TRIANGULATE")

    present = len(obj.data.polygons)
    if present > triangles:
        _apply(obj, "thin", "DECIMATE", decimate_type="COLLAPSE", ratio=triangles / present)
        _apply(obj, "refacet", "TRIANGULATE")
    for polygon in obj.data.polygons:
        polygon.use_smooth = False


def simplify(obj: bpy.types.Object, triangles: int) -> None:
    if triangles <= 0:
        raise RefineError(f"'{obj.name}' needs a positive triangle target, got {triangles}.")
    activate(obj)
    _apply(obj, "relax", "SMOOTH", factor=RELAX_FACTOR, iterations=RELAX_PASSES + 2)
    _apply(obj, "facet", "TRIANGULATE")

    present = len(obj.data.polygons)
    if present > triangles:
        _apply(obj, "thin", "DECIMATE", decimate_type="COLLAPSE", ratio=triangles / present)
        _apply(obj, "refacet", "TRIANGULATE")
    for polygon in obj.data.polygons:
        polygon.use_smooth = False


def _apply(obj: bpy.types.Object, name: str, kind: str, **settings) -> None:
    modifier = obj.modifiers.new(name=name, type=kind)
    for key, value in settings.items():
        setattr(modifier, key, value)
    try:
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    except RuntimeError as error:
        raise RefineError(f"'{obj.name}' could not be refined by {kind}: {error}") from error
