import math

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

MM = 0.001


class SolidShapeError(ValueError):
    pass


def finish(name: str, verts: list[Vector], faces: list[tuple[int, ...]]) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    made = [bm.verts.new(vertex) for vertex in verts]
    bm.verts.ensure_lookup_table()
    for indices in faces:
        bm.faces.new([made[index] for index in indices])
    bm.faces.ensure_lookup_table()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    return adopt(name, mesh)


def adopt(name: str, mesh: bpy.types.Mesh) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def place(obj: bpy.types.Object, at: tuple[float, float, float],
          rotation: tuple[float, float, float]) -> bpy.types.Object:
    obj.matrix_world = (
        Matrix.Translation(Vector(at) * MM)
        @ Euler([math.radians(angle) for angle in rotation], "XYZ").to_matrix().to_4x4()
    )
    return obj


def half(size: tuple[float, float, float]) -> Vector:
    if min(size) <= 0:
        raise SolidShapeError(f"Every dimension must be positive, got {size}.")
    return Vector(size) * MM * 0.5
