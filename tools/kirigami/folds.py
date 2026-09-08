import argparse
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))

from checks import compare, fold_summary, verify_folds
from fold_axes import fit
from marks import from_json

MARKS_FILE = 'marks.json'
FOLDS_FILE = 'folds.json'
STYLE = ('  <style>.fold-axes{fill:none;stroke:#1B3A6B;stroke-width:3;'
         'stroke-dasharray:14 10;stroke-linecap:round;opacity:.85}</style>')


def axes_of(entry):
    marks = [from_json(m) for m in entry['marks']]
    return fit(marks)


def group_for(piece_id, axes):
    lines = []
    for order, axis in enumerate(axes, 1):
        (fx, fy), (tx, ty) = axis['from'], axis['to']
        lines.append(
            f'    <line class="fold-axis" id="{piece_id}-fold-{order}" '
            f'x1="{fx:.2f}" y1="{fy:.2f}" x2="{tx:.2f}" y2="{ty:.2f}" '
            f'data-length="{axis["length"]:.1f}" data-angle="{axis["angle"]:.1f}" '
            f'data-marks="{axis["dashes"]}"/>')
    return f'  <g id="{piece_id}-folds" class="fold-axes">\n' + '\n'.join(lines) + '\n  </g>'


def inject(path, blocks):
    svg = path.read_text()
    svg = strip(svg)
    head_end = svg.index('>', svg.index('<svg')) + 1
    body = '\n'.join(blocks)
    return svg[:head_end] + '\n' + STYLE + svg[head_end:].replace(
        '</svg>', body + '\n</svg>')


def strip(svg):
    while '<g id="' in svg and '-folds"' in svg:
        start = svg.index('<g id="', svg.index('-folds"') - 200)
        end = svg.index('</g>', start) + len('</g>') + 1
        svg = svg[:start].rstrip() + '\n' + svg[end:]
    lines = [line for line in svg.splitlines() if '.fold-axes{' not in line]
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(
        prog='folds', description='Fit fold axes from recorded marks and draw them into the pieces.')
    parser.add_argument('outdir')
    parser.add_argument('--expect')
    parser.add_argument('--write-expected')
    args = parser.parse_args()

    outdir = pathlib.Path(args.outdir)
    marks_path = outdir / MARKS_FILE
    if not marks_path.exists():
        print(f'FAIL  {marks_path} not found — run cut.py first', file=sys.stderr)
        return 1

    recorded = json.loads(marks_path.read_text())
    results = []
    for entry in recorded['pieces']:
        axes = axes_of(entry)
        results.append({'id': entry['id'], 'file': entry['file'],
                        'marks': len(entry['marks']), 'axes': axes})

    failures = [f for r in results for f in verify_folds(r)]
    report = [fold_summary(r) for r in results]

    print(f'{marks_path}: {sum(r["marks"] for r in results)} marks -> '
          f'{sum(len(r["axes"]) for r in results)} axes')
    for entry in report:
        print(f"  {entry['id']}: {entry['axes']} axes, longest {entry['longestAxis']}, "
              f"marks per axis {entry['axisMarks']}, {entry['unassigned']} unassigned")

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

    for result in results:
        target = outdir / result['file']
        target.write_text(inject(target, [group_for(result['id'], result['axes'])]))

    combined = outdir / recorded['combined']
    combined.write_text(inject(combined, [
        group_for(r['id'], r['axes']) for r in results]))

    (outdir / FOLDS_FILE).write_text(json.dumps(report, indent=2) + '\n')
    print('\n  ' + '\n  '.join(f'-> {r["file"]}' for r in results))
    print(f'  -> {recorded["combined"]}')
    print(f'  -> {FOLDS_FILE}')
    print('  fold checks passed')
    return 0


if __name__ == '__main__':
    sys.exit(main())
