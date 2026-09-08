from collections import Counter, defaultdict

from palette import is_white
from pieces import (GAP_POINT_RATIO, SHEET_MIN_AREA, TAB_MAX_POINTS,
                    centroid, in_poly, is_circle)


def verify_cut(paths, piece):
    failures = []
    kept = piece['kept']
    total = len(piece['members'])

    if len(kept) + len(piece['reasons']) != total:
        failures.append(
            f"{piece['id']}: kept {len(kept)} + removed {len(piece['reasons'])} "
            f"!= {total} paths in group")

    for i in kept:
        path = paths[i]
        if not is_white(path['fill']) or path['area'] < SHEET_MIN_AREA:
            continue
        if len(path['pts']) <= TAB_MAX_POINTS:
            continue
        carries_fold = any(in_poly(centroid(paths[j]['pts']), path['pts'])
                           for j in piece['printed'])
        if not carries_fold:
            failures.append(
                f"{piece['id']}: path #{i} kept as piece paper but has {len(path['pts'])} "
                f"points (> {TAB_MAX_POINTS}) and carries no printed fold — it is a page gap")

    for i in kept:
        path = paths[i]
        if len(path['pts']) >= 8 and is_circle(path['pts']):
            failures.append(f"{piece['id']}: path #{i} kept and is callout-shaped")

    page = [paths[j]['pts'] for j in piece['gaps']]
    for i in kept:
        points = paths[i]['pts']
        if not page or paths[i]['area'] > 3000 or i in piece['printed']:
            continue
        overlap = max(sum(1 for q in points if in_poly(q, polygon)) for polygon in page)
        if overlap / len(points) >= GAP_POINT_RATIO:
            failures.append(
                f"{piece['id']}: path #{i} kept with "
                f"{overlap / len(points):.0%} of its points inside a page gap")

    return failures


def verify_folds(result):
    failures = []
    for order, axis in enumerate(result['axes'], 1):
        if axis['dashes'] < 3:
            failures.append(
                f"{result['id']}: axis {order} built from only {axis['dashes']} marks")
    if not result['axes']:
        failures.append(f"{result['id']}: no fold axis recovered from {result['marks']} marks")
    return failures


def cut_summary(paths, piece):
    tally = Counter(piece['reasons'].values())
    return {
        'id': piece['id'],
        'kept': len(piece['kept']),
        'removed': len(piece['reasons']),
        'removedByRule': dict(sorted(tally.items())),
        'marks': len(piece['marks']),
        'gaps': len(piece['gaps']),
        'tabs': len(piece['tabs']),
    }


def fold_summary(result):
    used = sum(a['dashes'] for a in result['axes'])
    return {
        'id': result['id'],
        'axes': len(result['axes']),
        'longestAxis': round(max((a['length'] for a in result['axes']), default=0.0), 1),
        'axisMarks': [a['dashes'] for a in result['axes']],
        'unassigned': result['marks'] - used,
    }


def distributions(paths, piece):
    roles = {}
    for i in piece['gaps']:
        roles[i] = 'page-gap'
    for i in piece['tabs']:
        roles[i] = 'piece-paper'
    buckets = defaultdict(list)
    for i in piece['members']:
        path = paths[i]
        if is_white(path['fill']) and path['area'] >= SHEET_MIN_AREA:
            buckets[roles.get(i, 'unclassified')].append(
                (i, round(path['area']), len(path['pts'])))
    return dict(buckets)


def compare(actual, expected):
    drift = []
    for got, want in zip(actual, expected):
        for field, value in want.items():
            if got.get(field) != value:
                drift.append(f"{got.get('id')}.{field}: {value} -> {got.get(field)}")
    if len(actual) != len(expected):
        drift.append(f"piece count: {len(expected)} -> {len(actual)}")
    return drift
