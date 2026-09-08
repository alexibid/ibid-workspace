import math
from collections import defaultdict

from palette import is_dark, is_ink, is_white

PIECE_MIN_AREA = 50000.0

TAB_MAX_POINTS = 25
SHEET_MIN_AREA = 5000.0
MARK_MAX_AREA = 900.0
GAP_POINT_RATIO = 0.30
CALLOUT_RADIUS = (22.0, 90.0)
CALLOUT_ROUNDNESS = 1.55


class DisjointSet:
    def __init__(self, size):
        self.parent = list(range(size))

    def find(self, node):
        while self.parent[node] != node:
            self.parent[node] = self.parent[self.parent[node]]
            node = self.parent[node]
        return node

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.parent[rb] = ra


def in_poly(point, polygon):
    x, y = point
    inside = False
    j = len(polygon) - 1
    for i in range(len(polygon)):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        if (yi > y) != (yj > y):
            if x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi:
                inside = not inside
        j = i
    return inside


def centroid(points):
    return (sum(p[0] for p in points) / len(points),
            sum(p[1] for p in points) / len(points))


def iou(a, b):
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    union = (a[2]-a[0]) * (a[3]-a[1]) + (b[2]-b[0]) * (b[3]-b[1]) - inter
    return inter / union if union > 0 else 0.0


def is_circle(points, radius=CALLOUT_RADIUS, roundness=CALLOUT_ROUNDNESS):
    cx, cy = centroid(points)
    distances = [math.hypot(x - cx, y - cy) for x, y in points]
    lo, hi = min(distances), max(distances)
    if lo <= 1e-6:
        return False
    return radius[0] <= (lo + hi) / 2 <= radius[1] and hi / lo <= roundness


