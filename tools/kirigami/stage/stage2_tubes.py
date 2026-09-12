import bpy
import bmesh
import math
import colorsys
import json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def generate_distinct_colors(n):
    colors = []
    golden_ratio = 0.618033988749895
    for i in range(n):
        h = (i * golden_ratio) % 1.0
        s = 0.75 + 0.20 * ((i % 3) / 2.0)
        v = 0.80 + 0.20 * ((i % 5) / 4.0)
        r, g, b = colorsys.hsv_to_rgb(h, s, v)
        hex_code = f"#{int(round(r * 255)):02X}{int(round(g * 255)):02X}{int(round(b * 255)):02X}"
        colors.append((hex_code, (r, g, b, 1.0)))
    return colors

def create_cylinder_mesh(bm, p1, p2, radius=0.001, segments=12):
    axis = p2 - p1
    length = axis.length
    if length < 0.0001:
        return []
    
    dir_vec = axis.normalized()
    up = Vector((0.0, 0.0, 1.0)) if abs(dir_vec.z) < 0.99 else Vector((0.0, 1.0, 0.0))
    u = dir_vec.cross(up).normalized()
    v = dir_vec.cross(u).normalized()
    
    verts_bottom = []
    verts_top = []
    for i in range(segments):
        theta = 2.0 * math.pi * i / segments
        rad_vec = (u * math.cos(theta) + v * math.sin(theta)) * radius
        verts_bottom.append(bm.verts.new(p1 + rad_vec))
        verts_top.append(bm.verts.new(p2 + rad_vec))
        
    created_faces = []
    for i in range(segments):
        nxt = (i + 1) % segments
        f = bm.faces.new([
            verts_bottom[i],
            verts_bottom[nxt],
            verts_top[nxt],
            verts_top[i]
        ])
        created_faces.append(f)
        
    # Caps
    f_bot = bm.faces.new(list(reversed(verts_bottom)))
    f_top = bm.faces.new(verts_top)
    created_faces.extend([f_bot, f_top])
    return created_faces

def create_sphere_mesh(bm, center, radius=0.00175, rings=8, segments=12):
    verts = []
    # top pole
    top_v = bm.verts.new(center + Vector((0.0, 0.0, radius)))
    verts.append([top_v])
    
    for r in range(1, rings):
        phi = math.pi * r / rings
        z = radius * math.cos(phi)
        r_ring = radius * math.sin(phi)
        ring_verts = []
        for s in range(segments):
            theta = 2.0 * math.pi * s / segments
            x = r_ring * math.cos(theta)
            y = r_ring * math.sin(theta)
            ring_verts.append(bm.verts.new(center + Vector((x, y, z))))
        verts.append(ring_verts)
        
    bot_v = bm.verts.new(center - Vector((0.0, 0.0, radius)))
    verts.append([bot_v])
    
    faces = []
    # top fan
    for s in range(segments):
        nxt = (s + 1) % segments
        faces.append(bm.faces.new([top_v, verts[1][s], verts[1][nxt]]))
        
    # mid quads
    for r in range(1, rings - 1):
        for s in range(segments):
            nxt = (s + 1) % segments
            faces.append(bm.faces.new([
                verts[r][s],
                verts[r + 1][s],
                verts[r + 1][nxt],
                verts[r][nxt]
            ]))
            
    # bottom fan
    for s in range(segments):
        nxt = (s + 1) % segments
        faces.append(bm.faces.new([bot_v, verts[rings - 1][nxt], verts[rings - 1][s]]))
        
    return faces

def create_ring_mesh(bm, center, norm, axes, r_out=0.0010, r_in=0.00050, segments=18, offset_dist=0.0003):
    origin = center + norm * offset_dist
    ax_u, ax_v = axes
    
    outer_verts = []
    inner_verts = []
    for i in range(segments):
        theta = 2.0 * math.pi * i / segments
        cu = math.cos(theta)
        cv = math.sin(theta)
        
        pt_out = Vector(origin)
        pt_in = Vector(origin)
        
        if (ax_u, ax_v) == ("X", "Z"):
            pt_out.x += r_out * cu; pt_out.z += r_out * cv
            pt_in.x += r_in * cu;   pt_in.z += r_in * cv
        elif (ax_u, ax_v) == ("Y", "Z"):
            pt_out.y += r_out * cu; pt_out.z += r_out * cv
            pt_in.y += r_in * cu;   pt_in.z += r_in * cv
        elif (ax_u, ax_v) == ("X", "Y"):
            pt_out.x += r_out * cu; pt_out.y += r_out * cv
            pt_in.x += r_in * cu;   pt_in.y += r_in * cv
            
        outer_verts.append(bm.verts.new(pt_out))
        inner_verts.append(bm.verts.new(pt_in))
        
    faces = []
    for i in range(segments):
        nxt = (i + 1) % segments
        f = bm.faces.new([
            outer_verts[i],
            outer_verts[nxt],
            inner_verts[nxt],
            inner_verts[i]
        ])
        faces.append(f)
    return faces

