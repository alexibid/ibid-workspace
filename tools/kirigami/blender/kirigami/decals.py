import math

SHAPES = ("ellipse", "almond", "lens", "triangle", "wedge", "zigzag", "dot", "bar")
RESOLUTION = 96


class DecalShapeError(ValueError):
    pass


def mask(shape: str, resolution: int = RESOLUTION) -> list[float]:
    covers = _COVERAGE.get(shape)
    if covers is None:
        raise DecalShapeError(f"Unknown decal '{shape}'. Known: {', '.join(SHAPES)}.")
    pixels: list[float] = []
    for row in range(resolution):
        v = (row + 0.5) / resolution
        for column in range(resolution):
            u = (column + 0.5) / resolution
            pixels += [1.0, 1.0, 1.0, 1.0 if covers(u, v) else 0.0]
    return pixels


def _ellipse(u: float, v: float) -> bool:
    return ((u - 0.5) / 0.5) ** 2 + ((v - 0.5) / 0.5) ** 2 <= 1.0


def _dot(u: float, v: float) -> bool:
    return (u - 0.5) ** 2 + (v - 0.5) ** 2 <= 0.28 ** 2


def _lens(u: float, v: float) -> bool:
    reach = 0.5 * math.sin(math.pi * min(max(u, 0.0), 1.0)) ** 0.7
    return abs(v - 0.5) <= reach * 0.5


def _almond(u: float, v: float) -> bool:
    reach = math.sin(math.pi * min(max(u, 0.0), 1.0))
    return 0.5 - 0.5 * reach ** 0.8 <= v <= 0.5 + 0.42 * reach ** 1.6


def _triangle(u: float, v: float) -> bool:
    half = 0.5 * (1.0 - v)
    return abs(u - 0.5) <= half


def _wedge(u: float, v: float) -> bool:
    half = 0.5 * v
    return abs(u - 0.5) <= half


def _zigzag(u: float, v: float) -> bool:
    teeth = 5
    phase = (u * teeth) % 1.0
    return v <= 1.0 - 2.0 * abs(phase - 0.5)


def _bar(u: float, v: float) -> bool:
    return 0.18 <= v <= 0.82 and 0.02 <= u <= 0.98


_COVERAGE = {
    "ellipse": _ellipse,
    "almond": _almond,
    "dot": _dot,
    "lens": _lens,
    "triangle": _triangle,
    "wedge": _wedge,
    "zigzag": _zigzag,
    "bar": _bar,
}
