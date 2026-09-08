import argparse
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))

from checks import compare, cut_summary, distributions, verify_cut
from fold_axes import fit
from marks import detect, to_json
from pieces import clean, group_pieces, is_piece
from svg_util import load_paths

MARGIN = 12
MARKS_FILE = 'marks.json'


def d_of(tag):
    return re.search(r'\sd="([^"]+)"', tag).group(1)


def carries_folds(marks):
    return len(fit(marks)) > 0


def build(paths):
    candidates = [g for g in group_pieces(paths) if is_piece(paths, g)]
    candidates.sort(key=lambda g: -sum(paths[i]['area'] for i in g))

    pieces = []
    for members in candidates:
        found = detect(paths, members)
        if not carries_folds(found):
            continue
        marked = {m['path'] for m in found}
        kept, gaps, tabs, reasons = clean(paths, members, marked, marked)
        boxes = [paths[i]['bbox'] for i in kept]
        pieces.append({
            'id': f'piece-{len(pieces) + 1}',
            'members': members, 'kept': kept, 'gaps': gaps, 'tabs': tabs,
            'reasons': reasons, 'marks': found, 'printed': marked,
            'bbox': (min(b[0] for b in boxes), min(b[1] for b in boxes),
                     max(b[2] for b in boxes), max(b[3] for b in boxes)),
        })
    return pieces


def clip_for(paths, piece):
    x0, y0, x1, y1 = piece['bbox']
    frame = f'M {x0-40:.2f} {y0-40:.2f} H {x1+40:.2f} V {y1+40:.2f} H {x0-40:.2f} Z'
    holes = ' '.join(d_of(paths[i]['tag']) for i in piece['gaps'])
    return (f'<clipPath id="clip-{piece["id"]}">'
            f'<path clip-rule="evenodd" d="{frame} {holes}"/></clipPath>')


def art_for(paths, piece):
    art = '\n      '.join(paths[i]['tag'] for i in piece['kept'])
    return (f'  <g id="{piece["id"]}" clip-path="url(#clip-{piece["id"]})">\n'
            f'      {art}\n  </g>')


def wrap(view_box, body):
    x0, y0, x1, y1 = view_box
    return (f'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="{x0:.2f} {y0:.2f} {x1-x0:.2f} {y1-y0:.2f}" '
            f'width="{x1-x0:.0f}" height="{y1-y0:.0f}">\n'
            + body + '\n</svg>\n')


def emit(paths, pieces, defs, outdir, combined):
    outdir = pathlib.Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    written = []

    for piece in pieces:
        x0, y0, x1, y1 = piece['bbox']
        needs_defs = any('url(#' in paths[i]['tag'] for i in piece['kept'])
        body = (f'  <defs>\n    {defs if needs_defs else ""}\n'
                f'    {clip_for(paths, piece)}\n  </defs>\n' + art_for(paths, piece))
        name = f'{piece["id"]}.svg'
        (outdir / name).write_text(
            wrap((x0 - MARGIN, y0 - MARGIN, x1 + MARGIN, y1 + MARGIN), body))
        written.append(name)

    view_box = (min(p['bbox'][0] for p in pieces) - MARGIN,
                min(p['bbox'][1] for p in pieces) - MARGIN,
                max(p['bbox'][2] for p in pieces) + MARGIN,
                max(p['bbox'][3] for p in pieces) + MARGIN)
    body = ('  <defs>\n    ' + defs + '\n    '
            + '\n    '.join(clip_for(paths, p) for p in pieces) + '\n  </defs>\n'
            + '\n'.join(art_for(paths, p) for p in pieces))
    (outdir / combined).write_text(wrap(view_box, body))
    written.append(combined)
    return written


def write_marks(pieces, outdir, source, combined):
    payload = {
        'source': str(source),
        'combined': combined,
        'pieces': [{
            'id': p['id'],
            'file': f'{p["id"]}.svg',
            'bbox': [round(v, 3) for v in p['bbox']],
            'marks': [to_json(m) for m in p['marks']],
        } for p in pieces],
    }
    path = pathlib.Path(outdir) / MARKS_FILE
    path.write_text(json.dumps(payload, indent=2) + '\n')
    return path


def main():
    parser = argparse.ArgumentParser(
        prog='cut', description='Clean a commercial cut sheet and emit one SVG per piece.')
    parser.add_argument('source')
    parser.add_argument('outdir')
    parser.add_argument('--combined', default='all-pieces.svg')
    parser.add_argument('--stats', action='store_true')
    parser.add_argument('--expect')
    parser.add_argument('--write-expected')
    args = parser.parse_args()

    svg, paths = load_paths(args.source)
    match = re.search(r'<defs>.*?</defs>', svg, re.S)
    defs = match.group(0) if match else ''

    pieces = build(paths)
    if not pieces:
        print('FAIL  no piece found', file=sys.stderr)
        return 1

    failures = [f for piece in pieces for f in verify_cut(paths, piece)]
    report = [cut_summary(paths, piece) for piece in pieces]

    print(f'{args.source}: {len(paths)} paths -> {len(pieces)} pieces')
    for entry in report:
        rules = '  '.join(f'{k}={v}' for k, v in entry['removedByRule'].items())
        print(f"  {entry['id']}: kept {entry['kept']}, removed {entry['removed']} ({rules})")
        print(f"      marks {entry['marks']}, gaps {entry['gaps']}, tabs {entry['tabs']}")

    if args.stats:
        print('\n  white shapes above the sheet floor, by role:')
        for piece in pieces:
            for role, rows in sorted(distributions(paths, piece).items()):
                shown = ', '.join(f'#{i} area={a} pts={p}' for i, a, p in rows)
                print(f"    {piece['id']} {role}: {shown}")

    if args.write_expected:
        pathlib.Path(args.write_expected).write_text(json.dumps(report, indent=2) + '\n')
        print(f'\n  expected snapshot written to {args.write_expected}')

    drift = compare(report, json.loads(pathlib.Path(args.expect).read_text())) if args.expect else []

    for line in failures:
        print(f'  FAIL  {line}', file=sys.stderr)
    for line in drift:
        print(f'  DRIFT {line}', file=sys.stderr)
    if failures or drift:
        print(f'\n{len(failures)} assertion(s) failed, {len(drift)} drift(s)', file=sys.stderr)
        return 1

    written = emit(paths, pieces, defs, args.outdir, args.combined)
    marks_path = write_marks(pieces, args.outdir, args.source, args.combined)
    print('\n  ' + '\n  '.join(f'-> {name}' for name in written))
    print(f'  -> {marks_path.name}  ({sum(len(p["marks"]) for p in pieces)} fold marks recorded)')
    print('  cut checks passed')
    return 0


if __name__ == '__main__':
    sys.exit(main())
