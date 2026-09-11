from pathlib import Path
from typing import Dict, Any
import bpy
from mathutils import Vector

def setup_stage_cutout_wires(
    views_wire_data: Dict[str, Any],
    box_dims: Dict[str, float],
    target_collection: bpy.types.Collection
):
    L = box_dims["length"]
    W = box_dims["width"]
    H = box_dims["height"]
    half_L = L * 0.5
    half_W = W * 0.5

    views_mapping = {
        "Left":   lambda nx, ny: Vector(((0.5 - nx) * L, half_W, (1.0 - ny) * H)),
        "Right":  lambda nx, ny: Vector(((nx - 0.5) * L, -half_W, (1.0 - ny) * H)),
        "Front":  lambda nx, ny: Vector((half_L, (nx - 0.5) * W, (1.0 - ny) * H)),
        "Back":   lambda nx, ny: Vector((-half_L, (0.5 - nx) * W, (1.0 - ny) * H)),
        "Top":    lambda nx, ny: Vector(((0.5 - nx) * L, (0.5 - ny) * W, H)),
        "Bottom": lambda nx, ny: Vector(((0.5 - nx) * L, (ny - 0.5) * W, 0.0))
    }

    for vname, mapper in views_mapping.items():
        if vname not in views_wire_data:
            continue
        norm_verts, edges = views_wire_data[vname]
        verts_3d = [mapper(nx, ny) for (nx, ny) in norm_verts]

        mesh = bpy.data.meshes.new(f"Mesh_Cutout_{vname}")
        mesh.from_pydata(verts_3d, edges, [])
        mesh.update()

        obj = bpy.data.objects.new(f"Cutout_SVG_{vname}", mesh)
        target_collection.objects.link(obj)

        obj.show_wire = True
        obj.display_type = 'WIRE'