def touches(points, pool, gap):
    cells = {(int(x // gap), int(y // gap)) for x, y in pool}
    for x, y in points:
        cx, cy = int(x // gap), int(y // gap)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                if (cx + dx, cy + dy) in cells:
                    return True
    return False


def group_pieces(paths, gap=6.0, passes=6):
    total = len(paths)
    sets = DisjointSet(total)
    grid = defaultdict(set)
    for index, path in enumerate(paths):
        for x, y in path['pts']:
            grid[(int(x // gap), int(y // gap))].add(index)

    for (cx, cy), owners in grid.items():
        near = set(owners)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                near |= grid.get((cx + dx, cy + dy), set())
        ordered = sorted(near)
        for other in ordered[1:]:
            sets.union(ordered[0], other)

    for _ in range(passes):
        clusters = defaultdict(list)
        for index in range(total):
            clusters[sets.find(index)].append(index)
        ranked = sorted(clusters.items(),
                        key=lambda kv: -max(paths[i]['area'] for i in kv[1]))
        hulls = []
        for root, members in ranked:
            biggest = max(members, key=lambda i: paths[i]['area'])
            hulls.append((root, paths[biggest]['pts'], paths[biggest]['bbox']))

        merged = False
        for k in range(len(hulls) - 1, 0, -1):
            root = hulls[k][0]
            spot = centroid([pt for i in clusters[root] for pt in paths[i]['pts']])
            for host, polygon, box in hulls[:k]:
                inside_box = box[0] <= spot[0] <= box[2] and box[1] <= spot[1] <= box[3]
                if inside_box and in_poly(spot, polygon):
                    sets.union(host, root)
                    merged = True
                    break
        if not merged:
            break

    grouped = defaultdict(list)
    for index in range(total):
        grouped[sets.find(index)].append(index)
    return list(grouped.values())


def is_piece(paths, members):
    return any(not is_ink(paths[i]['fill']) and paths[i]['area'] > PIECE_MIN_AREA
               for i in members)


def classify_whites(paths, members):
    whites = [i for i in members if is_white(paths[i]['fill'])]
    sheets = [i for i in whites if paths[i]['area'] >= SHEET_MIN_AREA]
    gaps = [i for i in sheets if len(paths[i]['pts']) > TAB_MAX_POINTS]
    tabs = [i for i in sheets if len(paths[i]['pts']) <= TAB_MAX_POINTS]
    return gaps, tabs


def clean(paths, members, protected, printed=None):
    boxes = [paths[i]['bbox'] for i in members]
    width = max(b[2] for b in boxes) - min(b[0] for b in boxes)
    height = max(b[3] for b in boxes) - min(b[1] for b in boxes)
    group_area = max(width * height, 1e-9)

    gaps, tabs = classify_whites(paths, members)
    evidence = protected if printed is None else printed
    papered = [i for i in gaps
               if any(in_poly(centroid(paths[j]['pts']), paths[i]['pts'])
                      for j in evidence)]
    gaps = [i for i in gaps if i not in papered]
    tabs = tabs + papered
    bubbles = [i for i in members
               if i not in protected and i not in gaps and i not in tabs
               and len(paths[i]['pts']) >= 8 and is_circle(paths[i]['pts'])]

    reasons = {}
    for i in gaps:
        reasons[i] = 'page-gap'
    for i in bubbles:
        reasons[i] = 'callout-bubble'

    def drop(index, rule):
        if index not in reasons:
            reasons[index] = rule

    annotation = gaps + bubbles
    for i in members:
        if i in reasons or i in protected:
            continue
        if any(iou(paths[i]['bbox'], paths[j]['bbox']) >= 0.80 for j in annotation):
            drop(i, 'annotation-companion')

    for j in bubbles:
        spot = centroid(paths[j]['pts'])
        for i in members:
            if i in reasons or i in protected:
                continue
            if not is_dark(paths[i]['fill']):
                continue
            if paths[i]['area'] > group_area * 0.15:
                continue
            if in_poly(spot, paths[i]['pts']):
                drop(i, 'bubble-ring')

    page = [paths[j]['pts'] for j in gaps]
    for i in members:
        if i in reasons or i in protected:
            continue
        points = paths[i]['pts']
        if any(in_poly(centroid(points), polygon) for polygon in page):
            drop(i, 'inside-page-gap')
            continue
        if paths[i]['area'] > 3000 or not page:
            continue
        overlap = max(sum(1 for q in points if in_poly(q, polygon)) for polygon in page)
        if overlap / len(points) >= GAP_POINT_RATIO:
            drop(i, 'straddles-page-gap')

    bubble_polys = [paths[j]['pts'] for j in bubbles]
    for i in members:
        if i in reasons or i in protected or paths[i]['area'] > MARK_MAX_AREA:
            continue
        if any(in_poly(centroid(paths[i]['pts']), polygon) for polygon in bubble_polys):
            drop(i, 'inside-bubble')

    frontier = set(bubbles)
    visited = set(frontier)
    while frontier:
        pool = [pt for j in frontier for pt in paths[j]['pts']]
        frontier = set()
        for i in members:
            if i in reasons or i in protected or i in visited:
                continue
            if not is_dark(paths[i]['fill']):
                continue
            if paths[i]['area'] > group_area * 0.02:
                continue
            if touches(paths[i]['pts'], pool, 9.0):
                drop(i, 'leader-chain')
                visited.add(i)
                frontier.add(i)

    tab_polys = [paths[j]['pts'] for j in tabs]
    for i in members:
        if i in reasons or i in protected or paths[i]['area'] > MARK_MAX_AREA:
            continue
        if not is_dark(paths[i]['fill']):
            continue
        if any(in_poly(centroid(paths[i]['pts']), polygon) for polygon in tab_polys):
            drop(i, 'digit-on-tab')

    outermost = []
    for i in sorted(gaps, key=lambda j: -paths[j]['area']):
        spot = centroid(paths[i]['pts'])
        if any(in_poly(spot, paths[j]['pts']) for j in outermost):
            continue
        outermost.append(i)

    kept = [i for i in members if i not in reasons]
    return kept, outermost, tabs, reasons
