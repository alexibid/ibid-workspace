import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

SIZE = 900
LENS = 85
ANGLES = {"front": 0, "three-quarter": 35, "left": 90, "back": 180, "right": 270}
ELEVATION = 0.12
BACKDROP = (0.86, 0.86, 0.86, 1.0)


def main() -> int:
    argv = sys.argv[sys.argv.index("--") + 1:]
    source, out_dir = Path(argv[0]), Path(argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source))
    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError(f"{source.name} carried no mesh.")
    for mesh in meshes:
        for polygon in mesh.data.polygons:
            polygon.use_smooth = False

    corners = [obj.matrix_world @ Vector(c) for obj in meshes for c in obj.bound_box]
    low = Vector(min(c[a] for c in corners) for a in range(3))
    high = Vector(max(c[a] for c in corners) for a in range(3))
    centre = (low + high) * 0.5
    span = max((high - low)[axis] for axis in range(3))

    _stage(centre, span)
    camera = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    camera.data.lens = LENS
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera

    for name, degrees in ANGLES.items():
        yaw = math.radians(degrees)
        camera.location = centre + Vector((span * 3 * math.cos(yaw),
                                           -span * 3 * math.sin(yaw),
                                           span * ELEVATION))
        camera.rotation_euler = (centre - camera.location).to_track_quat("-Z", "Y").to_euler()
        bpy.context.scene.render.filepath = str(out_dir / f"{name}.png")
        bpy.ops.render.render(write_still=True)
        print(f"SHOT {name}")
    print(f"SNAPSHOT {out_dir} views={len(ANGLES)}")
    return 0


def _stage(centre: Vector, span: float) -> None:
    key = bpy.data.objects.new("key", bpy.data.lights.new("key", type="AREA"))
    key.data.energy = span * span * 320
    key.data.size = span * 2.5
    key.location = centre + Vector((span * 1.2, -span * 1.6, span * 1.5))
    key.rotation_euler = (centre - key.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.collection.objects.link(key)

    fill = bpy.data.objects.new("fill", bpy.data.lights.new("fill", type="AREA"))
    fill.data.energy = span * span * 110
    fill.data.size = span * 3
    fill.location = centre + Vector((-span * 1.5, -span * 1.2, span * 0.5))
    fill.rotation_euler = (centre - fill.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.collection.objects.link(fill)

    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = BACKDROP
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.55
    bpy.context.scene.world = world

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.view_settings.view_transform = "Standard"
    scene.render.resolution_x = scene.render.resolution_y = SIZE


if __name__ == "__main__":
    sys.exit(main())
