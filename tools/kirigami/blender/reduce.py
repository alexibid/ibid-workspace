import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from journal import Timer  # noqa: E402


MM = 0.001


class ReduceError(RuntimeError):
    pass


def main() -> int:
    argv = sys.argv[sys.argv.index("--") + 1:]
    source, target_path, faces = Path(argv[0]), Path(argv[1]), int(argv[2])
    turn = float(argv[3]) if len(argv) > 3 else 0.0
    journal = Path(argv[4]) if len(argv) > 4 else None
    if journal:
        with Timer(journal, "reduce", "blender/reduce.py") as clock:
            clock.detail = {"faces": faces, "turnDegrees": turn}
            return _shrink(source, target_path, faces, turn, journal)
    return _shrink(source, target_path, faces, turn, journal)


def _shrink(source: Path, target_path: Path, faces: int, turn: float,
            journal: Path | None) -> int:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source))
    obj = max((o for o in bpy.data.objects if o.type == "MESH"),
              key=lambda o: len(o.data.polygons))
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    present = len(obj.data.polygons)
    if not obj.data.color_attributes:
        raise ReduceError(f"{source.name} carries no vertex colours.")

    if present > faces:
        modifier = obj.modifiers.new(name="thin", type="DECIMATE")
        modifier.decimate_type = "COLLAPSE"
        modifier.ratio = faces / present
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    print(f"MEASURED faces {present} -> {len(obj.data.polygons)}")

    if turn:
        obj.data.transform(Matrix.Rotation(math.radians(turn), 4, "Z"))
        print(f"MEASURED turned {turn:+.0f} degrees about Z")

    if journal:
        _fit_frame(obj, journal)

    _unwind_gamma(obj)
    bpy.ops.object.shade_smooth()

    report = _inspect(obj)
    print(f"MEASURED boundary={report['boundary']} nonmanifold={report['nonmanifold']} "
          f"shells={report['shells']} colours={len(obj.data.color_attributes)}")

    obj.name = target_path.stem
    obj.data.name = target_path.stem
    for other in list(bpy.data.objects):
        if other is not obj:
            bpy.data.objects.remove(other, do_unlink=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(target_path.with_suffix(".blend")))
    bpy.ops.export_scene.gltf(filepath=str(target_path), export_format="GLB",
                              use_selection=True)
    print(f"REDUCED {target_path}")
    return 0


def _fit_frame(obj: bpy.types.Object, journal: Path) -> None:
    contract = journal / "frame.json"
    if not contract.exists():
        return
    frame = json.loads(contract.read_text())
    wanted = (frame["lengthMm"] * MM, frame["widthMm"] * MM, frame["heightMm"] * MM)

    points = [vertex.co for vertex in obj.data.vertices]
    low = Vector(min(p[axis] for p in points) for axis in range(3))
    high = Vector(max(p[axis] for p in points) for axis in range(3))
    factors = [wanted[axis] / max(high[axis] - low[axis], 1e-9) for axis in range(3)]

    obj.data.transform(Matrix.Diagonal(Vector(factors + [1.0])))
    points = [vertex.co for vertex in obj.data.vertices]
    settled = Vector(min(p[axis] for p in points) for axis in range(3))
    obj.data.transform(Matrix.Translation(Vector((0.0, 0.0, -settled.z))))
    print("MEASURED fitted to reference " + "  ".join(
        f"{'XYZ'[axis]}x{factors[axis]:.3f}" for axis in range(3)))


def _unwind_gamma(obj: bpy.types.Object) -> None:
    layer = obj.data.color_attributes[0]
    encoded = [tuple(entry.color_srgb) for entry in layer.data]
    for entry, shade in zip(layer.data, encoded):
        entry.color = shade


def _inspect(obj: bpy.types.Object) -> dict:
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    boundary = sum(1 for e in bm.edges if len(e.link_faces) == 1)
    nonmanifold = sum(1 for e in bm.edges if len(e.link_faces) > 2)
    seen, shells = set(), 0
    for face in bm.faces:
        if face.index in seen:
            continue
        shells += 1
        stack = [face]
        while stack:
            current = stack.pop()
            if current.index in seen:
                continue
            seen.add(current.index)
            for edge in current.edges:
                stack.extend(n for n in edge.link_faces if n.index not in seen)
    bm.free()
    return {"boundary": boundary, "nonmanifold": nonmanifold, "shells": shells}


if __name__ == "__main__":
    sys.exit(main())
