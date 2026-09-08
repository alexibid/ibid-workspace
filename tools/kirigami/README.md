# Kirigami tooling

Two unrelated pipelines share this folder.

| Folder | What it is |
| --- | --- |
| `blender/` | The **generator**. Headless Blender builds a parametric model, welds it with an `EXACT` boolean, proves it carries zero offenders, and exports a printable PDF net per part plus a GLB |
| `mcp/` | The **MCP server** that drives the generator from an agent orchestrator |
| `*.py`, `bake-clip.mjs` | The **reference extractor** below — turns a commercial cut sheet into clean per-piece SVGs. Deterministic, no model calls, unrelated to the generator |

---

# Kirigami reference extractor

Turns a commercial papercraft cut sheet into clean per-piece SVGs with fold axes.
Deterministic — no model calls, no cost per run.

```bash
npm run kirigami:cut      # stage 1 — clean the sheet, cut the pieces, record the fold marks
npm run kirigami:folds    # stage 2 — fit axes from those marks and draw them into the pieces
npm run kirigami:bake     # bake the clip into geometry, write the app asset
npm run kirigami:sheet    # all three, in order
npm run kirigami:diff     # prove the baked asset still matches the source
npm run check:svg         # both stages against their frozen fixtures
```

## Two stages, joined by a file

**Stage 1 — `cut.py`** cleans and cuts. It groups the paths into pieces, classifies the white
(page gap, glue tab, callout bubble), strips the instruction layer, and emits one SVG per piece
plus `all-pieces.svg`. It also writes **`marks.json`**: every fold mark it found, with centre,
direction, length and width, in sheet coordinates.

**Stage 2 — `folds.py`** reads `marks.json`, clusters the marks into axes, and injects one
`<line class="fold-axis">` per axis into the pieces. Running it twice does not duplicate them.

The split is shaped by a hard constraint: **mark detection has to happen before cleaning**, or
the cleaning eats the marks and the axes come out short. Stage 1 therefore detects and *records*;
stage 2 only interprets. That also means a different way of finding folds can be dropped into
stage 2 without touching the cutting.

## The chain

| Step | File | What it does |
| --- | --- | --- |
| parse | `svg_util.py` | path `d` to points, bounding boxes |
| classify | `palette.py` | dark / white / piece colour, **by luminance, never by hex** |
| group | `pieces.py` | contact + containment into pieces; three roles for white |
| marks | `marks.py` | finds the fold slivers by PCA; knows nothing about axes |
| axes | `fold_axes.py` | fits marks into axes by collinearity |
| assert | `checks.py` | `verify_cut` and `verify_folds`, tallies, distributions |
| stage 1 | `cut.py` | pieces + `marks.json` |
| stage 2 | `folds.py` | axes drawn into the pieces + `folds.json` |
| bake | `bake-clip.mjs` | subtracts page gaps so the result needs no `clipPath` |

## Rules that were paid for in bugs

- **Never hardcode the palette.** A re-export of the same sheet moved `#2E0507` to
  `#2E0607` and `#FEFEFE` to `#FFFFFF`, and the extractor found zero fold slivers.
  Colours are classified by luminance.
- **White has three roles**, told apart by point count: page gap (> 25 points, becomes a
  hole), glue tab (≤ 25, kept), callout bubble (circular, deleted). A white carrying a
  printed fold sliver is piece paper whatever its point count.
- **Detect fold axes before cleaning**, or the cleaning eats slivers and the axis shortens.
- **Measure before choosing a threshold.** `gap_tol` sits at 140 because a sweep showed the
  plateau there, not because 140 looked reasonable.

## Prerequisites

`bake-clip.mjs` needs `polygon-clipping`. `tools/qa/svg-diff.py` needs Pillow and Chrome at
the standard macOS path.
