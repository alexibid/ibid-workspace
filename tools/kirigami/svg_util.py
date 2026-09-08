import re, json, sys, pathlib, math
from collections import defaultdict

NUM = re.compile(r'[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?')
ARGC = {'M':2,'L':2,'T':2,'H':1,'V':1,'C':6,'S':4,'Q':4,'A':7,'Z':0}

def path_points(d):
    tokens = re.findall(r'([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)', d)
    cmds, cur = [], None
    buf = []
    for letter, num in tokens:
        if letter:
            if cur: cmds.append((cur, buf))
            cur, buf = letter, []
        elif cur:
            buf.append(float(num))
    if cur: cmds.append((cur, buf))

    pts, x, y, sx, sy = [], 0.0, 0.0, 0.0, 0.0
    for letter, args in cmds:
        up = letter.upper(); rel = letter.islower(); n = ARGC[up]
        if up == 'Z':
            x, y = sx, sy; pts.append((x, y)); continue
        if n == 0 or not args: continue
        i = 0
        first = True
        while i + n <= len(args):
            a = args[i:i+n]; i += n
            if up == 'H':
                x = x + a[0] if rel else a[0]
            elif up == 'V':
                y = y + a[0] if rel else a[0]
            elif up == 'A':
                nx, ny = a[5], a[6]
                x, y = (x + nx, y + ny) if rel else (nx, ny)
            else:
                for k in range(0, n, 2):
                    px, py = a[k], a[k+1]
                    px, py = (x + px, y + py) if rel else (px, py)
                    if k + 2 < n: pts.append((px, py))
                x, y = (x + a[n-2], y + a[n-1]) if rel else (a[n-2], a[n-1])
            pts.append((x, y))
            if up == 'M':
                if first: sx, sy = x, y
                up = 'L'; n = 2
            first = False
    return pts


def bbox(pts):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return (min(xs), min(ys), max(xs), max(ys))

def load_paths(path):
    svg = pathlib.Path(path).read_text()
    out = []
    for tag in re.findall(r'<path\b[^>]*/>', svg):
        d = re.search(r'\sd="([^"]+)"', tag)
        if not d: continue
        pts = path_points(d.group(1))
        if not pts: continue
        b = bbox(pts)
        out.append({'tag': tag, 'pts': pts, 'bbox': b,
                    'area': (b[2]-b[0])*(b[3]-b[1]),
                    'fill': (re.search(r'fill="([^"]+)"', tag) or [None,'none'])[1]})
    return svg, out
