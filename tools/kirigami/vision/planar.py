import numpy as np
from shapely.geometry import LineString, MultiLineString, Polygon
from shapely.ops import polygonize, unary_union

STRAIGHTEN_SHARE = 0.004
SMALLEST_FACE = 2500.0


def faces(rings: list[np.ndarray], span: float) -> list[Polygon]:
    straight = _straighten(rings, STRAIGHTEN_SHARE * span)
    if not straight:
        return []
    noded = unary_union(MultiLineString(straight))
    built = [shape for shape in polygonize(noded) if shape.area >= SMALLEST_FACE]
    return sorted(built, key=lambda shape: -shape.area)


def survey(built: list[Polygon], area: float) -> dict:
    if not built:
        return {"faces": 0, "corners": 0, "covered": 0.0}
    return {
        "faces": len(built),
        "corners": sum(len(shape.exterior.coords) - 1 for shape in built),
        "covered": round(float(unary_union(built).area) / max(area, 1.0), 4),
    }


def _straighten(rings: list[np.ndarray], tolerance: float) -> list[LineString]:
    straight = []
    for ring in rings:
        if len(ring) < 3:
            continue
        line = LineString([*[tuple(point) for point in ring], tuple(ring[0])])
        simple = line.simplify(tolerance, preserve_topology=False)
        if simple.length > 0:
            straight.append(simple)
    return straight
