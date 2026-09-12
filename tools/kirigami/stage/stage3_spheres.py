import bpy
import bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from pathlib import Path
import json

def setup_emissive_material(name, color_rgba, emission_strength=0.6):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name)
    mat.diffuse_color = color_rgba
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    node_out = nodes.new("ShaderNodeOutputMaterial")
    node_bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    
    node_bsdf.inputs["Base Color"].default_value = color_rgba
    node_bsdf.inputs["Emission Color"].default_value = color_rgba
    node_bsdf.inputs["Emission Strength"].default_value = emission_strength
    node_bsdf.inputs["Roughness"].default_value = 0.25
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
    return (pt1 + pt2) * 0.5, (t1, t2), (pt1 - pt2).length

def cluster_points(points, radius_tolerance=0.0015):
    clusters = []
    for p in points:
        assigned = False
        for c in clusters:
            centroid = sum(c, Vector((0.0, 0.0, 0.0))) / len(c)
            if (p - centroid).length <= radius_tolerance:
                c.append(p)
                assigned = True
                break
        if not assigned:
            clusters.append([p])
    return [sum(c, Vector((0.0, 0.0, 0.0))) / len(c) for c in clusters]

def run_stage3(blend_path):
    resolved_path = Path(blend_path).resolve()
    bpy.ops.wm.open_mainfile(filepath=str(resolved_path))

    mold = bpy.data.objects.get("Molde_Solid")
    if not mold:
        raise ValueError("Molde_Solid not found in scene")
    bvh_mold = BVHTree.FromPolygons([v.co for v in mold.data.vertices], [p.vertices for p in mold.data.polygons])

    q_col = bpy.data.collections.get("Quadrant Blocks")
    quadrants = {}
    if q_col:
        for obj in q_col.objects:
            coords = [obj.matrix_world @ v.co for v in obj.data.vertices]
            min_c = Vector((min(c.x for c in coords), min(c.y for c in coords), min(c.z for c in coords)))
            max_c = Vector((max(c.x for c in coords), max(c.y for c in coords), max(c.z for c in coords)))
            quadrants[obj.name] = (min_c, max_c)

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

        for co in contour_coords:
            contour_items.append({"view": vname, "type": "contour", "origin": co, "dir": cfg["dir"]})
        for co in clean_coords:
            if not any((co - c_co).length < 0.0005 for c_co in contour_coords):
                interior_items.append({"view": vname, "type": "interior", "origin": co, "dir": cfg["dir"]})

    ledger_path = resolved_path.parent / "vertex_colors.json"
    if ledger_path.exists():
        with open(ledger_path) as f:
            records = json.load(f)
        for r in records:
            if r.get("has_collision") and r.get("hit"):
                pt = Vector(r["hit"])
                if r.get("type") == "contour":
                    contour_hits.append(pt)
                else:
                    interior_hits.append(pt)
    else:
        for item in interior_items:
            hit, norm, idx, dist = bvh_mold.ray_cast(item["origin"] + item["dir"] * 0.0001, item["dir"])
            if hit and dist:
                interior_hits.append(hit)

        threshold = 0.0035
        for i, r1 in enumerate(contour_items):
            candidates = []
            for j, r2 in enumerate(contour_items):
                if r1["view"] == r2["view"] or r1["dir"].dot(r2["dir"]) < -0.99:
                    continue
                mid, times, d = ray_ray_closest(r1["origin"], r1["dir"], r2["origin"], r2["dir"])
                if mid is not None and d <= threshold:
                    candidates.append((times[0], mid))
            candidates.sort(key=lambda x: x[0])
            for t1, mid in candidates:
                near, n, idx, dist_m = bvh_mold.find_nearest(mid)
                if dist_m <= 0.0120:
                    contour_hits.append(mid)
                    break

    unique_contour_hits = []
    for pt in contour_hits:
        if not any((pt - c).length < 0.0015 for c in unique_contour_hits):
            unique_contour_hits.append(pt)

    all_contacts = unique_contour_hits + interior_hits

    quad_contacts = {name: [] for name in quadrants}
    tol = 0.0010
    for pt in all_contacts:
        for name, (min_c, max_c) in quadrants.items():
            if (min_c.x - tol <= pt.x <= max_c.x + tol and
                min_c.y - tol <= pt.y <= max_c.y + tol and
                min_c.z - tol <= pt.z <= max_c.z + tol):
                quad_contacts[name].append(pt)
                break

    consolidated_points = cluster_points(all_contacts, radius_tolerance=0.0015)

    contact_col = bpy.data.collections.get("Contact Spheres")
    if not contact_col:
        contact_col = bpy.data.collections.new("Contact Spheres")
        bpy.context.scene.collection.children.link(contact_col)

    cons_col = bpy.data.collections.get("Consolidated Spheres")
    if not cons_col:
        cons_col = bpy.data.collections.new("Consolidated Spheres")
        bpy.context.scene.collection.children.link(cons_col)


    TEAL_RGBA = (0.05, 0.78, 0.65, 1.0)
    AMBER_RGBA = (1.0, 0.65, 0.12, 1.0)
    GREEN_RGBA = (0.08, 0.90, 0.35, 1.0)

    mat_contact_teal = setup_emissive_material("Mat_Contact_Contour_Teal", TEAL_RGBA, emission_strength=0.7)
    mat_contact_interior = setup_emissive_material("Mat_Contact_Interior_Amber", AMBER_RGBA, emission_strength=0.6)
    mat_cons = setup_emissive_material("Mat_Consolidated_Spheres", GREEN_RGBA, emission_strength=0.8)

    bm_contact = bmesh.new()
    num_contour = len(unique_contour_hits)
    vert_colors_contact = []
    
    for idx, pt in enumerate(all_contacts):
        bmesh.ops.create_icosphere(bm_contact, subdivisions=1, radius=0.00085, matrix=Matrix.Translation(pt))
        col = TEAL_RGBA if idx < num_contour else AMBER_RGBA
        # Each subdivisions=1 icosphere has 12 vertices
        for _ in range(12):
            vert_colors_contact.append(col)
    
    obj_contact = bpy.data.objects.get("Stage3_Contact_Spheres")
    mesh_contact = bpy.data.meshes.new("Stage3_Contact_Spheres")
    bm_contact.to_mesh(mesh_contact)
    bm_contact.free()
    
    mesh_contact.materials.clear()
    mesh_contact.materials.append(mat_contact_interior) # slot 0
    mesh_contact.materials.append(mat_contact_teal)     # slot 1
    
    # 20 faces per icosphere
    for f_idx, poly in enumerate(mesh_contact.polygons):
        sphere_idx = f_idx // 20
        poly.material_index = 1 if sphere_idx < num_contour else 0
        
    if obj_contact:
        old_mesh = obj_contact.data
        obj_contact.data = mesh_contact
        if old_mesh and old_mesh.users == 0:
            bpy.data.meshes.remove(old_mesh)
    else:
        obj_contact = bpy.data.objects.new("Stage3_Contact_Spheres", mesh_contact)
        contact_col.objects.link(obj_contact)
        
    ca_c = obj_contact.data.color_attributes.get("Color") or obj_contact.data.color_attributes.new(name="Color", type='FLOAT_COLOR', domain='POINT')
    for idx, elem in enumerate(ca_c.data):
        elem.color = vert_colors_contact[idx]
    obj_contact.hide_viewport = False
    obj_contact.hide_set(False)

    bm_cons = bmesh.new()
    for pt in consolidated_points:
        bmesh.ops.create_icosphere(bm_cons, subdivisions=1, radius=0.00110, matrix=Matrix.Translation(pt))
    
    obj_cons = bpy.data.objects.get("Stage3_Consolidated_Spheres")
    mesh_cons = bpy.data.meshes.new("Stage3_Consolidated_Spheres")
    bm_cons.to_mesh(mesh_cons)
    bm_cons.free()
    if obj_cons:
        old_mesh = obj_cons.data
        obj_cons.data = mesh_cons
        if old_mesh and old_mesh.users == 0:
            bpy.data.meshes.remove(old_mesh)
    else:
        obj_cons = bpy.data.objects.new("Stage3_Consolidated_Spheres", mesh_cons)
        cons_col.objects.link(obj_cons)
    obj_cons.data.materials.clear()
    obj_cons.data.materials.append(mat_cons)
    ca_cons = obj_cons.data.color_attributes.get("Color") or obj_cons.data.color_attributes.new(name="Color", type='FLOAT_COLOR', domain='POINT')
    for elem in ca_cons.data:
        elem.color = GREEN_RGBA
    obj_cons.hide_viewport = False
    obj_cons.hide_set(False)

    summary_path = resolved_path.parent / "stage3_summary.json"
    summary_data = {
        "total_contacts": len(all_contacts),
        "unique_contour_hits": len(unique_contour_hits),
        "interior_hits": len(interior_hits),
        "consolidated_spheres": len(consolidated_points),
        "quadrant_distribution": {k: len(v) for k, v in quad_contacts.items()}
    }
    with open(summary_path, "w") as f:
        json.dump(summary_data, f, indent=2)

    contact_col.hide_viewport = False
    cons_col.hide_viewport = False

    for win in bpy.context.window_manager.windows:
        for area in win.screen.areas:
            if area.type == 'VIEW_3D':
                for space in area.spaces:
                    if space.type == 'VIEW_3D':
                        space.shading.type = 'SOLID'
                        space.shading.color_type = 'MATERIAL'

    bpy.ops.wm.save_mainfile(filepath=str(resolved_path))
    print(f"✔ Stage 3 complete: {len(all_contacts)} contact spheres, {len(consolidated_points)} consolidated spheres")

if __name__ == "__main__":
    blend_file = Path("apps/kirigami-studio/resources/baby-broncosaurus-v3/model_construct.blend")
    run_stage3(blend_file)
