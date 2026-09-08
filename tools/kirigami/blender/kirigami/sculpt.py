import math

import bmesh
import bpy
from mathutils import Vector

from .shapes import MM, SolidShapeError, adopt, finish, place


def loft(name: str, spine: list[tuple[float, float, float]],
         sections: list[tuple[float, float]], sides: int = 8,
         at: tuple[float, float, float] = (0, 0, 0),
         rotation: tuple[float, float, float] = (0, 0, 0)) -> bpy.types.Object:
    if len(spine) < 2:
        raise SolidShapeError(f"A loft needs at least two spine stations, got {len(spine)}.")
    if len(sections) != len(spine):
        raise SolidShapeError(
            f"The loft has {len(spine)} spine stations but {len(sections)} sections."
        )
    if not 3 <= sides <= 16:
        raise SolidShapeError(f"A loft ring must have between 3 and 16 sides, got {sides}.")

    centres = [Vector(point) * MM for point in spine]
    rings = _transport_rings(centres, sections, sides)
    verts = [vertex for ring in rings for vertex in ring]

    faces: list[tuple[int, ...]] = [tuple(range(sides - 1, -1, -1))]
    for station in range(len(rings) - 1):
        low = station * sides
        high = low + sides
        faces += [
            (low + step, low + (step + 1) % sides, high + (step + 1) % sides, high + step)
            for step in range(sides)
        ]
    last = (len(rings) - 1) * sides
    faces.append(tuple(range(last, last + sides)))
    return place(finish(name, verts, faces), at, rotation)


def _transport_rings(centres: list[Vector], sections: list[tuple[float, float]],
                     sides: int) -> list[list[Vector]]:
    tangents = _tangents(centres)
    across, along = _seed_frame(tangents[0])
    rings = []
    for station, centre in enumerate(centres):
        if station > 0:
            turn = tangents[station - 1].rotation_difference(tangents[station])
            across = turn @ across
            along = turn @ along
        width, depth = sections[station]
        if width <= 0 or depth <= 0:
            raise SolidShapeError(f"Loft section {station} must be positive, got {(width, depth)}.")
        rings.append([
            centre
            + across * (width * MM * 0.5 * math.cos(math.tau * step / sides))
            + along * (depth * MM * 0.5 * math.sin(math.tau * step / sides))
            for step in range(sides)
        ])
    return rings


def _tangents(centres: list[Vector]) -> list[Vector]:
    tangents = []
    for station, centre in enumerate(centres):
        ahead = centres[min(station + 1, len(centres) - 1)]
        behind = centres[max(station - 1, 0)]
        direction = ahead - behind
        if direction.length < 1e-9:
            raise SolidShapeError("Two loft stations sit on top of each other.")
        tangents.append(direction.normalized())
    return tangents


def _seed_frame(tangent: Vector) -> tuple[Vector, Vector]:
    reference = Vector((0, 0, 1)) if abs(tangent.z) < 0.9 else Vector((1, 0, 0))
    across = reference.cross(tangent).normalized()
    return across, tangent.cross(across).normalized()


def hull(name: str, points: list[tuple[float, float, float]],
         at: tuple[float, float, float] = (0, 0, 0),
         rotation: tuple[float, float, float] = (0, 0, 0)) -> bpy.types.Object:
    if len(points) < 4:
        raise SolidShapeError(f"A hull needs at least four points, got {len(points)}.")
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    for point in points:
        bm.verts.new(Vector(point) * MM)
    bm.verts.ensure_lookup_table()
    outcome = bmesh.ops.convex_hull(bm, input=bm.verts, use_existing_faces=False)
    leftovers = {}
    for key in ("geom_interior", "geom_unused", "geom_holes"):
        for element in outcome.get(key, ()):
            leftovers[id(element)] = element
    if leftovers:
        bmesh.ops.delete(bm, geom=list(leftovers.values()), context="VERTS")
    if len(bm.faces) < 4:
        bm.free()
        bpy.data.meshes.remove(mesh)
        raise SolidShapeError(f"The points given to hull '{name}' are flat, so they enclose nothing.")
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    return place(adopt(name, mesh), at, rotation)


SCULPTORS = {
    "loft": loft,
    "hull": hull,
}
