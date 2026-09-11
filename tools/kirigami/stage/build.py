import sys
import os
import json
from pathlib import Path
import bpy
from mathutils import Vector

workspace_dir = Path(os.getcwd()).resolve()
if str(workspace_dir) not in sys.path:
    sys.path.insert(0, str(workspace_dir))

from tools.kirigami.svg.parser import extract_svg_wire_graph
from tools.kirigami.svg.contours import load_precise_view_contours
from tools.kirigami.blender.extrude import create_through_extrusion_prism
from tools.kirigami.blender.boolean_solid import compute_boolean_intersection_solid
from tools.kirigami.blender.stage_builder import setup_stage_cutout_wires

def build_complete_orthographic_stage():
    resource_dir = Path("apps/kirigami-studio/resources/baby-broncosaurus-v3")
    cutouts_dir = resource_dir / "cutouts"
    frame_path = resource_dir / "frame.json"
    contours_path = resource_dir / "view_precise_contours.json"
    blend_path = resource_dir / "orthographic_stage.blend"

    with open(frame_path, "r") as f:
        frame = json.load(f)

    box_dims = {
        "length": frame.get("lengthMm", 278.8) / 1000.0,
        "width":  frame.get("widthMm", 96.5) / 1000.0,
        "height": frame.get("heightMm", 200.0) / 1000.0
    }

    bpy.ops.wm.read_factory_settings(use_empty=True)

    scene = bpy.context.scene
    stage_col = bpy.data.collections.new("Stage_Setup")
    cutouts_col = bpy.data.collections.new("SVG_Cutouts_Arestas")
    scene.collection.children.link(stage_col)
    scene.collection.children.link(cutouts_col)

    views_svg_files = {
        "Left":   cutouts_dir / "left_lines.svg",
        "Right":  cutouts_dir / "right_lines.svg",
        "Front":  cutouts_dir / "front_lines.svg",
        "Back":   cutouts_dir / "back_lines.svg",
        "Top":    cutouts_dir / "top_lines.svg",
        "Bottom": cutouts_dir / "bottom_lines.svg"
    }

    wire_graphs = {}
    for vname, svg_f in views_svg_files.items():
        if svg_f.exists():
            norm_verts, edges = extract_svg_wire_graph(svg_f)
            wire_graphs[vname] = (norm_verts, edges)

    setup_stage_cutout_wires(wire_graphs, box_dims, cutouts_col)

    contours_data = load_precise_view_contours(contours_path)

    prism_configs = [
        ("Left",   "Y",  1),
        ("Front",  "X",  1),
        ("Top",    "Z",  1),
        ("Right",  "Y", -1),
        ("Back",   "X", -1),
        ("Bottom", "Z", -1)
    ]

    prism_objs = []
    for vname, axis, sign in prism_configs:
        poly_norm = contours_data.get(vname)
        if not poly_norm:
            continue
        prism = create_through_extrusion_prism(vname, poly_norm, box_dims, axis, sign)
        stage_col.objects.link(prism)
        prism_objs.append(prism)

    compute_boolean_intersection_solid(prism_objs)

    cam_data = bpy.data.cameras.new("CheckCam")
    cam = bpy.data.objects.new("CheckCam", cam_data)
    stage_col.objects.link(cam)
    scene.camera = cam
    cam.location = Vector((0.45, -0.45, 0.35))
    cam.rotation_euler = (1.05, 0.0, 0.785)

    light_data = bpy.data.lights.new("KeyLight", type='SUN')
    light_data.energy = 3.0
    light = bpy.data.objects.new("KeyLight", light_data)
    stage_col.objects.link(light)
    light.location = Vector((0.5, -0.5, 0.8))
    light.rotation_euler = (0.785, 0.0, 0.785)

    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))

if __name__ == "__main__":
    build_complete_orthographic_stage()
