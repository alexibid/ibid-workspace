import os
import sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from skimage.morphology import skeletonize

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import rembg

def trace_skeleton_to_svg(skeleton_img, svg_path, stroke_width=1.5):
    h, w = skeleton_img.shape
    visited = np.zeros((h, w), dtype=bool)
    lines = []

    ys, xs = np.where(skeleton_img > 0)
    pixel_set = set(zip(xs, ys))

    nbr_offsets = [(-1, -1), (0, -1), (1, -1),
                   (-1,  0),          (1,  0),
                   (-1,  1), (0,  1), (1,  1)]

    degree_map = {}
    for x, y in pixel_set:
        deg = 0
        for dx, dy in nbr_offsets:
            if (x + dx, y + dy) in pixel_set:
                deg += 1
        degree_map[(x, y)] = deg

    # Start paths from endpoints (deg == 1) or junctions (deg != 2)
    starts = [p for p in pixel_set if degree_map[p] != 2]
    if not starts:
        starts = list(pixel_set)

    visited_edges = set()

    for sx, sy in starts:
        for dx, dy in nbr_offsets:
            nx, ny = sx + dx, sy + dy
            edge_id = tuple(sorted([(sx, sy), (nx, ny)]))
            if (nx, ny) in pixel_set and edge_id not in visited_edges:
                path = [(sx, sy), (nx, ny)]
                visited_edges.add(edge_id)
                curr = (nx, ny)
                prev = (sx, sy)

                while degree_map.get(curr, 0) == 2:
                    cx, cy = curr
                    next_nbrs = [
                        (cx + ndx, cy + ndy)
                        for ndx, ndy in nbr_offsets
                        if (cx + ndx, cy + ndy) in pixel_set and (cx + ndx, cy + ndy) != prev
                    ]
                    if not next_nbrs:
                        break
                    nxt = next_nbrs[0]
                    edge = tuple(sorted([curr, nxt]))
                    if edge in visited_edges:
                        break
                    visited_edges.add(edge)
                    path.append(nxt)
                    prev = curr
                    curr = nxt

                if len(path) > 1:
                    # Simplify path using Douglas-Peucker
                    pts_np = np.array(path, dtype=np.int32).reshape((-1, 1, 2))
                    approx = cv2.approxPolyDP(pts_np, epsilon=1.2, closed=False)
                    simplified = [tuple(p[0]) for p in approx]
                    lines.append(simplified)

    # Any remaining unvisited loops
    for p in pixel_set:
        for dx, dy in nbr_offsets:
            nx, ny = p[0] + dx, p[1] + dy
            edge_id = tuple(sorted([p, (nx, ny)]))
            if (nx, ny) in pixel_set and edge_id not in visited_edges:
                path = [p, (nx, ny)]
                visited_edges.add(edge_id)
                curr = (nx, ny)
                prev = p
                while True:
                    cx, cy = curr
                    next_nbrs = [
                        (cx + ndx, cy + ndy)
                        for ndx, ndy in nbr_offsets
                        if (cx + ndx, cy + ndy) in pixel_set and (cx + ndx, cy + ndy) != prev
                    ]
                    if not next_nbrs:
                        break
                    nxt = next_nbrs[0]
                    edge = tuple(sorted([curr, nxt]))
                    if edge in visited_edges:
                        path.append(nxt)
                        break
                    visited_edges.add(edge)
                    path.append(nxt)
                    prev = curr
                    curr = nxt
                if len(path) > 2:
                    pts_np = np.array(path, dtype=np.int32).reshape((-1, 1, 2))
                    approx = cv2.approxPolyDP(pts_np, epsilon=1.2, closed=False)
                    simplified = [tuple(pt[0]) for pt in approx]
                    lines.append(simplified)

    # Write clean SVG with uniform stroke-width
    svg_lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
        f'  <g fill="none" stroke="#000000" stroke-width="{stroke_width:.1f}" stroke-linecap="round" stroke-linejoin="round">'
    ]
    for seg in lines:
        d = "M " + " L ".join(f"{x},{y}" for x, y in seg)
        svg_lines.append(f'    <path d="{d}" />')
    svg_lines.append('  </g>')
    svg_lines.append('</svg>\n')

    Path(svg_path).write_text("\n".join(svg_lines))
    return lines

