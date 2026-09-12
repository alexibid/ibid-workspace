import bpy
import bmesh
from mathutils import Vector
from pathlib import Path
import json

def get_sphere_centers(obj_name):
    obj = bpy.data.objects.get(obj_name)
    if not obj:
        return []
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    visited = set()
    centers = []
    for v in bm.verts:
        if v in visited:
            continue
        comp = []
        stack = [v]
        visited.add(v)
        while stack:
            curr = stack.pop()
            comp.append(curr.co)
            for e in curr.link_edges:
                o = e.other_vert(curr)
                if o not in visited:
                    visited.add(o)
                    stack.append(o)
        centers.append(sum(comp, Vector((0, 0, 0))) / len(comp))
    bm.free()
    return centers

def setup_color_material(name, col_rgba, emission_strength=0.5):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name)
    mat.diffuse_color = col_rgba
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    node_out = nodes.new("ShaderNodeOutputMaterial")
    node_bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    node_bsdf.inputs["Base Color"].default_value = col_rgba
    node_bsdf.inputs["Emission Color"].default_value = col_rgba
    node_bsdf.inputs["Emission Strength"].default_value = emission_strength
    node_bsdf.inputs["Roughness"].default_value = 0.30
    links.new(node_bsdf.outputs["BSDF"], node_out.inputs["Surface"])
    return mat