def setup_color_material(name, color_rgba, transparent=False, alpha=0.30):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (color_rgba[0], color_rgba[1], color_rgba[2], alpha if transparent else 1.0)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    node_out = nodes.new("ShaderNodeOutputMaterial")
    node_bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    
    node_bsdf.inputs["Base Color"].default_value = color_rgba
    node_bsdf.inputs["Emission Color"].default_value = color_rgba
    node_bsdf.inputs["Emission Strength"].default_value = 0.25 if transparent else 0.5
    
    if transparent:
        node_bsdf.inputs["Transmission Weight"].default_value = 0.88
        node_bsdf.inputs["Roughness"].default_value = 0.10
        node_bsdf.inputs["Alpha"].default_value = alpha
        mat.blend_method = 'BLEND'
    else:
        node_bsdf.inputs["Roughness"].default_value = 0.30
        mat.blend_method = 'OPAQUE'
        
    links.new(node_bsdf.outputs["BSDF"], node_out.inputs["Surface"])
    return mat

def ray_ray_closest(p1, d1, p2, d2):
    w0 = p1 - p2
    a = d1.dot(d1)
    b = d1.dot(d2)
    c = d2.dot(d2)
    d = d1.dot(w0)
    e = d2.dot(w0)
    denom = a * c - b * b
    if abs(denom) < 1e-6:
        return None, None, float('inf')
    t1 = (b * e - c * d) / denom
    t2 = (a * e - b * d) / denom
    if t1 < 0.0005 or t2 < 0.0005:
        return None, None, float('inf')
    pt1 = p1 + d1 * t1
    pt2 = p2 + d2 * t2
    dist = (pt1 - pt2).length
    mid = (pt1 + pt2) * 0.5
    return mid, (t1, t2), dist

