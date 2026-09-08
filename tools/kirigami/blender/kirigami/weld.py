import bpy

from .refine import unify, voxel_for
from .repair import tidy
from .selection import activate
from .symmetry import mirror

SOLVER = "EXACT"


class WeldError(RuntimeError):
    pass


def union(name: str, solids: list[bpy.types.Object], mirror_axis: str | None,
          min_feature_mm: float, skin_faces: int | None = None) -> bpy.types.Object:
    return _fuse(name, solids, "UNION", mirror_axis, min_feature_mm, skin_faces)


def carve(name: str, solid: bpy.types.Object, cutters: list[bpy.types.Object],
          mirror_axis: str | None, min_feature_mm: float,
          skin_faces: int | None = None) -> bpy.types.Object:
    return _fuse(name, [solid, *cutters], "DIFFERENCE", mirror_axis, min_feature_mm, skin_faces)


def _fuse(name: str, solids: list[bpy.types.Object], operation: str,
          mirror_axis: str | None, min_feature_mm: float,
          skin_faces: int | None) -> bpy.types.Object:
    if not solids:
        raise WeldError(f"Part '{name}' was welded from no solids at all.")
    base, *rest = solids
    activate(base)
    for other in rest:
        _apply_boolean(base, other, operation)
    for other in rest:
        bpy.data.objects.remove(other, do_unlink=True)
    base.name = name
    base.data.name = name
    if mirror_axis:
        mirror(base, mirror_axis)
    if skin_faces:
        unify(base, voxel_for(min_feature_mm), skin_faces)
    tidy(base, min_feature_mm)
    return base


def _apply_boolean(base: bpy.types.Object, other: bpy.types.Object, operation: str) -> None:
    modifier = base.modifiers.new(name=f"weld_{other.name}", type="BOOLEAN")
    modifier.operation = operation
    modifier.solver = SOLVER
    modifier.use_self = True
    modifier.use_hole_tolerant = True
    modifier.object = other
    activate(base)
    try:
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    except RuntimeError as error:
        raise WeldError(
            f"Boolean {operation} of '{other.name}' into '{base.name}' failed: {error}"
        ) from error