def run_stage4(blend_path):
    resolved_path = Path(blend_path).resolve()
    bpy.ops.wm.open_mainfile(filepath=str(resolved_path))

    cons_spheres = get_sphere_centers("Stage3_Consolidated_Spheres")
    if not cons_spheres:
        cons_spheres = get_sphere_centers("Stage4_Consolidated_Spheres")
    if not cons_spheres:
        raise ValueError("No consolidated spheres found in model_construct.blend")

    views_cfg = {
        "Left":   {"dir": Vector((0.0, -1.0, 0.0)), "axes": (0, 2), "depth_axis": 1, "sign": -1},
        "Right":  {"dir": Vector((0.0, 1.0, 0.0)),  "axes": (0, 2), "depth_axis": 1, "sign": 1},
        "Front":  {"dir": Vector((-1.0, 0.0, 0.0)), "axes": (1, 2), "depth_axis": 0, "sign": -1},
        "Back":   {"dir": Vector((1.0, 0.0, 0.0)),  "axes": (1, 2), "depth_axis": 0, "sign": 1},
        "Top":    {"dir": Vector((0.0, 0.0, -1.0)), "axes": (0, 1), "depth_axis": 2, "sign": -1},
        "Bottom": {"dir": Vector((0.0, 0.0, 1.0)),  "axes": (0, 1), "depth_axis": 2, "sign": 1},
    }

    view_targets = {}
    sphere_claims = {i: [] for i in range(len(cons_spheres))}

    for vname, cfg in views_cfg.items():
        f_obj = bpy.data.objects.get(f"Cutout_Clean_{vname}")
        if not f_obj:
            continue
        a1, a2 = cfg["axes"]
        da = cfg["depth_axis"]
        sign = cfg["sign"]

        verts = f_obj.data.vertices
        v_map = []
        for idx, v in enumerate(verts):
            co = v.co
            best_s_idx = None
            best_d = float('inf')
            for s_idx, s in enumerate(cons_spheres):
                d_plane = ((co[a1] - s[a1])**2 + (co[a2] - s[a2])**2)**0.5
                depth = (s[da] - co[da]) * sign
                if d_plane <= 0.0035 and depth > 0.0005:
                    if d_plane < best_d:
                        best_d = d_plane
                        best_s_idx = s_idx
            if best_s_idx is None:
                for s_idx, s in enumerate(cons_spheres):
                    d_plane = ((co[a1] - s[a1])**2 + (co[a2] - s[a2])**2)**0.5
                    depth = (s[da] - co[da]) * sign
                    if d_plane <= 0.0120 and depth > 0.0001:
                        if d_plane < best_d:
                            best_d = d_plane
                            best_s_idx = s_idx
            v_map.append(best_s_idx)
            if best_s_idx is not None:
                sphere_claims[best_s_idx].append((vname, idx))
        view_targets[vname] = v_map

    target_col_name = "Snapped Cutouts"
    target_col = bpy.data.collections.get(target_col_name)
    if not target_col:
        target_col = bpy.data.collections.new(target_col_name)
        bpy.context.scene.collection.children.link(target_col)

    GREEN_RGBA = (0.10, 0.80, 0.20, 1.0)
    YELLOW_RGBA = (1.00, 0.85, 0.10, 1.0)
    RED_RGBA = (0.90, 0.15, 0.15, 1.0)

    mat_green = setup_color_material("Mat_Snapped_Valid_Green", GREEN_RGBA, emission_strength=0.5)
    mat_yellow = setup_color_material("Mat_Snapped_Duplicate_Yellow", YELLOW_RGBA, emission_strength=0.6)
    mat_red = setup_color_material("Mat_Snapped_Unconnected_Red", RED_RGBA, emission_strength=0.7)

    created_objects = []
    stats_per_view = {}

    for vname, cfg in views_cfg.items():
        src_obj = bpy.data.objects.get(f"Cutout_Clean_{vname}")
        if not src_obj:
            continue

        v_map = view_targets[vname]
        mesh_name = f"Snapped_Cutout_{vname}"
        old_obj = bpy.data.objects.get(mesh_name)

        bm_faces = bmesh.new()
        bm_faces.from_mesh(src_obj.data)
        bmesh.ops.edgenet_fill(bm_faces, edges=bm_faces.edges)
        new_mesh = bpy.data.meshes.new(mesh_name)
        bm_faces.to_mesh(new_mesh)
        bm_faces.free()

        vert_colors = []
        unconnected_count = 0
        duplicate_count = 0
        unique_count = 0

        for idx, v in enumerate(new_mesh.vertices):
            s_idx = v_map[idx]
            if s_idx is not None:
                v.co = cons_spheres[s_idx]
                if len(set(c[0] for c in sphere_claims[s_idx])) > 1:
                    vert_colors.append(YELLOW_RGBA)
                    duplicate_count += 1
                else:
                    vert_colors.append(GREEN_RGBA)
                    unique_count += 1
            else:
                vert_colors.append(RED_RGBA)
                unconnected_count += 1

        new_mesh.materials.clear()
        new_mesh.materials.append(mat_green)
        new_mesh.materials.append(mat_yellow)
        new_mesh.materials.append(mat_red)

        for poly in new_mesh.polygons:
            has_red = any(v_map[vi] is None for vi in poly.vertices)
            has_yellow = any(
                v_map[vi] is not None and len(set(c[0] for c in sphere_claims[v_map[vi]])) > 1
                for vi in poly.vertices
            )
            if has_red:
                poly.material_index = 2
            elif has_yellow:
                poly.material_index = 1
            else:
                poly.material_index = 0

        ca = new_mesh.color_attributes.new(name="Color", type='FLOAT_COLOR', domain='POINT')
        for idx, elem in enumerate(ca.data):
            elem.color = vert_colors[idx]

        if old_obj:
            old_mesh = old_obj.data
            old_obj.data = new_mesh
            if old_mesh and old_mesh.users == 0:
                bpy.data.meshes.remove(old_mesh)
            snapped_obj = old_obj
        else:
            snapped_obj = bpy.data.objects.new(mesh_name, new_mesh)
            target_col.objects.link(snapped_obj)

        snapped_obj.hide_viewport = False
        snapped_obj.hide_set(False)
        created_objects.append(snapped_obj.name)

        stats_per_view[vname] = {
            "total_vertices": len(new_mesh.vertices),
            "unconnected_red": unconnected_count,
            "duplicate_yellow": duplicate_count,
            "unique_green": unique_count,
            "total_faces": len(new_mesh.polygons)
        }

    recon_col_name = "Reconstructed Model"
    recon_col = bpy.data.collections.get(recon_col_name)
    if not recon_col:
        recon_col = bpy.data.collections.new(recon_col_name)
        bpy.context.scene.collection.children.link(recon_col)

    combined_bm = bmesh.new()
    for vname in views_cfg.keys():
        s_obj = bpy.data.objects.get(f"Snapped_Cutout_{vname}")
        if s_obj:
            combined_bm.from_mesh(s_obj.data)

    bmesh.ops.remove_doubles(combined_bm, verts=combined_bm.verts, dist=0.0015)
    recon_mesh_name = "Stage5_Model_Reconstructed_3D"
    recon_mesh = bpy.data.meshes.new(recon_mesh_name)
    combined_bm.to_mesh(recon_mesh)
    combined_bm.free()

    mat_recon = bpy.data.materials.get("Mat_Reconstructed_3D")
    if not mat_recon:
        mat_recon = setup_color_material("Mat_Reconstructed_3D", (0.88, 0.88, 0.88, 1.0), emission_strength=0.1)
    recon_mesh.materials.append(mat_recon)

    recon_obj = bpy.data.objects.get(recon_mesh_name)
    if recon_obj:
        old_rmesh = recon_obj.data
        recon_obj.data = recon_mesh
        if old_rmesh and old_rmesh.users == 0:
            bpy.data.meshes.remove(old_rmesh)
    else:
        recon_obj = bpy.data.objects.new(recon_mesh_name, recon_mesh)
        recon_col.objects.link(recon_obj)

    recon_obj.hide_viewport = True
    recon_obj.hide_set(True)

    summary_path = resolved_path.parent / "stage4_summary.json"
    summary_data = {
        "collection": target_col_name,
        "created_objects": created_objects,
        "reconstructed_model": {
            "name": recon_mesh_name,
            "total_vertices": len(recon_mesh.vertices),
            "total_faces": len(recon_mesh.polygons)
        },
        "views": stats_per_view
    }
    with open(summary_path, "w") as f:
        json.dump(summary_data, f, indent=2)

    target_col.hide_viewport = False

    for win in bpy.context.window_manager.windows:
        for area in win.screen.areas:
            if area.type == 'VIEW_3D':
                for space in area.spaces:
                    if space.type == 'VIEW_3D':
                        space.shading.type = 'SOLID'
                        space.shading.color_type = 'MATERIAL'

    verts_data = [v.co.copy() for v in recon_mesh.vertices]
    faces_data = [[vi for vi in p.vertices] for p in recon_mesh.polygons]

    bpy.ops.wm.save_mainfile(filepath=str(resolved_path))

    model_blend_path = resolved_path.parent / "model.blend"
    model_glb_path = resolved_path.parent / "model.glb"

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bm_export = bmesh.new()
    for co in verts_data:
        bm_export.verts.new(co)
    bm_export.verts.ensure_lookup_table()
    for f_indices in faces_data:
        try:
            bm_export.faces.new([bm_export.verts[i] for i in f_indices])
        except ValueError:
            pass
    export_mesh = bpy.data.meshes.new("Model_BabyBroncosaurus")
    bm_export.to_mesh(export_mesh)
    bm_export.free()

    mat = setup_color_material("Mat_BabyBroncosaurus", (0.85, 0.85, 0.85, 1.0), emission_strength=0.1)
    export_mesh.materials.append(mat)

    export_obj = bpy.data.objects.new("Model_BabyBroncosaurus", export_mesh)
    bpy.context.scene.collection.objects.link(export_obj)

    bpy.ops.export_scene.gltf(
        filepath=str(model_glb_path),
        export_format='GLB'
    )

    bpy.ops.wm.save_as_mainfile(filepath=str(model_blend_path))

    print(f"✔ Stage 4 complete: {len(created_objects)} snapped cutout meshes created in '{target_col_name}', reconstructed model updated, model.blend and model.glb exported")

if __name__ == "__main__":
    blend_file = Path("apps/kirigami-studio/resources/baby-broncosaurus-v3/model_construct.blend")
    run_stage4(blend_file)
