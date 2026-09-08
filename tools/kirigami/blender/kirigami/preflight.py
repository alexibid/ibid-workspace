import bpy
from mathutils import Vector

from .proportions import bands, group_of, verdict
from .shapes import MM

REFUSE_MM = 0.6
WARN_MM = 2.5
STAND_MARGIN = 0.15
OVERLAP_FLOOR_MM = 2.0
OVERLAP_SHARE = 0.15
SINK_SHARE = 0.20


class PreflightRefusal(RuntimeError):
    def __init__(self, complaints: list[str]) -> None:
        super().__init__("\n".join(complaints))
        self.complaints = complaints


def survey(solids: list[bpy.types.Object]) -> dict:
    boxes = {solid.name: _box(solid) for solid in solids}
    return {
        "solids": {name: _describe(box) for name, box in boxes.items()},
        "grazing": _grazing(boxes),
        "crossing": _crossing(boxes),
        "shallow": _shallow(boxes),
        "islands": _islands(boxes, 0.0),
        "solidIslands": _islands(boxes, None),
        "stance": _stance(boxes),
    }


def refuse_if_broken(name: str, solids: list[bpy.types.Object], mirrored: bool) -> dict:
    report = survey(solids)
    complaints = []

    for island in report["islands"][1:]:
        complaints.append(
            f"'{name}': {', '.join(island)} overlap nothing else in the chain and would print "
            f"as a loose shell. Push them into a neighbour."
        )
    if mirrored:
        for solid, depth in report["crossing"].items():
            complaints.append(
                f"'{name}': solid '{solid}' crosses the mirror plane by only {depth:.1f} mm. "
                f"The bisect leaves a sliver there. Pull it clear of zero, or push it across "
                f"by more than {REFUSE_MM * 4:.0f} mm."
            )
        for solid, edge in report["grazing"].items():
            if abs(edge) < REFUSE_MM:
                complaints.append(
                    f"'{name}': solid '{solid}' stops {abs(edge):.1f} mm short of the mirror "
                    f"plane. Move it clear of zero or make it straddle decisively."
                )
    if len(report["solidIslands"]) > len(report["islands"]):
        for pair, depth in report["shallow"].items():
            left, right = pair.split(" + ")
            complaints.append(
                f"'{name}': '{left}' and '{right}' hold the chain together on only "
                f"{depth['depthMm']:.1f} mm of overlap, under the {depth['needMm']:.1f} mm "
                f"this pair needs. The boolean will graze rather than cut."
            )
    if complaints:
        raise PreflightRefusal(complaints)
    return report


def measure(solids: list[bpy.types.Object], family: str) -> dict:
    boxes = {solid.name: _box(solid) for solid in solids}
    spans = _spans(boxes)
    whole = _union(list(boxes.values()))
    total_height = (whole[1].z - whole[0].z) / MM
    body_length = spans.get("body", (0.0, 0.0, 0.0))[0] or total_height

    ratios = {
        "head height / total height": _ratio(spans, "head", 2, total_height),
        "head length / body length": _ratio(spans, "head", 0, body_length),
        "muzzle length / head length": _ratio(spans, "muzzle", 0, spans.get("head", (0,))[0]),
        "ear height / head height": _ratio(spans, "ear", 2, spans.get("head", (0, 0, 0))[2]),
        "leg height / total height": _ratio(spans, "leg", 2, total_height),
        "tail length / body length": _ratio(spans, "tail", 0, body_length),
        "body depth / body length": _ratio(spans, "body", 1, body_length),
        "body width / total height": _ratio(spans, "body", 1, total_height),
        "trunk height / total height": _ratio(spans, "body", 2, total_height),
    }

    wanted = bands(family)
    return {
        "family": family,
        "totalHeightMm": round(total_height, 1),
        "ratios": [
            {
                "name": label,
                "value": round(ratios[label], 3),
                "band": list(band),
                "verdict": verdict(ratios[label], band),
            }
            for label, band in wanted.items()
            if ratios.get(label)
        ],
    }


def _ratio(spans: dict, group: str, axis: int, against: float) -> float:
    if group not in spans or not against:
        return 0.0
    return spans[group][axis] / against


def _spans(boxes: dict) -> dict[str, tuple[float, float, float]]:
    grouped: dict[str, list] = {}
    for name, box in boxes.items():
        group = group_of(name)
        if group:
            grouped.setdefault(group, []).append(box)
    return {
        group: tuple((_union(members)[1][axis] - _union(members)[0][axis]) / MM for axis in range(3))
        for group, members in grouped.items()
    }


def _box(solid: bpy.types.Object) -> tuple[Vector, Vector]:
    corners = [solid.matrix_world @ Vector(corner) for corner in solid.bound_box]
    return (Vector(min(c[axis] for c in corners) for axis in range(3)),
            Vector(max(c[axis] for c in corners) for axis in range(3)))


