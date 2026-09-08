import numpy


def mask_of(pixels: numpy.ndarray, threshold: float = 0.02) -> numpy.ndarray:
    return pixels[:, :, 3] > threshold


def blobs(mask: numpy.ndarray, floor: float = 0.004) -> int:
    total = int(mask.sum())
    if total == 0:
        return 0
    return sum(1 for size in _components(mask) if size / total >= floor)


def solidity(mask: numpy.ndarray) -> float:
    points = numpy.argwhere(mask)
    if len(points) < 3:
        return 0.0
    hull = _hull([(int(x), int(y)) for y, x in points])
    area = _polygon_area(hull)
    return float(len(points) / area) if area > 0 else 0.0


def _components(mask: numpy.ndarray) -> list[int]:
    seen = numpy.zeros_like(mask, dtype=bool)
    height, width = mask.shape
    sizes = []
    for seed in numpy.argwhere(mask):
        origin = tuple(seed)
        if seen[origin]:
            continue
        seen[origin] = True
        stack = [origin]
        count = 0
        while stack:
            row, column = stack.pop()
            count += 1
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                r, c = row + dr, column + dc
                if 0 <= r < height and 0 <= c < width and mask[r, c] and not seen[r, c]:
                    seen[r, c] = True
                    stack.append((r, c))
        sizes.append(count)
    return sizes


def _hull(points: list[tuple[int, int]]) -> list[tuple[int, int]]:
    points = sorted(set(points))
    if len(points) <= 2:
        return points

    def build(sequence):
        stack = []
        for point in sequence:
            while len(stack) >= 2 and _cross(stack[-2], stack[-1], point) <= 0:
                stack.pop()
            stack.append(point)
        return stack[:-1]

    return build(points) + build(reversed(points))


def _cross(origin, first, second) -> int:
    return ((first[0] - origin[0]) * (second[1] - origin[1])
            - (first[1] - origin[1]) * (second[0] - origin[0]))


def _polygon_area(hull: list[tuple[int, int]]) -> float:
    if len(hull) < 3:
        return 0.0
    total = 0
    for index, point in enumerate(hull):
        following = hull[(index + 1) % len(hull)]
        total += point[0] * following[1] - following[0] * point[1]
    return abs(total) / 2.0
