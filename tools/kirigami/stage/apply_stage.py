import os
import sys
from pathlib import Path

workspace_dir = Path(__file__).resolve().parents[3]
if str(workspace_dir) not in sys.path:
    sys.path.insert(0, str(workspace_dir))

from tools.kirigami.stage.stage_manager import apply_stage

def main():
    argv = sys.argv
    stage_args = []
    if "--" in argv:
        stage_args = argv[argv.index("--") + 1 :]

    stage_num = 0
    blend_path = "apps/kirigami-studio/resources/baby-broncosaurus-v3/model_construct.blend"

    if len(stage_args) > 0:
        stage_num = int(stage_args[0])
    if len(stage_args) > 1:
        blend_path = stage_args[1]

    if stage_num in (0, 1):
        from tools.kirigami.stage.clean_cutouts import clean_all_cutouts
        clean_all_cutouts(Path(blend_path).resolve())

    if stage_num == 2:
        from tools.kirigami.stage.stage2_tubes import run_stage2
        run_stage2(Path(blend_path).resolve())

    if stage_num == 3:
        from tools.kirigami.stage.stage3_spheres import run_stage3
        run_stage3(Path(blend_path).resolve())

    if stage_num == 4:
        from tools.kirigami.stage.stage4_snapping import run_stage4
        run_stage4(Path(blend_path).resolve())

    apply_stage(blend_path, stage_num)

if __name__ == "__main__":
    main()
