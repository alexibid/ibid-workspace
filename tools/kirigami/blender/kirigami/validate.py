from dataclasses import dataclass, field

import bmesh
import bpy
from mathutils.bvhtree import BVHTree

AREA_EPSILON = 1e-6
LENGTH_EPSILON = 1e-6
MERGE_EPSILON = 1e-5
WELD_DISTANCE = 1e-4
SLIVER_DISTANCE = 6e-4
TWIST_RATIO = 0.01

OFFENDER_NAMES = (
    "open_boundary_edges",
    "non_manifold_edges",
    "non_manifold_verts",
    "loose_verts",
    "loose_edges",
    "zero_area_faces",
    "twisted_faces",
    "degenerate_edges",
    "duplicate_verts",
    "self_intersections",
    "unwelded_shells",
    "flipped_faces",
    "inside_out",
)


@dataclass(frozen=True)
class MeshReport:
    part: str
    verts: int
    edges: int
    faces: int
    triangles: int
    volume_mm3: float
    offenders: dict[str, int] = field(default_factory=dict)

    @property
    def clean(self) -> bool:
        return all(count == 0 for count in self.offenders.values())

    @property
    def failures(self) -> list[str]:
        return [name for name, count in self.offenders.items() if count > 0]

    def as_dict(self) -> dict:
        return {
            "part": self.part,
            "verts": self.verts,
            "edges": self.edges,
            "faces": self.faces,
            "triangles": self.triangles,
            "volumeMm3": round(self.volume_mm3, 3),
            "clean": self.clean,
            "offenders": dict(self.offenders),
            "failures": self.failures,
        }


def inspect(obj: bpy.types.Object) -> MeshReport:
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.transform(obj.matrix_world)
    for sequence in (bm.verts, bm.edges, bm.faces):
        sequence.ensure_lookup_table()
        sequence.index_update()

    offenders = {
        "open_boundary_edges": sum(1 for e in bm.edges if len(e.link_faces) < 2),
        "non_manifold_edges": sum(1 for e in bm.edges if len(e.link_faces) > 2),
        "non_manifold_verts": sum(1 for v in bm.verts if not v.is_manifold),
        "loose_verts": sum(1 for v in bm.verts if not v.link_edges),
        "loose_edges": sum(1 for e in bm.edges if not e.link_faces),
        "zero_area_faces": sum(1 for f in bm.faces if is_null_face(f)),
        "twisted_faces": sum(1 for f in bm.faces if is_twisted(f)),
        "degenerate_edges": sum(1 for e in bm.edges if is_null_edge(e)),
        "inside_out": 1 if obj.matrix_world.determinant() <= 0 else 0,
        "duplicate_verts": _duplicate_verts(bm),
        "self_intersections": _self_intersections(bm),
        "unwelded_shells": max(0, _shell_count(bm) - 1),
        "flipped_faces": _flipped_faces(bm),
    }

    report = MeshReport(
        part=obj.name,
        verts=len(bm.verts),
        edges=len(bm.edges),
        faces=len(bm.faces),
        triangles=sum(len(f.verts) - 2 for f in bm.faces),
        volume_mm3=bm.calc_volume(signed=True) * 1e9,
        offenders=offenders,
    )
    bm.free()
    return report


def is_null_face(face: bmesh.types.BMFace) -> bool:
    return face.calc_area() < AREA_EPSILON


def is_null_edge(edge: bmesh.types.BMEdge) -> bool:
    return edge.calc_length() < LENGTH_EPSILON


def is_twisted(face: bmesh.types.BMFace) -> bool:
    if len(face.verts) <= 3:
        return False
    centre = face.calc_center_median()
    plane = centre.dot(face.normal)
    diameter = max((centre - vert.co).length for vert in face.verts)
    threshold = TWIST_RATIO * diameter
    return any(abs(vert.co.dot(face.normal) - plane) > threshold for vert in face.verts)


def _duplicate_verts(bm: bmesh.types.BMesh) -> int:
    seen: dict[tuple[int, int, int], int] = {}
    for vert in bm.verts:
        cell = tuple(round(axis / MERGE_EPSILON) for axis in vert.co)
        seen[cell] = seen.get(cell, 0) + 1
    return sum(count - 1 for count in seen.values() if count > 1)


def _shell_count(bm: bmesh.types.BMesh) -> int:
    unvisited = set(range(len(bm.faces)))
    shells = 0
    while unvisited:
        shells += 1
        queue = [unvisited.pop()]
        while queue:
            face = bm.faces[queue.pop()]
            for edge in face.edges:
                for neighbour in edge.link_faces:
                    if neighbour.index in unvisited:
                        unvisited.discard(neighbour.index)
                        queue.append(neighbour.index)
    return shells


def _flipped_faces(bm: bmesh.types.BMesh) -> int:
    flipped = set()
    for edge in bm.edges:
        if len(edge.link_faces) != 2:
            continue
        first, second = edge.link_faces
        if _edge_direction(first, edge) == _edge_direction(second, edge):
            flipped.add(second.index)
    return len(flipped)


def _edge_direction(face: bmesh.types.BMFace, edge: bmesh.types.BMEdge) -> bool:
    for loop in face.loops:
        if loop.edge == edge:
            return loop.vert == edge.verts[0]
    return False


def _self_intersections(bm: bmesh.types.BMesh) -> int:
    probe = bm.copy()
    bmesh.ops.triangulate(probe, faces=probe.faces)
    for sequence in (probe.verts, probe.faces):
        sequence.ensure_lookup_table()
        sequence.index_update()
    tree = BVHTree.FromBMesh(probe, epsilon=1e-7)
    corners = [frozenset(vert.index for vert in face.verts) for face in probe.faces]
    hits = sum(
        1
        for left, right in tree.overlap(tree)
        if left < right and not corners[left] & corners[right]
    )
    probe.free()
    return hits
