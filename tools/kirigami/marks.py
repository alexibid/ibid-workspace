import math

from palette import is_dark

MAX_WIDTH = 9.0
MIN_LENGTH = 5.0
MAX_LENGTH = 60.0
MIN_RATIO = 1.6
MAX_POINTS = 16


def pca_dir(points):
    count = len(points)
    cx = sum(p[0] for p in points) / count
    cy = sum(p[1] for p in points) / count
    sxx = syy = sxy = 0.0
    for x, y in points:
        dx, dy = x - cx, y - cy
        sxx += dx * dx
        syy += dy * dy
        sxy += dx * dy
    theta = 0.5 * math.atan2(2 * sxy, sxx - syy)
    return (cx, cy), (math.cos(theta), math.sin(theta))


def extents(points, centre, direction):
    normal = (-direction[1], direction[0])
    along = [(x - centre[0]) * direction[0] + (y - centre[1]) * direction[1] for x, y in points]
    across = [(x - centre[0]) * normal[0] + (y - centre[1]) * normal[1] for x, y in points]
    return max(along) - min(along), max(across) - min(across)


def is_mark(path):
    if len(path['pts']) > MAX_POINTS or not is_dark(path['fill']):
        return None
    centre, direction = pca_dir(path['pts'])
    length, width = extents(path['pts'], centre, direction)
    if width > MAX_WIDTH or not (MIN_LENGTH <= length <= MAX_LENGTH):
        return None
    if length / max(width, 1e-9) < MIN_RATIO:
        return None
    return {'c': centre, 'd': direction, 'len': length, 'width': width}


def detect(paths, members):
    found = []
    for index in members:
        mark = is_mark(paths[index])
        if mark:
            found.append({'path': index, **mark})
    return found


def to_json(mark):
    return {
        'path': mark['path'],
        'x': round(mark['c'][0], 3), 'y': round(mark['c'][1], 3),
        'dx': round(mark['d'][0], 6), 'dy': round(mark['d'][1], 6),
        'length': round(mark['len'], 3), 'width': round(mark['width'], 3),
    }


def from_json(entry):
    return {
        'path': entry['path'],
        'c': (entry['x'], entry['y']),
        'd': (entry['dx'], entry['dy']),
        'len': entry['length'],
        'width': entry['width'],
    }
