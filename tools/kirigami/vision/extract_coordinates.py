import os
import sys
import json
from pathlib import Path
import cv2
import numpy as np
from skimage.morphology import skeletonize

def extract_view_graph(skeleton_img, r_cluster=7):
    ys, xs = np.where(skeleton_img > 0)
    pixel_set = set(zip(xs, ys))
    if not pixel_set:
        return [], []

    nbr_offsets = [(-1, -1), (0, -1), (1, -1),
                   (-1,  0),          (1,  0),
                   (-1,  1), (0,  1), (1,  1)]

    # Compute degree
    degree_map = {}
    for x, y in pixel_set:
        deg = sum(1 for dx, dy in nbr_offsets if (x + dx, y + dy) in pixel_set)
        degree_map[(x, y)] = deg

    # Critical points: junctions (deg >= 3) or endpoints (deg == 1)
    crit_points = [p for p in pixel_set if degree_map[p] != 2]

    # Cluster nearby critical points
    clusters = []
    used = set()
    for p in crit_points:
        if p in used:
            continue
        c_group = [p]
        used.add(p)
        for q in crit_points:
            if q not in used:
                if np.hypot(p[0]-q[0], p[1]-q[1]) <= r_cluster:
                    c_group.append(q)
                    used.add(q)
        cx = int(round(np.mean([pt[0] for pt in c_group])))
        cy = int(round(np.mean([pt[1] for pt in c_group])))
        clusters.append({
            'centroid': (cx, cy),
            'pixels': set(c_group)
        })

    # Map each critical pixel to cluster ID
    pixel_to_cluster = {}
    for cid, c in enumerate(clusters):
        for pt in c['pixels']:
            pixel_to_cluster[pt] = cid

    nodes = [{'id': i, 'x': c['centroid'][0], 'y': c['centroid'][1]} for i, c in enumerate(clusters)]

    # Trace paths between clusters
    edges = set()
    visited_edges = set()

    for p in pixel_set:
        for dx, dy in nbr_offsets:
            nx, ny = p[0] + dx, p[1] + dy
            if (nx, ny) in pixel_set:
                edge_id = tuple(sorted([p, (nx, ny)]))
                if edge_id not in visited_edges:
                    visited_edges.add(edge_id)
                    # Walk until hitting critical cluster or loop
                    path = [p, (nx, ny)]
                    curr = (nx, ny)
                    prev = p
                    while curr not in pixel_to_cluster:
                        cx, cy = curr
                        next_nbrs = [
                            (cx + ndx, cy + ndy)
                            for ndx, ndy in nbr_offsets
                            if (cx + ndx, cy + ndy) in pixel_set and (cx + ndx, cy + ndy) != prev
                        ]
                        if not next_nbrs:
                            break
                        nxt = next_nbrs[0]
                        visited_edges.add(tuple(sorted([curr, nxt])))
                        path.append(nxt)
                        prev = curr
                        curr = nxt

                    start_cid = pixel_to_cluster.get(p)
                    end_cid = pixel_to_cluster.get(curr)

                    # If start p was not in cluster, walk back from p to find its start cluster
                    if start_cid is None:
                        curr_b = p
                        prev_b = path[1]
                        while curr_b not in pixel_to_cluster:
                            cx, cy = curr_b
                            next_nbrs = [
                                (cx + ndx, cy + ndy)
                                for ndx, ndy in nbr_offsets
                                if (cx + ndx, cy + ndy) in pixel_set and (cx + ndx, cy + ndy) != prev_b
                            ]
                            if not next_nbrs:
                                break
                            nxt = next_nbrs[0]
                            visited_edges.add(tuple(sorted([curr_b, nxt])))
                            prev_b = curr_b
                            curr_b = nxt
                        start_cid = pixel_to_cluster.get(curr_b)

                    if start_cid is not None and end_cid is not None and start_cid != end_cid:
                        edges.add(tuple(sorted([start_cid, end_cid])))

    edge_list = [list(e) for e in sorted(edges)]
    return nodes, edge_list

def main():
    subject_dir = Path("apps/kirigami-studio/resources/baby-broncosaurus-v3")
    cutouts_dir = subject_dir / "cutouts"
    views = ["front", "back", "left", "right", "top", "bottom"]

    result = {}

    for v in views:
        lines_png = cutouts_dir / f"{v}_lines.png"
        if not lines_png.exists():
            print(f"WARN: {lines_png} not found")
            continue
        img = cv2.imread(str(lines_png), cv2.IMREAD_UNCHANGED)
        alpha = img[:, :, 3] if img.shape[2] == 4 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        binary = (alpha > 50).astype(np.uint8)
        skel = skeletonize(binary > 0).astype(np.uint8)

        nodes, edges = extract_view_graph(skel, r_cluster=8)
        result[v] = {
            "width": int(skel.shape[1]),
            "height": int(skel.shape[0]),
            "vertices": nodes,
            "edges": edges
        }
        print(f"View {v:6s}: {len(nodes)} vertices, {len(edges)} edges detected")

    # Correlate across primary views: left (X: tail->head, Z: bottom->top), top (X: tail->head, Y: left->right)
    # In left view: normalized u in [0, 1] is length (X), v in [0, 1] is height (Z, inverted Y in image)
    # In top view: normalized u in [0, 1] is length (X), v in [0, 1] is width (Y)
    left_nodes = result["left"]["vertices"]
    top_nodes = result["top"]["vertices"]
    lw, lh = result["left"]["width"], result["left"]["height"]
    tw, th = result["top"]["width"], result["top"]["height"]

    pts_3d = []
    pid = 0

    # Build 3D points from left view and find closest matching X in top view
    for ln in left_nodes:
        norm_x = ln["x"] / lw
        norm_z = 1.0 - (ln["y"] / lh)

        # Find top points with similar normalized X
        matching_top = [tn for tn in top_nodes if abs((tn["x"] / tw) - norm_x) < 0.08]
        if matching_top:
            for tn in matching_top:
                norm_y = (tn["y"] / th) - 0.5
                pts_3d.append({
                    "id": pid,
                    "x": round(float(norm_x * 278.8), 2),  # mm length
                    "y": round(float(norm_y * 96.5), 2),   # mm width
                    "z": round(float(norm_z * 200.0), 2),  # mm height
                    "left_id": ln["id"],
                    "top_id": tn["id"]
                })
                pid += 1
        else:
            # Symmetrical centerline default
            pts_3d.append({
                "id": pid,
                "x": round(float(norm_x * 278.8), 2),
                "y": 0.0,
                "z": round(float(norm_z * 200.0), 2),
                "left_id": ln["id"],
                "top_id": None
            })
            pid += 1

    # Connect edges in 3D using adjacency in left and top views
    for p in pts_3d:
        p["edges"] = []
        p_lid = p["left_id"]
        # Find neighbors in left_edges
        nbr_lids = [e[1] if e[0] == p_lid else e[0] for e in result["left"]["edges"] if p_lid in e]
        for other in pts_3d:
            if other["id"] != p["id"] and other["left_id"] in nbr_lids:
                if other["id"] not in p["edges"]:
                    p["edges"].append(other["id"])

    result["3d"] = pts_3d

    out_json = subject_dir / "coordinates.json"
    with open(out_json, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\nSUCCESS: Generated {out_json} with {len(pts_3d)} reconstructed 3D vertices and complete 2D view scans.")

if __name__ == "__main__":
    main()
