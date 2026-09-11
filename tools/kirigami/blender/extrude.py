from typing import List, Tuple, Dict, Any
import bpy
import bmesh
from mathutils import Vector

def create_through_extrusion_prism(
    name: str,
    polygon_norm: List[Tuple[float, float]],
    box_dims: Dict[str, float],
    view_axis: str,
    sign: int
) -> bpy.types.Object:
    L = box_dims["length"]
    W = box_dims["width"]
    H = box_dims["height"]
    half_L = L * 0.5
    half_W = W * 0.5

    bm = bmesh.new()

    verts_3d = []
    extrude_vec = Vector((0.0, 0.0, 0.0))

    if view_axis == 'Y':
        start_y = half_W if sign > 0 else -half_W
        extrude_vec = Vector((0.0, -W if sign > 0 else W, 0.0))
        for nx, ny in polygon_norm:
            x = (0.5 - nx) * L if sign > 0 else (nx - 0.5) * L
            z = (1.0 - ny) * H
            verts_3d.append(Vector((x, start_y, z)))

    elif view_axis == 'X':
        start_x = half_L if sign > 0 else -half_L
        extrude_vec = Vector((-L if sign > 0 else L, 0.0, 0.0))
        for nx, ny in polygon_norm:
            y = (nx - 0.5) * W if sign > 0 else (0.5 - nx) * W
            z = (1.0 - ny) * H
            verts_3d.append(Vector((start_x, y, z)))

    elif view_axis == 'Z':
        start_z = H if sign > 0 else 0.0
        extrude_vec = Vector((0.0, 0.0, -H if sign > 0 else H))
        for nx, ny in polygon_norm:
            x = (0.5 - nx) * L
            y = (0.5 - ny) * W if sign > 0 else (ny - 0.5) * W
            verts_3d.append(Vector((x, y, start_z)))

    bm_verts = [bm.verts.new(pt) for pt in verts_3d]
    bm.verts.ensure_lookup_table()

    base_face = bm.faces.new(bm_verts)

    res = bmesh.ops.extrude_face_region(bm, geom=[base_face])
    new_verts = [e for e in res['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=extrude_vec, verts=new_verts)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    mesh = bpy.data.meshes.new(f"Mesh_Prism_{name}")
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(f"Prism_{name}", mesh)
    return obj
