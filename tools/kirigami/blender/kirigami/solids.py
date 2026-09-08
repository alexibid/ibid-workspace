import math

import bmesh
import bpy
from mathutils import Vector

from .sculpt import SCULPTORS
from .shapes import MM, SolidShapeError, adopt, finish, half, place


def block(name: str, size: tuple[float, float, float],
          at: tuple[float, float, float] = (0, 0, 0),
          rotation: tuple[float, float, float] = (0, 0, 0)) -> bpy.types.Object:
    h = half(size)
    verts = [Vector((sx * h.x, sy * h.y, sz * h.z))
             for sz in (-1, 1) for sy in (-1, 1) for sx in (-1, 1)]
    faces = [(0, 1, 3, 2), (4, 5, 7, 6), (0, 1, 5, 4),
             (2, 3, 7, 6), (0, 2, 6, 4), (1, 3, 7, 5)]
    return place(finish(name, verts, faces), at, rotation)


def wedge(name: str, size: tuple[float, float, float], ridge: str = "y",
          ridge_offset: float = 0.5, at: tuple[float, float, float] = (0, 0, 0),
          rotation: tuple[float, float, float] = (0, 0, 0)) -> bpy.types.Object:
    if ridge not in ("x", "y"):
        raise SolidShapeError(f"Ridge axis must be 'x' or 'y', got '{ridge}'.")
    if not 0.0 <= ridge_offset <= 1.0:
        raise SolidShapeError(f"Ridge offset must sit in [0, 1], got {ridge_offset}.")
    h = half(size)
    base = [Vector((-h.x, -h.y, -h.z)), Vector((h.x, -h.y, -h.z)),
            Vector((h.x, h.y, -h.z)), Vector((-h.x, h.y, -h.z))]
    slide = (ridge_offset * 2.0 - 1.0)
    if ridge == "y":
        top = [Vector((slide * h.x, -h.y, h.z)), Vector((slide * h.x, h.y, h.z))]
        faces = [(0, 1, 2, 3), (4, 5), (0, 1, 4), (2, 3, 5), (1, 2, 5, 4), (3, 0, 4, 5)]
    else:
        top = [Vector((-h.x, slide * h.y, h.z)), Vector((h.x, slide * h.y, h.z))]
        faces = [(0, 1, 2, 3), (4, 5), (0, 3, 4), (1, 2, 5), (0, 1, 5, 4), (2, 3, 4, 5)]
    return place(finish(name, base + top, [f for f in faces if len(f) > 2]), at, rotation)


def pyramid(name: str, base: tuple[float, float], height: float,
            apex_shift: tuple[float, float] = (0.0, 0.0),
            at: tuple[float, float, float] = (0, 0, 0),
            rotation: tuple[float, float, float] = (0, 0, 0)) -> bpy.types.Object:
    h = half((base[0], base[1], height))
    corners = [Vector((-h.x, -h.y, -h.z)), Vector((h.x, -h.y, -h.z)),
               Vector((h.x, h.y, -h.z)), Vector((-h.x, h.y, -h.z))]
    apex = Vector((apex_shift[0] * h.x, apex_shift[1] * h.y, h.z))
    faces = [(0, 1, 2, 3), (0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4)]
    return place(finish(name, corners + [apex], faces), at, rotation)


def prism(name: str, radius: float, height: float, sides: int,
          at: tuple[float, float, float] = (0, 0, 0),
          rotation: tuple[float, float, float] = (0, 0, 0)) -> bpy.types.Object:
    if sides < 3:
        raise SolidShapeError(f"A prism needs at least three sides, got {sides}.")
    r = radius * MM
    z = height * MM * 0.5
    ring = [Vector((r * math.cos(math.tau * i / sides), r * math.sin(math.tau * i / sides), 0))
            for i in range(sides)]
    verts = [Vector((p.x, p.y, -z)) for p in ring] + [Vector((p.x, p.y, z)) for p in ring]
    faces: list[tuple[int, ...]] = [tuple(range(sides - 1, -1, -1)),
                                    tuple(range(sides, sides * 2))]
    faces += [(i, (i + 1) % sides, sides + (i + 1) % sides, sides + i) for i in range(sides)]
    return place(finish(name, verts, faces), at, rotation)


def lowpoly(name: str, size: tuple[float, float, float], subdivisions: int = 1,
            at: tuple[float, float, float] = (0, 0, 0),
            rotation: tuple[float, float, float] = (0, 0, 0)) -> bpy.types.Object:
    if not 1 <= subdivisions <= 3:
        raise SolidShapeError(f"Subdivisions must sit between 1 and 3, got {subdivisions}.")
    h = half(size)
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=1.0)
    bmesh.ops.scale(bm, vec=h, verts=bm.verts)
    bm.to_mesh(mesh)
    bm.free()
    return place(adopt(name, mesh), at, rotation)


def facet(name: str, profile: list[tuple[float, float]], height: float,
          at: tuple[float, float, float] = (0, 0, 0),
          rotation: tuple[float, float, float] = (0, 0, 0)) -> bpy.types.Object:
    if len(profile) < 3:
        raise SolidShapeError(f"A facet profile needs at least three points, got {len(profile)}.")
    count = len(profile)
    z = height * MM * 0.5
    verts = [Vector((x * MM, y * MM, -z)) for x, y in profile]
    verts += [Vector((x * MM, y * MM, z)) for x, y in profile]
    faces: list[tuple[int, ...]] = [tuple(range(count - 1, -1, -1)),
                                    tuple(range(count, count * 2))]
    faces += [(i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count)]
    return place(finish(name, verts, faces), at, rotation)


BUILDERS = {
    "block": block,
    "wedge": wedge,
    "pyramid": pyramid,
    "prism": prism,
    "lowpoly": lowpoly,
    "facet": facet,
    **SCULPTORS,
}
