import bpy
import bmesh
from pathlib import Path
import re
import xml.etree.ElementTree as ET
import json

def clean_svg_and_json(cutouts_dir):
    views = ["left", "right", "front", "back", "top", "bottom"]
    json_path = cutouts_dir / "clean_cutouts_data.json"
    json_data = {}
    if json_path.exists():
        with open(json_path, "r", encoding="utf-8") as f:
            json_data = json.load(f)

    for v in views:
        clean_svg = cutouts_dir / f"{v}_clean.svg"
        contour_svg = cutouts_dir / f"{v}_contour.svg"
        if not clean_svg.exists() or not contour_svg.exists():
            continue

        tree_c = ET.parse(contour_svg)
        root_c = tree_c.getroot()
        poly = root_c.find(".//{http://www.w3.org/2000/svg}polygon")
        if poly is None:
            poly = root_c.find(".//polygon")
        if poly is None:
            continue

        raw_pts = [p.strip() for p in poly.attrib.get("points", "").split() if p.strip()]
        c_pts = []
        for p in raw_pts:
            parts = p.split(",")
            c_pts.append((round(float(parts[0]), 2), round(float(parts[1]), 2)))

        contour_edges = set()
        for i in range(len(c_pts)):
            p1 = c_pts[i]
            p2 = c_pts[(i + 1) % len(c_pts)]
            contour_edges.add(tuple(sorted([p1, p2])))

        tree_l = ET.parse(clean_svg)
        root_l = tree_l.getroot()
        clean_edges = set()
        for el in root_l.iter():
            d = el.attrib.get("d", "")
            pts = re.findall(r"([-\d.]+)[,\s]+([-\d.]+)", d)
            if len(pts) >= 2:
                for i in range(len(pts) - 1):
                    p1 = (round(float(pts[i][0]), 2), round(float(pts[i][1]), 2))
                    p2 = (round(float(pts[i + 1][0]), 2), round(float(pts[i + 1][1]), 2))
                    if p1 != p2:
                        clean_edges.add(tuple(sorted([p1, p2])))

        adj = {}
        for p1, p2 in clean_edges:
            adj.setdefault(p1, set()).add(p2)
            adj.setdefault(p2, set()).add(p1)

        dissolved = set()
        while True:
            target = None
            for pt, neighbors in adj.items():
                if len(neighbors) == 2:
                    incident = [tuple(sorted([pt, n])) for n in neighbors]
                    vincos = [e for e in incident if e not in contour_edges]
                    if len(vincos) == 0:
                        target = pt
                        break
                elif len(neighbors) < 2:
                    target = pt
                    break
            if not target:
                break

            neighbors = list(adj[target])
            if len(neighbors) == 2:
                n1, n2 = neighbors
                clean_edges.discard(tuple(sorted([target, n1])))
                clean_edges.discard(tuple(sorted([target, n2])))
                contour_edges.discard(tuple(sorted([target, n1])))
                contour_edges.discard(tuple(sorted([target, n2])))

                clean_edges.add(tuple(sorted([n1, n2])))
                contour_edges.add(tuple(sorted([n1, n2])))

                adj[n1].remove(target)
                adj[n2].remove(target)
                adj[n1].add(n2)
                adj[n2].add(n1)
                del adj[target]
            else:
                for n in neighbors:
                    clean_edges.discard(tuple(sorted([target, n])))
                    adj[n].discard(target)
                del adj[target]
            dissolved.add(target)

        if not dissolved:
            continue

        simplified_c_pts = [p for p in c_pts if p not in dissolved]

        w = root_l.attrib.get("width", "")
        h = root_l.attrib.get("height", "")
        vb = root_l.attrib.get("viewBox", f"0 0 {w} {h}")

        sorted_edges = sorted(clean_edges)
        paths_xml = "\n".join([f'    <path d="M {p1[0]:.2f},{p1[1]:.2f} L {p2[0]:.2f},{p2[1]:.2f}" />' for p1, p2 in sorted_edges])
        new_clean_svg_content = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{vb}">\n  <g fill="none" stroke="#111111" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">\n{paths_xml}\n  </g>\n</svg>\n'
        with open(clean_svg, "w", encoding="utf-8") as f:
            f.write(new_clean_svg_content)

        poly_pts_str = " ".join([f"{p[0]:.2f},{p[1]:.2f}" for p in simplified_c_pts])
        new_contour_svg_content = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{vb}">\n  <g fill="rgba(220, 225, 230, 0.9)" stroke="#000000" stroke-width="2.0" stroke-linejoin="round">\n    <polygon points="{poly_pts_str}" />\n  </g>\n</svg>\n'
        with open(contour_svg, "w", encoding="utf-8") as f:
            f.write(new_contour_svg_content)

        if v in json_data:
            v_data = json_data[v]
            old_verts = [(round(p[0], 2), round(p[1], 2)) for p in v_data.get("vertices", [])]
            vert_map = {}
            new_verts = []
            for idx, pt in enumerate(old_verts):
                if pt not in dissolved:
                    vert_map[idx] = len(new_verts)
                    new_verts.append([pt[0], pt[1]])
                else:
                    vert_map[idx] = None

            new_edges = []
            for p1, p2 in sorted_edges:
                i1 = next((i for i, pt in enumerate(new_verts) if abs(pt[0] - p1[0]) < 0.05 and abs(pt[1] - p1[1]) < 0.05), None)
                i2 = next((i for i, pt in enumerate(new_verts) if abs(pt[0] - p2[0]) < 0.05 and abs(pt[1] - p2[1]) < 0.05), None)
                if i1 is not None and i2 is not None:
                    new_edges.append([i1, i2])

            v_data["vertices"] = new_verts
            v_data["edges"] = new_edges

            new_contour_loop = []
            for p in simplified_c_pts:
                i_pt = next((i for i, pt in enumerate(new_verts) if abs(pt[0] - p[0]) < 0.05 and abs(pt[1] - p[1]) < 0.05), None)
                if i_pt is not None:
                    new_contour_loop.append(i_pt)
            v_data["contour_loops"] = [new_contour_loop]

    if json_data:
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(json_data, f, indent=2)

