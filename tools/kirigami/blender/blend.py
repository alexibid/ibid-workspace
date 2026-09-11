import sys
from pathlib import Path

import bpy


class BlendError(RuntimeError):
    pass


def main() -> int:
    argv = sys.argv[sys.argv.index("--") + 1:]
    source, target = Path(argv[0]), Path(argv[1])
    if not source.exists():
        raise BlendError(f"There is no mesh at {source}.")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source))
    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    if not meshes:
        raise BlendError(f"{source.name} carried no mesh.")

    obj = max(meshes, key=lambda candidate: len(candidate.data.polygons))
    obj.name = target.stem
    obj.data.name = target.stem
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    target.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(target))
    print(f"MEASURED blend verts={len(obj.data.vertices)} faces={len(obj.data.polygons)} "
          f"colours={len(obj.data.color_attributes)}")
    print(f"BLENDED {target}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
