import json
import math
import sys
from pathlib import Path

import bpy
import numpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))

from palette_check import colours_in_net  # noqa: E402
from silhouette import blobs, mask_of, solidity  # noqa: E402

VIEWS = {"front": 0.0, "three-quarter": math.radians(38), "side": math.radians(90)}
LIMITS = {"solidity": 0.34, "render_colours": 2}
SIZE = 520


def main() -> int:
    argv = sys.argv[sys.argv.index("--") + 1:]
    uploads, out_dir = Path(argv[0]), Path(argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)

    findings = [look(model, out_dir) for model in sorted(uploads.glob("*/*/manifest.json"))]
    report = {"models": findings, "limits": LIMITS,
              "failures": [row["id"] for row in findings if row["problems"]]}
    (out_dir / "report.json").write_text(json.dumps(report, indent=2))
    print("QA_REPORT " + str(out_dir / "report.json"))
    return 1 if report["failures"] else 0


def look(manifest_path: Path, root: Path) -> dict:
    folder = manifest_path.parent
    out_dir = root / folder.name
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(manifest_path.read_text())
    parts = len(manifest.get("parts", []))
    shots = render(folder / "model.glb", out_dir)
    declared = {part["name"]: len(part.get("colours", [])) or 1
                for part in manifest.get("parts", [])}
    nets = [{"file": svg.name, "part": owner(svg.stem, declared),
             "declared": declared.get(owner(svg.stem, declared), 1),
             "source": str(svg),
             **colours_in_net(svg, out_dir / f"texture.{svg.stem}.png")}
            for svg in sorted(folder.glob("nets/*.svg"))]

    problems = []
    if not shots:
        problems.append("the model produced no render")
    for view, shot in shots.items():
        if shot["blobs"] > parts:
            problems.append(
                f"{view}: the silhouette falls into {shot['blobs']} pieces for "
                f"{parts} welded part(s) — something is not attached")
        if shot["colours"] < LIMITS["render_colours"]:
            problems.append(
                f"{view}: the 3D model renders in {shot['colours']} colour(s) — the baked "
                f"texture did not reach the glTF")
        if shot["solidity"] < LIMITS["solidity"]:
            problems.append(
                f"{view}: the body sprouts thin protrusions "
                f"(solidity {shot['solidity']:.2f} below {LIMITS['solidity']})")
    if not nets:
        problems.append("no SVG net was exported")
    for net in nets:
        if net["embedded"] == 0:
            problems.append(
                f"{net['file']}: the net carries no baked colour at all — it would print "
                f"as bare line art")
        elif net["colours"] < net["declared"]:
            problems.append(
                f"{net['file']}: {net['colours']} colours printed for a part that declares "
                f"{net['declared']}")

    return {"id": folder.name, "shelf": folder.parent.name, "folder": folder.name, "title": manifest.get("title"),
            "tier": manifest.get("tier", {}).get("id"), "views": shots, "nets": nets,
            "problems": problems}


def render(glb: Path, out_dir: Path) -> dict:
    if not glb.exists():
        return {}
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(glb))
    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    if not meshes:
        return {}

    low, high = bounds(meshes)
    centre = (low + high) * 0.5
    span = max((high - low).x, (high - low).y, (high - low).z)
    stage(centre, span)

    shots = {}
    for view, yaw in VIEWS.items():
        target = out_dir / f"3d.{view}.png"
        aim(centre, span, yaw)
        bpy.context.scene.render.filepath = str(target)
        bpy.ops.render.render(write_still=True)
        shots[view] = {**measure(target), "file": target.name}
    return shots


def bounds(meshes) -> tuple[Vector, Vector]:
    corners = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    return (Vector(min(c[axis] for c in corners) for axis in range(3)),
            Vector(max(c[axis] for c in corners) for axis in range(3)))


def stage(centre: Vector, span: float) -> None:
    key = bpy.data.objects.new("key", bpy.data.lights.new("key", type="AREA"))
    key.data.energy = span * span * 260
    key.data.size = span * 2
    key.location = centre + Vector((span, -span * 1.4, span * 1.8))
    key.rotation_euler = (centre - key.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.collection.objects.link(key)

    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.30
    bpy.context.scene.world = world

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.view_settings.view_transform = "Standard"
    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.resolution_x = SIZE
    scene.render.resolution_y = SIZE


def aim(centre: Vector, span: float, yaw: float) -> None:
    existing = bpy.data.objects.get("cam")
    camera = existing or bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    if existing is None:
        bpy.context.collection.objects.link(camera)
    camera.data.lens = 58
    reach = span * 2.1
    camera.location = centre + Vector(
        (reach * math.sin(yaw), -reach * math.cos(yaw), span * 0.55))
    camera.rotation_euler = (centre - camera.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = camera


def measure(shot: Path) -> dict:
    image = bpy.data.images.load(str(shot))
    try:
        pixels = numpy.array(image.pixels[:], dtype=numpy.float32)
        frame = pixels.reshape(image.size[1], image.size[0], 4)
    finally:
        bpy.data.images.remove(image)
    mask = mask_of(frame)
    return {"blobs": blobs(mask),
            "solidity": round(solidity(mask), 4),
            "colours": _distinct(frame, mask),
            "coverage": round(float(mask.mean()), 4)}


def _distinct(frame: numpy.ndarray, mask: numpy.ndarray, buckets: int = 9) -> int:
    solid = frame[mask][:, :3]
    if len(solid) == 0:
        return 0
    quantised = numpy.floor(solid * buckets).astype(int)
    return int(len(numpy.unique(quantised, axis=0)))


def owner(stem: str, declared: dict) -> str:
    if stem in declared:
        return stem
    trimmed = stem.rsplit("_page", 1)[0]
    return trimmed if trimmed in declared else stem


if __name__ == "__main__":
    sys.exit(main())
