import bmesh
import bpy

from .shapes import MM
from .validate import WELD_DISTANCE, is_null_face, is_twisted

SLIVER_START = 2e-4
SLIVER_RATIO = 0.25


def tidy(obj: bpy.types.Object, min_feature_mm: float) -> None:
    bm = bmesh.new()
    bm.from_mesh(obj.data)

    _merge(bm)
    _drop_loose(bm)
    _triangulate_twisted(bm)
    _dissolve_slivers(bm, min_feature_mm * MM * SLIVER_RATIO)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()


def _merge(bm: bmesh.types.BMesh) -> None:
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=WELD_DISTANCE)


def _drop_loose(bm: bmesh.types.BMesh) -> None:
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    stray_edges = [edge for edge in bm.edges if not edge.link_faces]
    if stray_edges:
        bmesh.ops.delete(bm, geom=stray_edges, context="EDGES")
    stray_verts = [vert for vert in bm.verts if not vert.link_edges]
    if stray_verts:
        bmesh.ops.delete(bm, geom=stray_verts, context="VERTS")


def _triangulate_twisted(bm: bmesh.types.BMesh) -> None:
    bm.faces.ensure_lookup_table()
    twisted = [face for face in bm.faces if is_twisted(face)]
    if twisted:
        bmesh.ops.triangulate(bm, faces=twisted)


def _dissolve_slivers(bm: bmesh.types.BMesh, limit: float) -> None:
    distance = SLIVER_START
    while distance <= limit:
        bm.faces.ensure_lookup_table()
        if not any(is_null_face(face) for face in bm.faces):
            return
        bmesh.ops.dissolve_degenerate(bm, dist=distance, edges=bm.edges)
        _drop_loose(bm)
        _triangulate_twisted(bm)
        distance *= 2
