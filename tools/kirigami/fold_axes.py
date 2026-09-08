import math

from marks import pca_dir


class DSU:
    def __init__(s, n): s.p = list(range(n))
    def find(s, a):
        while s.p[a] != a: s.p[a] = s.p[s.p[a]]; a = s.p[a]
        return a
    def union(s, a, b):
        ra, rb = s.find(a), s.find(b)
        if ra != rb: s.p[rb] = ra

def fit(dashes, ang_tol_deg=8.0, perp_tol=5.0, gap_tol=140.0):
    n = len(dashes); dsu = DSU(n)
    ct = math.cos(math.radians(ang_tol_deg))
    for a in range(n):
        ca, da = dashes[a]['c'], dashes[a]['d']
        for b in range(a+1, n):
            cb, db = dashes[b]['c'], dashes[b]['d']
            if abs(da[0]*db[0] + da[1]*db[1]) < ct:
                continue
            vx, vy = cb[0]-ca[0], cb[1]-ca[1]
            perp = abs(-da[1]*vx + da[0]*vy)
            along = abs(da[0]*vx + da[1]*vy)
            if perp <= perp_tol and along <= gap_tol:
                dsu.union(a, b)
    groups = {}
    for k in range(n): groups.setdefault(dsu.find(k), []).append(k)

    result = []
    for members in groups.values():
        if len(members) < 3: continue
        pts = [dashes[k]['c'] for k in members]
        c, d = pca_dir(pts)
        ts = [ (p[0]-c[0])*d[0] + (p[1]-c[1])*d[1] for p in pts ]
        t0, t1 = min(ts), max(ts)
        half = dashes[members[0]]['len'] / 2
        p0 = (c[0] + d[0]*(t0-half), c[1] + d[1]*(t0-half))
        p1 = (c[0] + d[0]*(t1+half), c[1] + d[1]*(t1+half))
        result.append({'dashes': len(members), 'from': p0, 'to': p1,
                       'length': math.dist(p0, p1),
                       'angle': round(math.degrees(math.atan2(d[1], d[0])) % 180, 1),
                       'members': members})
    result = merge_collinear(result)
    result.sort(key=lambda a: -a['length'])
    return result


def merge_collinear(axs, ang_tol=3.0, perp_tol=6.0):
    changed = True
    while changed:
        changed = False
        for a in range(len(axs)):
            for b in range(a + 1, len(axs)):
                A, B = axs[a], axs[b]
                da = abs(A['angle'] - B['angle']) % 180
                if min(da, 180 - da) > ang_tol:
                    continue
                ax0, ay0 = A['from']; ax1, ay1 = A['to']
                ux, uy = ax1 - ax0, ay1 - ay0
                n = math.hypot(ux, uy) or 1e-9
                ux, uy = ux / n, uy / n
                off = max(abs(-uy * (p[0] - ax0) + ux * (p[1] - ay0))
                          for p in (B['from'], B['to']))
                if off > perp_tol:
                    continue
                pts = [A['from'], A['to'], B['from'], B['to']]
                ts = [ (p[0] - ax0) * ux + (p[1] - ay0) * uy for p in pts ]
                lo, hi = min(ts), max(ts)
                A['from'] = (ax0 + ux * lo, ay0 + uy * lo)
                A['to'] = (ax0 + ux * hi, ay0 + uy * hi)
                A['length'] = math.dist(A['from'], A['to'])
                A['dashes'] += B['dashes']
                A['members'] = A['members'] + B['members']
                axs.pop(b)
                changed = True
                break
            if changed:
                break
    return axs
