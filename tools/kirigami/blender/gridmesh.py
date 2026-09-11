import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from journal import Timer  # noqa: E402

MM = 0.001
AXES = ((0, Vector((1.0, 0.0, 0.0))), (1, Vector((0.0, 1.0, 0.0))), (2, Vector((0.0, 0.0, 1.0))))


class GridError(RuntimeError):
    pass


def main() -> int:
    argv = sys.argv[sys.argv.index("--") + 1:]
    source, target = Path(argv[0]), Path(argv[1])
    divisions = int(argv[2]) if len(argv) > 2 else 25
    journal = Path(argv[3]) if len(argv) > 3 else None
    if journal:
        with Timer(journal, "grid", "blender/gridmesh.py") as clock:
            clock.detail = {"grid": divisions, "spacingMm": _spacing(source, divisions)}
            return _settle(source, target, divisions)
    return _settle(source, target, divisions)


def _spacing(source: Path, divisions: int) -> float:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source))
    obj = max((o for o in bpy.data.objects if o.type == "MESH"),
              key=lambda o: len(o.data.polygons))
    points = [vertex.co for vertex in obj.data.vertices]
    span = max(p.x for p in points) - min(p.x for p in points)
    return round(span / MM / divisions, 3)


def _settle(source: Path, target: Path, divisions: int) -> int:
    target.parent.mkdir(parents=True, exist_ok=True)
    for nudge in (0.0, 0.013, -0.017, 0.031, -0.037):
        _build(source, target, divisions, nudge)
        broken = _exported_faults(target.with_suffix(".glb"))
        print(f"MEASURED exportado arestas_invalidas={broken} desvio={nudge:+.3f}")
        if broken == 0:
            return 0
    raise GridError(f"Grid {divisions} does not export watertight at any offset.")


def _exported_faults(path: Path) -> int:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(path))
    obj = max((o for o in bpy.data.objects if o.type == "MESH"),
              key=lambda o: len(o.data.polygons))
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    faults = sum(1 for edge in bm.edges if len(edge.link_faces) != 2)
    bm.free()
    return faults


def _build(source: Path, target: Path, divisions: int, nudge: float = 0.0) -> int:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source))
    model = max((o for o in bpy.data.objects if o.type == "MESH"),
                key=lambda o: len(o.data.polygons))
    model.name = "grid"
    model.data.name = "grid"

    low, high = _bounds(model)
    spacing = (high.x - low.x) / divisions
    planes = {axis: _offsets(low[axis], high[axis], spacing, nudge)
              for axis, _ in AXES}
    print(f"MEASURED espacamento={spacing / MM:.3f}mm  planos "
          + "  ".join(f"{'XYZ'[a]}={len(planes[a])}" for a, _ in AXES))

    bm = bmesh.new()
    bm.from_mesh(model.data)
    before = len(bm.faces)
    for axis, normal in AXES:
        for offset in planes[axis]:
            geometry = bm.verts[:] + bm.edges[:] + bm.faces[:]
            bmesh.ops.bisect_plane(bm, geom=geometry, dist=spacing * 1e-4,
                                   plane_co=normal * offset, plane_no=normal,
                                   clear_inner=False, clear_outer=False)
    print(f"MEASURED apos cortes faces={len(bm.faces)} verts={len(bm.verts)}")

    guarded = _reduce_grid(bm, planes, spacing)
    dropped = _drop_degenerate(bm, spacing)
    print(f"MEASURED fusao={'guardada' if guarded else 'directa'} degeneradas={dropped}")
    boundary = sum(1 for edge in bm.edges if len(edge.link_faces) == 1)
    nonmanifold = sum(1 for edge in bm.edges if len(edge.link_faces) > 2)
    sides = {}
    for face in bm.faces:
        sides[len(face.verts)] = sides.get(len(face.verts), 0) + 1
    print(f"MEASURED boundary={boundary} nonmanifold={nonmanifold}")
    print("MEASURED lados por face " + "  ".join(
        f"{n}={sides[n]}" for n in sorted(sides)))

    bm.to_mesh(model.data)
    bm.free()
    for polygon in model.data.polygons:
        polygon.use_smooth = False
    print(f"MEASURED grelha faces={len(model.data.polygons)} de {before} originais")

    bpy.ops.wm.save_as_mainfile(filepath=str(target))

    bpy.ops.object.select_all(action="DESELECT")
    model.select_set(True)
    bpy.context.view_layer.objects.active = model
    modifier = model.modifiers.new(name="settle", type="TRIANGULATE")
    modifier.quad_method = "BEAUTY"
    modifier.ngon_method = "BEAUTY"
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.ops.object.shade_smooth()
    print(f"MEASURED triangulado para glb faces={len(model.data.polygons)}")
    bpy.ops.export_scene.gltf(filepath=str(target.with_suffix(".glb")), export_format="GLB",
                              use_selection=True)
    print(f"GRIDMESH {target}")
    return 0