def _union(boxes: list) -> tuple[Vector, Vector]:
    return (Vector(min(box[0][axis] for box in boxes) for axis in range(3)),
            Vector(max(box[1][axis] for box in boxes) for axis in range(3)))


def _describe(box: tuple[Vector, Vector]) -> dict:
    low, high = box
    return {
        "sizeMm": [round((high[axis] - low[axis]) / MM, 1) for axis in range(3)],
        "yFromMm": round(low.y / MM, 1),
        "yToMm": round(high.y / MM, 1),
        "zFromMm": round(low.z / MM, 1),
        "zToMm": round(high.z / MM, 1),
    }


def _crossing(boxes: dict) -> dict[str, float]:
    caught = {}
    for name, (low, high) in boxes.items():
        if low.y < 0 < high.y:
            depth = min(abs(low.y), abs(high.y)) / MM
            if depth < REFUSE_MM * 4:
                caught[name] = round(depth, 2)
    return caught


def _shallow(boxes: dict) -> dict[str, dict]:
    caught = {}
    names = list(boxes)
    for index, left in enumerate(names):
        for right in names[index + 1:]:
            depth = _depth(boxes[left], boxes[right])
            if depth <= 0:
                continue
            need = _needed(boxes[left], boxes[right])
            if depth < need:
                caught[f"{left} + {right}"] = {"depthMm": round(depth, 2),
                                                "needMm": round(need, 2)}
    return caught


def _depth(left: tuple[Vector, Vector], right: tuple[Vector, Vector]) -> float:
    reach = [min(left[1][axis], right[1][axis]) - max(left[0][axis], right[0][axis])
             for axis in range(3)]
    return min(reach) / MM if min(reach) > 0 else 0.0


def _needed(left: tuple[Vector, Vector], right: tuple[Vector, Vector]) -> float:
    thinnest = min(min(box[1][axis] - box[0][axis] for axis in range(3)) / MM
                   for box in (left, right))
    return max(OVERLAP_FLOOR_MM, OVERLAP_SHARE * thinnest)


def _grazing(boxes: dict) -> dict[str, float]:
    caught = {}
    for name, (low, high) in boxes.items():
        inner = min(abs(low.y), abs(high.y)) / MM
        if low.y * high.y > 0 and inner < WARN_MM:
            caught[name] = round(min(low.y, high.y) / MM, 1)
    return caught


def _islands(boxes: dict, floor: float | None) -> list[list[str]]:
    unseen = set(boxes)
    found = []
    while unseen:
        stack = [unseen.pop()]
        island = []
        while stack:
            current = stack.pop()
            island.append(current)
            for other in list(unseen):
                if _joined(boxes[current], boxes[other], floor):
                    unseen.discard(other)
                    stack.append(other)
        found.append(sorted(island))
    return sorted(found, key=len, reverse=True)


def _joined(left: tuple[Vector, Vector], right: tuple[Vector, Vector],
            floor: float | None) -> bool:
    depth = _depth(left, right)
    if depth <= 0:
        return False
    return depth > (floor if floor is not None else _needed(left, right))


def _stance(boxes: dict) -> dict:
    whole = _union(list(boxes.values()))
    height = (whole[1].z - whole[0].z) / MM
    floor = whole[0].z + 0.02 * (whole[1].z - whole[0].z)
    standing = [box for box in boxes.values() if box[0].z <= floor]
    if not standing or height <= 0:
        return {"heightMm": round(height, 1), "footprintMm2": 0.0, "tippingMargin": 0.0}

    ground = _union(standing)
    weight = sum((b[1].x - b[0].x) * (b[1].y - b[0].y) * (b[1].z - b[0].z) for b in boxes.values())
    centre = sum(
        ((b[0] + b[1]) * 0.5 * ((b[1].x - b[0].x) * (b[1].y - b[0].y) * (b[1].z - b[0].z))
         for b in boxes.values()), Vector()) / max(weight, 1e-12)
    reach = min(centre.x - ground[0].x, ground[1].x - centre.x,
                centre.y - ground[0].y, ground[1].y - centre.y)
    return {
        "heightMm": round(height, 1),
        "footprintMm2": round((ground[1].x - ground[0].x) * (ground[1].y - ground[0].y) / (MM * MM), 0),
        "centreOfMassMm": [round(centre[axis] / MM, 1) for axis in range(3)],
        "tippingMargin": round(reach / max(whole[1].z - whole[0].z, 1e-12), 3),
        "stands": reach / max(whole[1].z - whole[0].z, 1e-12) >= STAND_MARGIN,
    }
