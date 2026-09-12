import os
import sys
from pathlib import Path
import bpy

STAGE_VISIBLE_COLLECTIONS = {
    0: {"Bounding Box", "Clean Cutouts", "Quadrant Blocks"},
    1: {
        "Base Mold",
        "Face Extrusions",
        "Faces Left",
        "Faces Right",
        "Faces Front",
        "Faces Back",
        "Faces Top",
        "Faces Bottom",
        "Bounding Box",
        "Clean Cutouts",
    },
    2: {
        "Raycast Tubes",
        "Bounding Box",
        "Clean Cutouts",
    },
    3: {
        "Raycast Tubes",
        "Contact Spheres",
        "Consolidated Spheres",
        "Bounding Box",
        "Clean Cutouts",
    },
    4: {
        "Snapped Cutouts",
        "Consolidated Spheres",
        "Bounding Box",
        "Clean Cutouts",
    },
}

def set_layer_collection_visibility(layer_col, visible_col_names):
    if layer_col.name in visible_col_names:
        layer_col.hide_viewport = False
    else:
        layer_col.hide_viewport = True

    for child in layer_col.children:
        set_layer_collection_visibility(child, visible_col_names)

def collapse_all_outliners():
    for win in bpy.context.window_manager.windows:
        for area in win.screen.areas:
            if area.type == "OUTLINER":
                region = next((r for r in area.regions if r.type == "WINDOW"), None)
                if region:
                    with bpy.context.temp_override(
                        window=win, screen=win.screen, area=area, region=region
                    ):
                        for _ in range(15):
                            try:
                                bpy.ops.outliner.show_one_level(open=False)
                            except Exception:
                                pass

def register_auto_collapse():
    collapse_code = """import bpy

def collapse_all():
    for win in bpy.context.window_manager.windows:
        for area in win.screen.areas:
            if area.type == 'OUTLINER':
                region = next((r for r in area.regions if r.type == 'WINDOW'), None)
                if region:
                    with bpy.context.temp_override(window=win, screen=win.screen, area=area, region=region):
                        for _ in range(15):
                            try:
                                bpy.ops.outliner.show_one_level(open=False)
                            except Exception:
                                pass
    return None

bpy.app.timers.register(collapse_all, first_interval=0.1)
"""
    text_name = "auto_collapse.py"
    text = bpy.data.texts.get(text_name)
    if not text:
        text = bpy.data.texts.new(text_name)
    text.clear()
    text.write(collapse_code)
    text.use_module = True

def configure_stage_visibility(stage_num=0):
    target_visible = STAGE_VISIBLE_COLLECTIONS.get(stage_num, STAGE_VISIBLE_COLLECTIONS[0])

    for col in bpy.data.collections:
        if col.name in target_visible:
            col.hide_viewport = False
            col.hide_render = False
        else:
            col.hide_viewport = True
            col.hide_render = False

    set_layer_collection_visibility(
        bpy.context.view_layer.layer_collection, target_visible
    )

    for obj in bpy.data.objects:
        if obj.type in ("CAMERA", "LIGHT"):
            obj.hide_viewport = True
            obj.hide_set(True)
            obj.hide_render = False
            continue

        obj.hide_viewport = False
        obj.hide_set(False)
        obj.hide_render = False

    register_auto_collapse()
    collapse_all_outliners()

def apply_stage(blend_path, stage_num=0):
    resolved_path = Path(blend_path).resolve()
    if not resolved_path.exists():
        raise FileNotFoundError(f"Blend file not found: {resolved_path}")

    bpy.ops.wm.open_mainfile(filepath=str(resolved_path))
    configure_stage_visibility(stage_num)
    bpy.ops.wm.save_mainfile(filepath=str(resolved_path))
