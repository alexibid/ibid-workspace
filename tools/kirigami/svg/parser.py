import math
from pathlib import Path
import xml.etree.ElementTree as ET
from typing import List, Tuple, Set, Dict

def parse_svg_paths(svg_path: Path) -> List[Tuple[Tuple[float, float], Tuple[float, float]]]:
    tree = ET.parse(svg_path)
    root = tree.getroot()
    
    segments = []
    for elem in root.iter('{http://www.w3.org/2000/svg}path'):
        d = elem.attrib.get('d', '')
        tokens = d.replace(',', ' ').split()
        if not tokens:
            continue
        idx = 0
        current_pt = None
        while idx < len(tokens):
            cmd = tokens[idx]
            if cmd == 'M':
                current_pt = (float(tokens[idx+1]), float(tokens[idx+2]))
                idx += 3
            elif cmd == 'L':
                next_pt = (float(tokens[idx+1]), float(tokens[idx+2]))
                if current_pt is not None:
                    segments.append((current_pt, next_pt))
                current_pt = next_pt
                idx += 3
            else:
                idx += 1
    return segments

def extract_svg_wire_graph(svg_path: Path, tol: float = 1.0) -> Tuple[List[Tuple[float, float]], List[Tuple[int, int]]]:
    segments = parse_svg_paths(svg_path)
    unique_pts: List[Tuple[float, float]] = []

    def get_pid(p: Tuple[float, float]) -> int:
        for i, up in enumerate(unique_pts):
            if math.hypot(up[0] - p[0], up[1] - p[1]) <= tol:
                return i
        unique_pts.append(p)
        return len(unique_pts) - 1

    edges: Set[Tuple[int, int]] = set()
    for p1, p2 in segments:
        if math.hypot(p1[0] - p2[0], p1[1] - p2[1]) < 0.5:
            continue
        id1, id2 = get_pid(p1), get_pid(p2)
        if id1 != id2:
            edges.add(tuple(sorted((id1, id2))))

    if not unique_pts:
        return [], []

    xs = [p[0] for p in unique_pts]
    ys = [p[1] for p in unique_pts]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    span_x = max(1.0, max_x - min_x)
    span_y = max(1.0, max_y - min_y)

    norm_verts = [((x - min_x) / span_x, (y - min_y) / span_y) for (x, y) in unique_pts]
    return norm_verts, list(edges)