def _bounds(obj: bpy.types.Object) -> tuple[Vector, Vector]:
    points = [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]
    low = Vector(min(p[axis] for p in points) for axis in range(3))
    high = Vector(max(p[axis] for p in points) for axis in range(3))
    return low, high


def _offsets(start: float, end: float, spacing: float, nudge: float = 0.0) -> list:
    count = max(1, round((end - start) / spacing))
    shift = spacing * nudge
    return [start + (end - start) * index / count + shift for index in range(1, count)]


def _reduce_grid(bm: bmesh.types.BMesh, planes: dict, spacing: float,
                 insist: bool = False) -> bool:
    if insist:
        while _merge(bm, _off_grid(bm, planes, spacing * 1e-3))[0]:
            pass
        _straighten(bm)
        return True

    snapshot = bm.copy()
    bmesh.ops.dissolve_edges(bm, edges=_off_grid(bm, planes, spacing * 1e-3),
                             use_verts=False, use_face_split=False)
    _straighten(bm)
    if _sound(bm):
        snapshot.free()
        return False

    bm.clear()
    snapshot.to_mesh(_scratch())
    bm.from_mesh(_scratch())
    snapshot.free()
    while _merge(bm, _off_grid(bm, planes, spacing * 1e-3))[0]:
        pass
    _straighten(bm)
    return True


def _drop_degenerate(bm: bmesh.types.BMesh, spacing: float) -> int:
    doomed = [face for face in bm.faces if face.calc_area() < (spacing * 1e-3) ** 2]
    if doomed:
        bmesh.ops.delete(bm, geom=doomed, context="FACES")
        bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if len(e.link_faces) == 1])
    bmesh.ops.dissolve_degenerate(bm, dist=spacing * 1e-4, edges=bm.edges[:])
    return len(doomed)


def _sound(bm: bmesh.types.BMesh) -> bool:
    return all(len(edge.link_faces) == 2 for edge in bm.edges)


def _straighten(bm: bmesh.types.BMesh) -> None:
    stranded = [vertex for vertex in bm.verts if len(vertex.link_edges) == 2]
    if stranded:
        bmesh.ops.dissolve_verts(bm, verts=stranded)


def _scratch() -> bpy.types.Mesh:
    name = "gridmesh_scratch"
    return bpy.data.meshes.get(name) or bpy.data.meshes.new(name)


def _merge(bm: bmesh.types.BMesh, candidates: list) -> tuple[int, int]:
    merged, skipped = 0, 0
    for edge in candidates:
        if not edge.is_valid or len(edge.link_faces) != 2:
            skipped += 1
            continue
        one, two = edge.link_faces
        if len(set(one.edges) & set(two.edges)) != 1:
            skipped += 1
            continue
        bmesh.ops.dissolve_edges(bm, edges=[edge], use_verts=False, use_face_split=False)
        merged += 1
    return merged, skipped


def _off_grid(bm: bmesh.types.BMesh, planes: dict, tolerance: float) -> list:
    loose = []
    for edge in bm.edges:
        one, two = edge.verts
        if not any(_shared(one.co[axis], two.co[axis], planes[axis], tolerance)
                   for axis, _ in AXES):
            loose.append(edge)
    return loose


def _shared(first: float, second: float, offsets: list, tolerance: float) -> bool:
    if abs(first - second) > tolerance:
        return False
    return any(abs(first - offset) <= tolerance for offset in offsets)


if __name__ == "__main__":
    sys.exit(main())
