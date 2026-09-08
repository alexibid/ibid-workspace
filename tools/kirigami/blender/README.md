# Kirigami Blender runtime

Builds a parametric papercraft model in headless Blender, welds it into one closed manifold
shell, proves it carries no offenders, and exports one printable PDF net per part plus a GLB for
the three.js viewer.

Blender 4.2 or newer, with the **Export Paper Model** extension installed
(`bl_ext.blender_org.export_paper_model`). Verified against Blender 5.2.1 LTS.

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python tools/kirigami/blender/run_job.py -- --job path/to/job.json --out path/to/out
```

Nothing here is meant to be run by hand in normal use — `tools/kirigami/mcp/` drives it.

## The job

```json
{
  "id": "forest-fox",
  "title": "Fox in the forest",
  "tier": "tier-3",
  "script": "/abs/path/model.py",
  "page": { "preset": "A4", "marginMm": 5, "tabStyle": "STICKER", "numberStyle": "INSIDE" },
  "outputs": { "pdf": true, "glb": true }
}
```

The runner prints exactly one machine-readable line, `KIRIGAMI_RESULT <json>`, carrying either
the manifest or a `{stage, error, trace}` failure. Everything else on stdout is Blender's own
noise.

## The model script

One function, no imports:

```python
def build(studio):
    body = studio.block("body", size=(70, 40, 34), at=(0, 0, 46))
    head = studio.block("head", size=(34, 30, 30), at=(46, 0, 58))
    studio.weld("trex", [body, head], role="primary")
```

From tier 3 the shape comes from a spine rather than a stack of primitives, the part is
mirrored as it is welded, and colour zones are boxes in millimetres:

```python
def build(studio):
    body = studio.loft("body",
        spine=[(-24, 0, 18), (-10, 0, 44), (4, 0, 72), (12, 0, 96)],
        sections=[(52, 58), (48, 52), (40, 42), (28, 30)], sides=8)
    ear = studio.pyramid("ear", base=(18, 14), height=28, at=(14, 13, 126))
    fox = studio.weld("fox", [body, ear], role="primary", mirror="y")
    studio.shade(fox, "neutral", x=(18, 46), z=(64, 98))
```

Millimetres throughout, `at` is the centre, `rotation` is degrees in XYZ order. See
`examples/` for one model per tier.

## The chain

| Step | Module | What it does |
| --- | --- | --- |
| tiers | `kirigami/tiers.py` | The four dexterity budgets. The single source of truth |
| palette | `kirigami/palettes.py` | Six roles per tier palette, sRGB to linear |
| shapes | `kirigami/shapes.py` | Millimetres, mesh assembly, placement |
| solids | `kirigami/solids.py` | `block`, `wedge`, `pyramid`, `prism`, `lowpoly`, `facet` |
| sculpt | `kirigami/sculpt.py` | `loft` along a parallel-transported spine, `hull` |
| symmetry | `kirigami/symmetry.py` | Bisect and mirror across a world plane, seam merged |
| materials | `kirigami/materials.py` | The base colour and the per-face zone boxes |
| studio | `kirigami/studio.py` | The facade the model script writes against; enforces the tier |
| weld | `kirigami/weld.py` | Boolean `EXACT` union and difference, then the mirror |
| repair | `kirigami/repair.py` | Merge doubles, triangulate twisted n-gons, dissolve the slivers that leaves |
| validate | `kirigami/validate.py` | Thirteen offender counters |
| unfold | `kirigami/unfold.py` | Drives `export_mesh.paper_model` per part |
| preview | `kirigami/preview.py` | Materials and the GLB export |
| contract | `dump_contract.py` | Dumps tiers and palettes as JSON, no Blender needed |

## Rules that were paid for in failed runs

- **A boolean union only fuses solids that overlap.** Touching face to face leaves a coincident
  sliver; missing entirely leaves two shells and the validator names it `unwelded_shells`.
- **Never solidify.** The mesh *is* the paper. A solidify modifier gives two shells and the net
  comes out doubled.
- **The validator's epsilons match the unfolder's.** `zero_area_faces` at 1e-6 m², twisted
  n-gons at 1% of face diameter — the same numbers `check_correct` uses inside the addon. A
  looser threshold means the export fails after the validator said the mesh was clean, which is
  exactly the bug this alignment removes.
- **The repair pass runs inside `weld`, not after validation.** Boolean `EXACT` reliably emits a
  handful of slivers and twisted coplanar n-gons; curing them at the weld is what makes the
  offender report meaningful.
- **A solid that is never welded is a failure, not a warning.** It would print as a loose shell
  nobody asked for, so `run_job.py` refuses the job and names it.
- **Triangulate before dissolving slivers, never after.** Splitting a twisted n-gon manufactures
  sub-millimetre triangles, and a repair pass that ran before the triangulation leaves them for
  the unfolder to choke on. This exact ordering bug cost two rounds of debugging.
- **The sliver cure is bounded by the tier's own minimum feature.** `tidy` escalates the
  dissolve distance from 0.2 mm while null faces remain, and stops at a quarter of the smallest
  feature the tier permits, so repair can never eat geometry a child was supposed to cut.
  `bmesh.ops.collapse` was tried first and tore holes in the shell.