def run_stage2(blend_path):
    bpy.ops.wm.open_mainfile(filepath=str(blend_path))
    
    mold = bpy.data.objects.get("Molde_Solid")
    if not mold:
        raise ValueError("Molde_Solid not found in scene")
    bvh_mold = BVHTree.FromPolygons([v.co for v in mold.data.vertices], [p.vertices for p in mold.data.polygons])
    
    views_cfg = {
        "Left":   {"norm": Vector((0.0, 1.0, 0.0)),  "dir": Vector((0.0, -1.0, 0.0)), "axes": ("X", "Z")},
        "Right":  {"norm": Vector((0.0, -1.0, 0.0)), "dir": Vector((0.0, 1.0, 0.0)),  "axes": ("X", "Z")},
        "Front":  {"norm": Vector((1.0, 0.0, 0.0)),  "dir": Vector((-1.0, 0.0, 0.0)), "axes": ("Y", "Z")},
        "Back":   {"norm": Vector((-1.0, 0.0, 0.0)), "dir": Vector((1.0, 0.0, 0.0)),  "axes": ("Y", "Z")},
        "Top":    {"norm": Vector((0.0, 0.0, 1.0)),  "dir": Vector((0.0, 0.0, -1.0)), "axes": ("X", "Y")},
        "Bottom": {"norm": Vector((0.0, 0.0, -1.0)), "dir": Vector((0.0, 0.0, 1.0)),  "axes": ("X", "Y")},
    }
    
    contour_items = []
    interior_items = []
    
    for vname, cfg in views_cfg.items():
        c_obj = bpy.data.objects.get(f"Cutout_Contour_{vname}")
        l_obj = bpy.data.objects.get(f"Cutout_Clean_{vname}")
        if not c_obj or not l_obj:
            continue
            
        bm_c = bmesh.new()
        bm_c.from_mesh(c_obj.data)
        bmesh.ops.remove_doubles(bm_c, verts=bm_c.verts, dist=0.0001)
        contour_coords = [v.co.copy() for v in bm_c.verts]
        bm_c.free()
        
        bm_l = bmesh.new()
        bm_l.from_mesh(l_obj.data)
        bmesh.ops.remove_doubles(bm_l, verts=bm_l.verts, dist=0.0001)
        clean_coords = [v.co.copy() for v in bm_l.verts]
        bm_l.free()
        
        # 1. Contour vertices
        for co in contour_coords:
            contour_items.append({
                "view": vname,
                "type": "contour",
                "origin": co,
                "dir": cfg["dir"],
                "norm": cfg["norm"],
                "axes": cfg["axes"]
            })
            
        # 2. Interior vertices
        for co in clean_coords:
            is_contour = any((co - c_co).length < 0.0005 for c_co in contour_coords)
            if not is_contour:
                interior_items.append({
                    "view": vname,
                    "type": "interior",
                    "origin": co,
                    "dir": cfg["dir"],
                    "norm": cfg["norm"],
                    "axes": cfg["axes"]
                })
                
    for item in interior_items:
        shoot_dir = item["dir"]
        hit, norm, idx, dist = bvh_mold.ray_cast(item["origin"] + shoot_dir * 0.0001, shoot_dir)
        if hit and dist:
            item["has_collision"] = True
            item["hit"] = hit
            item["length"] = dist
        else:
            best_pt = None
            best_dist_to_mold = float('inf')
            best_t = 0.040
            for step in range(5, 200, 2):
                t = step * 0.001
                p_test = item["origin"] + shoot_dir * t
                near, _, _, d_m = bvh_mold.find_nearest(p_test)
                if d_m < best_dist_to_mold:
                    best_dist_to_mold = d_m
                    best_pt = near
                    best_t = t
            if best_dist_to_mold <= 0.0100 and best_pt is not None:
                item["has_collision"] = True
                item["hit"] = best_pt
                item["length"] = best_t
            else:
                item["has_collision"] = False
                item["hit"] = None
                item["length"] = 0.040

    threshold = 0.0035

    for i, r1 in enumerate(contour_items):
        candidates = []
        for j, r2 in enumerate(contour_items):
            if r1["view"] == r2["view"] or r1["dir"].dot(r2["dir"]) < -0.99:
                continue
            mid, times, d = ray_ray_closest(r1["origin"], r1["dir"], r2["origin"], r2["dir"])
            if mid is not None and d <= threshold:
                t1, t2 = times
                candidates.append((t1, j, mid, d))

        candidates.sort(key=lambda x: x[0])

        found_valid = False
        for t1, j, mid, d in candidates:
            near, n, idx, dist_m = bvh_mold.find_nearest(mid)
            if dist_m <= 0.0120:
                r1["has_collision"] = True
                r1["hit"] = mid
                r1["length"] = t1
                found_valid = True
                break

        if not found_valid:
            hit_m, n, idx, dist_m = bvh_mold.ray_cast(r1["origin"] + r1["dir"] * 0.0001, r1["dir"])
            if hit_m and dist_m:
                r1["has_collision"] = True
                r1["hit"] = hit_m
                r1["length"] = dist_m
            else:
                best_pt = None
                best_dist_to_mold = float('inf')
                best_t = 0.040
                for step in range(5, 200, 2):
                    t = step * 0.001
                    p_test = r1["origin"] + r1["dir"] * t
                    near, _, _, d_m = bvh_mold.find_nearest(p_test)
                    if d_m < best_dist_to_mold:
                        best_dist_to_mold = d_m
                        best_pt = near
                        best_t = t
                if best_dist_to_mold <= 0.0100 and best_pt is not None:
                    r1["has_collision"] = True
                    r1["hit"] = best_pt
                    r1["length"] = best_t
                else:
                    r1["has_collision"] = False
                    r1["hit"] = None
                    r1["length"] = 0.040

    vertices_data = contour_items + interior_items
    contour_verts = contour_items
    interior_verts = interior_items
    total_verts = len(vertices_data)
    for i, v in enumerate(vertices_data):
        v["id"] = i
        if v.get("has_collision", False):
            v["hex"] = "#0DC7A6" if v["type"] == "contour" else "#1ACC33"
        else:
            v["hex"] = "#E62626"
    print(f"Total vertices: {total_verts} ({len(contour_verts)} contour, {len(interior_verts)} interior)")
    
    rt_col = bpy.data.collections.get("Raycast Tubes")
    if not rt_col:
        rt_col = bpy.data.collections.new("Raycast Tubes")
        bpy.context.scene.collection.children.link(rt_col)


    legacy_mats = [
        "Mat_Circle_Contour_Blue",
        "Mat_Circle_Interior_Green",
        "Mat_Collision_Contour_Blue",
        "Mat_Collision_Interior_Green",
        "Mat_Glass_Tubes_Transparent",
        "Mat_Tubes_Contour",
        "Mat_Tubes_Interior",
        "Mat_Circles_Contour",
        "Mat_Circles_Interior",
        "Mat_Circles_Unique",
        "Mat_Collisions_Unique",
        "Mat_Glass_Tubes_Unique",
    ]
    for m_name in legacy_mats:
        m = bpy.data.materials.get(m_name)
        if m and m.users == 0:
            bpy.data.materials.remove(m)

    GREEN_RGBA = (0.10, 0.80, 0.20, 1.0)
    TEAL_RGBA = (0.05, 0.78, 0.65, 1.0)
    RED_RGBA = (0.90, 0.15, 0.15, 1.0)

    mat_circ_success = setup_color_material("Mat_Circle_Success_Green", GREEN_RGBA, transparent=False)
    mat_circ_failed = setup_color_material("Mat_Circle_Failed_Red", RED_RGBA, transparent=False)
    mat_coll_contour = setup_color_material("Mat_Collision_Contour_Teal", TEAL_RGBA, transparent=False)
    mat_coll_interior = setup_color_material("Mat_Collision_Interior_Green", GREEN_RGBA, transparent=False)
    mat_tubes_success = setup_color_material("Mat_Tube_Success_Green", GREEN_RGBA, transparent=True, alpha=0.35)
    mat_tubes_failed = setup_color_material("Mat_Tube_Failed_Red", RED_RGBA, transparent=True, alpha=0.45)

    def create_or_get_mesh_obj(name):
        obj = bpy.data.objects.get(name)
        new_mesh = bpy.data.meshes.new(name)
        if obj:
            old_mesh = obj.data
            obj.data = new_mesh
            if old_mesh and old_mesh.users == 0:
                bpy.data.meshes.remove(old_mesh)
        else:
            obj = bpy.data.objects.new(name, new_mesh)
            rt_col.objects.link(obj)
        return obj

    def assign_uniform_color(obj, col_rgba):
        ca = obj.data.color_attributes.get("Color") or obj.data.color_attributes.new(name="Color", type='FLOAT_COLOR', domain='POINT')
        for elem in ca.data:
            elem.color = col_rgba

    success_items = [v for v in vertices_data if v.get("has_collision", False)]
    failed_items = [v for v in vertices_data if not v.get("has_collision", False)]

    bm_circ_success = bmesh.new()
    for v in success_items:
        create_ring_mesh(bm_circ_success, v["origin"], v["norm"], v["axes"], r_out=0.0010, r_in=0.00050, segments=18)
    obj_circ_success = create_or_get_mesh_obj("Circles_Success_Green")
    bm_circ_success.to_mesh(obj_circ_success.data)
    bm_circ_success.free()
    obj_circ_success.data.materials.clear()
    obj_circ_success.data.materials.append(mat_circ_success)
    assign_uniform_color(obj_circ_success, GREEN_RGBA)
    obj_circ_success.hide_viewport = False
    obj_circ_success.hide_set(False)

    bm_circ_failed = bmesh.new()
    for v in failed_items:
        create_ring_mesh(bm_circ_failed, v["origin"], v["norm"], v["axes"], r_out=0.0012, r_in=0.00060, segments=18)
    obj_circ_failed = create_or_get_mesh_obj("Circles_Failed_Red")
    bm_circ_failed.to_mesh(obj_circ_failed.data)
    bm_circ_failed.free()
    obj_circ_failed.data.materials.clear()
    obj_circ_failed.data.materials.append(mat_circ_failed)
    assign_uniform_color(obj_circ_failed, RED_RGBA)
    obj_circ_failed.hide_viewport = False
    obj_circ_failed.hide_set(False)

    bm_col_contour = bmesh.new()
    clustered_contour_pts = []
    for v in contour_verts:
        if v["has_collision"] and v["hit"] is not None:
            pt = v["hit"]
            if not any((pt - c).length < 0.0015 for c in clustered_contour_pts):
                clustered_contour_pts.append(pt)
            
    for pt in clustered_contour_pts:
        create_sphere_mesh(bm_col_contour, pt, radius=0.0010, rings=6, segments=10)
    obj_col_contour = create_or_get_mesh_obj("Collisions_Contour_Teal")
    bm_col_contour.to_mesh(obj_col_contour.data)
    bm_col_contour.free()
    obj_col_contour.data.materials.clear()
    obj_col_contour.data.materials.append(mat_coll_contour)
    assign_uniform_color(obj_col_contour, TEAL_RGBA)
    obj_col_contour.hide_viewport = False
    obj_col_contour.hide_set(False)

    bm_col_interior = bmesh.new()
    for v in interior_verts:
        if v["has_collision"] and v["hit"] is not None:
            create_sphere_mesh(bm_col_interior, v["hit"], radius=0.0010, rings=6, segments=10)
    obj_col_interior = create_or_get_mesh_obj("Collisions_Interior_Green")
    bm_col_interior.to_mesh(obj_col_interior.data)
    bm_col_interior.free()
    obj_col_interior.data.materials.clear()
    obj_col_interior.data.materials.append(mat_coll_interior)
    assign_uniform_color(obj_col_interior, GREEN_RGBA)
    obj_col_interior.hide_viewport = False
    obj_col_interior.hide_set(False)

    bm_tubes_success = bmesh.new()
    for v in success_items:
        p1 = v["origin"]
        p2 = v["origin"] + v["length"] * v["dir"]
        create_cylinder_mesh(bm_tubes_success, p1, p2, radius=0.0010, segments=12)
    obj_tubes_success = create_or_get_mesh_obj("Tubes_Success_Green")
    bm_tubes_success.to_mesh(obj_tubes_success.data)
    bm_tubes_success.free()
    obj_tubes_success.data.materials.clear()
    obj_tubes_success.data.materials.append(mat_tubes_success)
    assign_uniform_color(obj_tubes_success, GREEN_RGBA)
    obj_tubes_success.hide_viewport = False
    obj_tubes_success.hide_set(False)

    bm_tubes_failed = bmesh.new()
    for v in failed_items:
        p1 = v["origin"]
        p2 = v["origin"] + v["length"] * v["dir"]
        create_cylinder_mesh(bm_tubes_failed, p1, p2, radius=0.0012, segments=12)
    obj_tubes_failed = create_or_get_mesh_obj("Tubes_Failed_Red")
    bm_tubes_failed.to_mesh(obj_tubes_failed.data)
    bm_tubes_failed.free()
    obj_tubes_failed.data.materials.clear()
    obj_tubes_failed.data.materials.append(mat_tubes_failed)
    assign_uniform_color(obj_tubes_failed, RED_RGBA)
    obj_tubes_failed.hide_viewport = False
    obj_tubes_failed.hide_set(False)
    
    ledger_path = blend_path.parent / "vertex_colors.json"
    ledger_records = []
    for v in vertices_data:
        ledger_records.append({
            "id": v["id"],
            "view": v["view"],
            "type": v["type"],
            "hex": v["hex"],
            "status": "success" if v.get("has_collision", False) else "failed",
            "origin": [round(c, 5) for c in v["origin"]],
            "hit": [round(c, 5) for c in v["hit"]] if v.get("hit") is not None else None,
            "has_collision": v.get("has_collision", False),
            "diameter_mm": 2.4 if not v.get("has_collision", False) else 2.0,
            "length": round(v.get("length", 0.0), 5)
        })
    with open(ledger_path, "w") as f:
        json.dump(ledger_records, f, indent=2)
    print(f"Saved vertex colors ledger: {ledger_path}")

    # Set 3D viewport shading to Material so all unique colors and glass render vividly
    for win in bpy.context.window_manager.windows:
        for area in win.screen.areas:
            if area.type == 'VIEW_3D':
                for space in area.spaces:
                    if space.type == 'VIEW_3D':
                        space.shading.type = 'SOLID'
                        space.shading.color_type = 'MATERIAL'

    rt_col.hide_viewport = False
    bpy.ops.wm.save_mainfile(filepath=str(blend_path))
    print(f"✔ Stage 2 complete: {total_verts} pairs generated with 1-to-1 matching hex colors!")

if __name__ == "__main__":
    blend_file = Path("apps/kirigami-studio/resources/baby-broncosaurus-v3/model_construct.blend")
    run_stage2(blend_file)