def clean_all_cutouts(blend_path):
    resolved = Path(blend_path).resolve()
    cutouts_dir = resolved.parent / "cutouts"
    if cutouts_dir.exists():
        clean_svg_and_json(cutouts_dir)

    bpy.ops.wm.open_mainfile(filepath=str(resolved))
    views = ["Left", "Right", "Front", "Back", "Top", "Bottom"]
    total_removed = 0

    for vname in views:
        clean_obj = bpy.data.objects.get(f"Cutout_Clean_{vname}")
        contour_obj = bpy.data.objects.get(f"Cutout_Contour_{vname}")
        if not clean_obj or not contour_obj:
            continue

        contour_edges = set()
        for e in contour_obj.data.edges:
            v1 = contour_obj.data.vertices[e.vertices[0]].co
            v2 = contour_obj.data.vertices[e.vertices[1]].co
            p1 = (round(v1.x, 4), round(v1.y, 4), round(v1.z, 4))
            p2 = (round(v2.x, 4), round(v2.y, 4), round(v2.z, 4))
            contour_edges.add(tuple(sorted([p1, p2])))

        bm = bmesh.new()
        bm.from_mesh(clean_obj.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0001)
        bm.verts.ensure_lookup_table()

        verts_with_vinco = set()
        for e in bm.edges:
            v1 = e.verts[0].co
            v2 = e.verts[1].co
            p1 = (round(v1.x, 4), round(v1.y, 4), round(v1.z, 4))
            p2 = (round(v2.x, 4), round(v2.y, 4), round(v2.z, 4))
            is_contour = tuple(sorted([p1, p2])) in contour_edges
            if not is_contour:
                verts_with_vinco.add(e.verts[0])
                verts_with_vinco.add(e.verts[1])

        to_dissolve = [v for v in bm.verts if v not in verts_with_vinco and len(v.link_edges) == 2]
        to_delete = [v for v in bm.verts if v not in verts_with_vinco and len(v.link_edges) < 2]

        if to_delete:
            bmesh.ops.delete(bm, geom=to_delete, context="VERTS")
            bm.verts.ensure_lookup_table()
        if to_dissolve:
            bmesh.ops.dissolve_verts(bm, verts=to_dissolve)
            bm.verts.ensure_lookup_table()

        total_removed += (len(to_dissolve) + len(to_delete))
        bm.to_mesh(clean_obj.data)
        remaining_coords = [v.co.copy() for v in bm.verts]
        bm.free()

        bm_c = bmesh.new()
        bm_c.from_mesh(contour_obj.data)
        bmesh.ops.remove_doubles(bm_c, verts=bm_c.verts, dist=0.0001)
        c_to_dissolve = [v for v in bm_c.verts if not any((v.co - rc).length < 0.0005 for rc in remaining_coords) and len(v.link_edges) == 2]
        c_to_delete = [v for v in bm_c.verts if not any((v.co - rc).length < 0.0005 for rc in remaining_coords) and len(v.link_edges) < 2]
        if c_to_delete:
            bmesh.ops.delete(bm_c, geom=c_to_delete, context="VERTS")
        if c_to_dissolve:
            bmesh.ops.dissolve_verts(bm_c, verts=c_to_dissolve)
        bm_c.to_mesh(contour_obj.data)
        bm_c.free()

    bpy.ops.wm.save_mainfile(filepath=str(resolved))

if __name__ == "__main__":
    blend_file = Path("apps/kirigami-studio/resources/baby-broncosaurus-v3/model_construct.blend")
    clean_all_cutouts(blend_file)
