import argparse
import pathlib
import subprocess
import sys
import tempfile

from PIL import Image, ImageChops

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
THRESHOLD = 40


def render(source, out, width, height):
    subprocess.run(
        [CHROME, '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
         '--enable-unsafe-swiftshader', '--allow-file-access-from-files',
         f'--screenshot={out}', f'--window-size={width},{height}',
         '--default-background-color=FFFFFFFF',
         pathlib.Path(source).resolve().as_uri()],
        capture_output=True, check=False)
    if not pathlib.Path(out).exists():
        raise SystemExit(f'could not render {source}')


def blobs(mask, cell=14):
    pixels = mask.load()
    width, height = mask.size
    occupied = {}
    for y in range(height):
        for x in range(width):
            if pixels[x, y]:
                occupied.setdefault((x // cell, y // cell), []).append((x, y))

    seen, groups = set(), []
    for start in list(occupied):
        if start in seen:
            continue
        stack, points = [start], []
        while stack:
            key = stack.pop()
            if key in seen or key not in occupied:
                continue
            seen.add(key)
            points += occupied[key]
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    stack.append((key[0] + dx, key[1] + dy))
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        groups.append((len(points), min(xs), min(ys), max(xs), max(ys)))
    groups.sort(reverse=True)
    return groups


def main():
    parser = argparse.ArgumentParser(prog='svg-diff')
    parser.add_argument('before')
    parser.add_argument('after')
    parser.add_argument('--width', type=int, default=900)
    parser.add_argument('--height', type=int, default=1100)
    parser.add_argument('--max-blobs', type=int, default=6)
    parser.add_argument('--allow', type=float, default=0.0)
    args = parser.parse_args()

    with tempfile.TemporaryDirectory() as work:
        left = pathlib.Path(work) / 'before.png'
        right = pathlib.Path(work) / 'after.png'
        render(args.before, left, args.width, args.height)
        render(args.after, right, args.width, args.height)
        a = Image.open(left).convert('RGB')
        b = Image.open(right).convert('RGB')

    if a.size != b.size:
        print(f'FAIL  sizes differ: {a.size} vs {b.size}')
        return 1

    mask = ImageChops.difference(a, b).convert('L').point(
        lambda v: 1 if v > THRESHOLD else 0)
    changed = sum(mask.histogram()[1:])
    ratio = changed / (a.width * a.height) * 100

    print(f'{changed} px differ ({ratio:.3f}%) of {a.width}x{a.height}')
    if changed:
        for count, x0, y0, x1, y1 in blobs(mask)[:args.max_blobs]:
            print(f'  blob {count:>6} px  bbox ({x0},{y0})-({x1},{y1})  '
                  f'{x1-x0+1}x{y1-y0+1}')

    if ratio > args.allow:
        print(f'FAIL  above allowance of {args.allow}%')
        return 1
    print('OK')
    return 0


if __name__ == '__main__':
    sys.exit(main())
