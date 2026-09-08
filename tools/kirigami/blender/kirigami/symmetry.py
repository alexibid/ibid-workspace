import bpy

from .selection import activate
from .shapes import MM

SEAM_MERGE_MM = 0.2
AXES = ("x", "y", "z")


class SymmetryError(ValueError):
    pass


def mirror(obj: bpy.types.Object, axis: str) -> bpy.types.Object:
    if axis not in AXES:
        raise SymmetryError(f"The mirror axis must be one of {', '.join(AXES)}, got '{axis}'.")

    plane = bpy.data.objects.new(f"{obj.name}_plane", None)
    bpy.context.collection.objects.link(plane)
    plane.matrix_world.identity()

    modifier = obj.modifiers.new(name=f"mirror_{axis}", type="MIRROR")
    modifier.use_axis = tuple(candidate == axis for candidate in AXES)
    modifier.use_bisect_axis = modifier.use_axis
    modifier.use_mirror_merge = True
    modifier.merge_threshold = SEAM_MERGE_MM * MM
    modifier.mirror_object = plane

    activate(obj)
    try:
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    finally:
        bpy.data.objects.remove(plane, do_unlink=True)

    if len(obj.data.polygons) == 0:
        raise SymmetryError(
            f"Mirroring '{obj.name}' across {axis} left nothing. Every solid sits on the "
            f"discarded side of the plane — build the half on the positive {axis}."
        )
    return obj