def main():
    subject_dir = Path("apps/kirigami-studio/resources/baby-broncosaurus-v3")
    sheet_path = subject_dir / "sheet.png"
    if not sheet_path.exists():
        sheet_path = subject_dir / "sheet_6views.png"
    if not sheet_path.exists():
        print(f"ERROR: {sheet_path} does not exist.")
        sys.exit(1)

    cutouts_dir = subject_dir / "cutouts"
    cutouts_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading sheet: {sheet_path}")
    img_bgr = cv2.imread(str(sheet_path))
    h, w, _ = img_bgr.shape

    # 1. Segment 6 view islands using background difference
    bg_color = np.median([img_bgr[0,0], img_bgr[0, w-1], img_bgr[h-1, 0], img_bgr[h-1, w-1]], axis=0)
    diff = np.max(np.abs(img_bgr.astype(np.float32) - bg_color.astype(np.float32)), axis=2)
    mask = (diff > 18).astype(np.uint8) * 255

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25))
    closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(closed)

    blobs = []
    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        if area > 15000:
            x = stats[i, cv2.CC_STAT_LEFT]
            y = stats[i, cv2.CC_STAT_TOP]
            bw = stats[i, cv2.CC_STAT_WIDTH]
            bh = stats[i, cv2.CC_STAT_HEIGHT]
            cx, cy = centroids[i]
            blobs.append({'bbox': (x, y, bw, bh), 'center': (cx, cy), 'area': area})

    top_row = sorted([b for b in blobs if b['center'][1] < h/2], key=lambda b: b['center'][0])
    bot_row = sorted([b for b in blobs if b['center'][1] >= h/2], key=lambda b: b['center'][0])

    view_blobs = {
        'front': top_row[0],
        'left': top_row[1],
        'right': top_row[2],
        'back': bot_row[0],
        'top': bot_row[1],
        'bottom': bot_row[2]
    }

    pil_sheet = Image.open(str(sheet_path))
    margin = 25

    print("Initializing rembg cutter (birefnet-general)...")
    session = rembg.new_session("birefnet-general")

    for view, b in view_blobs.items():
        print(f"\nProcessing view: {view}")
        x, y, bw, bh = b['bbox']
        x0 = max(0, x - margin)
        y0 = max(0, y - margin)
        x1 = min(w, x + bw + margin)
        y1 = min(h, y + bh + margin)

        crop = pil_sheet.crop((x0, y0, x1, y1))
        # Preserve native unrotated crop from sheet (rotation is handled by universal cross-correlation test)

        # Apply BiRefNet cutout to remove grey background
        cutout_full = rembg.remove(crop.convert("RGB"), session=session)
        rgba_full = np.asarray(cutout_full.convert("RGBA"))
        rgb = rgba_full[:, :, :3]
        alpha = rgba_full[:, :, 3]
        skin = alpha > 128

        # --- VERSION 1: Com Vincos (Full Cutout Original com cores e vincos) ---
        v1_path = cutouts_dir / f"{view}.png"
        cutout_full.save(v1_path)
        print(f"  [1] Cutout com vincos: {v1_path.name}")

        # --- Detect Creases and Contours ---
        gray = cv2.cvtColor(rgb, cv2.COLOR_BGR2GRAY)
        dark_pixels = (gray < 95) & skin

        dark_uint8 = dark_pixels.astype(np.uint8) * 255
        num_comp, comp_labels, comp_stats, comp_centroids = cv2.connectedComponentsWithStats(dark_uint8)
        
        crease_mask = np.zeros_like(dark_uint8)
        cosmetic_mask = np.zeros_like(dark_uint8)

        for i in range(1, num_comp):
            area = comp_stats[i, cv2.CC_STAT_AREA]
            bw = comp_stats[i, cv2.CC_STAT_WIDTH]
            bh = comp_stats[i, cv2.CC_STAT_HEIGHT]
            solidity = area / max(1, bw * bh)

            is_drawn_feature = (area > 50 and solidity > 0.30 and min(bw, bh) >= 6) or (area < 25 and min(bw, bh) >= 4)
            if is_drawn_feature:
                cosmetic_mask[comp_labels == i] = 255
            else:
                crease_mask[comp_labels == i] = 255

        dark_lines = crease_mask > 0

        # Find outer contour mask
        skin_uint8 = skin.astype(np.uint8) * 255
        contours, _ = cv2.findContours(skin_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contour_mask = np.zeros_like(skin_uint8)
        cv2.drawContours(contour_mask, contours, -1, 255, 3)
        contour_lines = contour_mask > 0

        all_lines = dark_lines | contour_lines

        # --- VERSION 2: Sem Vincos e Contorno (Preenchimento perfeito copiando a cor contigua mais proxima) ---
        # Mask out lines and cosmetic artifacts
        line_mask_dilated = cv2.dilate(all_lines.astype(np.uint8) * 255, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))) > 0
        cosmetic_dilated = cv2.dilate(cosmetic_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))) > 0
        
        # Specular highlights in eyes
        specular = (gray > 220) & cv2.dilate(cosmetic_dilated.astype(np.uint8)*255, np.ones((15, 15), np.uint8)) > 0
        
        mask_to_fill = (line_mask_dilated | cosmetic_dilated | specular) & skin
        valid_source = skin & (~mask_to_fill)

        colored = np.zeros_like(rgb)
        colored[valid_source] = rgb[valid_source]
        filled_mask = valid_source.copy()

        # Propagate pure contiguous facet colors iteratively
        kernel_prop = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        for _ in range(40):
            if np.all(filled_mask[skin]):
                break
            frontier = (cv2.dilate(filled_mask.astype(np.uint8), kernel_prop) > 0) & (~filled_mask) & skin
            for c in range(3):
                dil_c = cv2.dilate(colored[:, :, c], kernel_prop)
                colored[frontier, c] = dil_c[frontier]
            filled_mask[frontier] = True

        smoothed = cv2.bilateralFilter(colored, 5, 25, 25)
        clean_rgb = np.where(mask_to_fill[:, :, None], smoothed, rgb)

        v2_rgba = np.dstack([clean_rgb, alpha])
        v2_path = cutouts_dir / f"{view}_clean.png"
        Image.fromarray(v2_rgba).save(v2_path)
        print(f"  [2] Cutout sem vincos (cor contigua perfeita): {v2_path.name}")

        # --- VERSION 3: Apenas os Vincos e Contorno ---
        v3_rgb = np.zeros_like(rgb)
        v3_alpha = np.where(all_lines, 255, 0).astype(np.uint8)
        v3_rgba = np.dstack([v3_rgb, v3_alpha])
        v3_path = cutouts_dir / f"{view}_lines.png"
        Image.fromarray(v3_rgba).save(v3_path)
        print(f"  [3] Cutout apenas vincos/contorno: {v3_path.name}")

        # --- Skeletonize & Generate SVG with UNIFORM Line Thickness ---
        skel = skeletonize(all_lines)
        svg_path = cutouts_dir / f"{view}_lines.svg"
        lines = trace_skeleton_to_svg(skel.astype(np.uint8), svg_path, stroke_width=1.5)
        print(f"  [SVG] Vetores uniformes (stroke=1.5): {svg_path.name} ({len(lines)} segmentos)")

    print("\nDONE: All 3 versions and uniform SVGs generated in cutouts/")

if __name__ == "__main__":
    main()
