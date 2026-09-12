# Kirigami Model Construction — Pipeline Execution & Script Architecture

## Overview
This document describes the ordered sequence of scripts and transformations executed to construct the 3D papercraft model (`model_construct.blend`). 

The aggregated runner executes the stages sequentially, enforcing all scene invariants and visibility rules at every step.

---

## Ordered Execution Pipeline

| Step | Stage | Script / Handler | Input Data | Active Collections | Inactive (Hidden in Viewport) | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **0** | **Stage 0: Bounding Box & Clean Cutouts** | `stage_manager.py` (Stage `0`) | `frame.json`, `clean_cutouts_data.json` | `Bounding Box`, `Clean Cutouts`, `Quadrant Blocks` | All other stage collections (Mold, Extrusions, Tubes, Spheres, Mesh, Cameras, Lights) | **CLOSED & VERIFIED** ✅ |
| **1** | **Stage 1: Face Extrusions & Mold Merge** | `stage_manager.py` (Stage `1`) | Clean cutout polygons, `clean_cutouts_data.json` | `Base Mold` (`Molde_Solid`), `Face Extrusions` (face solids), `Bounding Box` (`Clean Cutouts`) | Quadrant Blocks, Tubes, Spheres, Mesh, Cameras, Lights | **CLOSED & VERIFIED** ✅ |
| **2** | **Stage 2: Orthogonal Raycast Tubes & Collisions** | `stage2_tubes.py` (Stage `2`) | Clean cutouts, `Molde_Solid`, contour extrusions | `Raycast Tubes` (`Tubes_Success_Green`, `Tubes_Failed_Red`, circles, collisions), `Clean Cutouts` | Mold, Extrusions, Spheres, Mesh, Cameras, Lights | **READY FOR VALIDATION** ⏳ |
| **3** | **Stage 3: Quadrant Collisions & Spheres** | `stage3_spheres.py` (Stage `3`) | Orthogonal tube intersections, quadrant bounding boxes | `Raycast Tubes`, `Contact Spheres` (`Stage3_Contact_Spheres`), `Consolidated Spheres` (`Stage3_Consolidated_Spheres`), `Bounding Box`, `Clean Cutouts` | Mold, Extrusions, Mesh, Cameras, Lights | **READY FOR VALIDATION** ⏳ |
| **4** | **Stage 4: Snapped Reconstructed Mesh** | `stage4_snapping.py` (Stage `4`) | Consolidated collision spheres, `Cutout_Faces_*` | `Snapped Cutouts` (`Snapped_Cutout_*`), `Consolidated Spheres`, `Bounding Box`, `Clean Cutouts` | Mold, Extrusions, Tubes, Cameras, Lights | **READY FOR VALIDATION** ⏳ |

---

## Invariants Enforced at Every Step

1. **Scene Preservation**: All scene objects across all stage collections are strictly preserved in the scene at all times. No objects or collections are deleted.
2. **Stage Viewport Isolation**: Only the objects belonging to the target stage are visible (`hide_viewport = False`). All others are set to `hide_viewport = True`.
3. **Clean Viewport Guarantee**: Cameras (`CheckCam`) and Lights (`KeyLight`, `FillLight`) are strictly hidden in the viewport (`hide_viewport = True`) upon file save.
4. **Outliner Auto-Collapse**: All Outliner collections and subcollections are collapsed in all window areas before file write. The registered `auto_collapse.py` timer remains active.

---

## Aggregated Execution Commands

Run from `apps/kirigami-studio`:

```bash
# Run the complete aggregated pipeline (Stage 0 then Stage 1 in sequence):
npm run stage:pipeline

# Run individual validated stages:
npm run stage:0
npm run stage:1
```

Or invoke directly via Node:
```bash
# Aggregated pipeline execution:
node tools/kirigami/stage/pipeline.mjs

# Specific stage targeting:
node tools/kirigami/stage/pipeline.mjs 0
node tools/kirigami/stage/pipeline.mjs 1
```
