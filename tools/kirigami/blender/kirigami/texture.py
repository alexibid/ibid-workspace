import bpy

from .palettes import linear_rgba
from .selection import activate

BAKE_SIZE = 1024
BAKE_MARGIN = 8


class BakeError(RuntimeError):
    pass


def flatten(obj: bpy.types.Object, samples: int) -> str:
    if not obj.data.materials:
        raise BakeError(f"'{obj.name}' carries no material to bake.")

    activate(obj)
    _unwrap(obj)
    image = bpy.data.images.new(f"{obj.name}_baked", BAKE_SIZE, BAKE_SIZE, alpha=False)
    image.colorspace_settings.name = "Non-Color"
    for material in obj.data.materials:
        _aim(material, image)

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.render.bake.use_pass_direct = False
    scene.render.bake.use_pass_indirect = False
    scene.render.bake.margin = BAKE_MARGIN
    try:
        bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"}, use_clear=True)
    except RuntimeError as error:
        raise BakeError(f"Baking '{obj.name}' failed: {error}") from error

    _wear(obj, image)
    return image.name


def _unwrap(obj: bpy.types.Object) -> str:
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")
    active = obj.data.uv_layers.active
    if active is None:
        raise BakeError(f"'{obj.name}' has no UV map after unwrapping.")
    active.name = f"{obj.name}_bake"
    return active.name


def _aim(material: bpy.types.Material, image: bpy.types.Image) -> None:
    node = material.node_tree.nodes.new("ShaderNodeTexImage")
    node.image = image
    material.node_tree.nodes.active = node


def _wear(obj: bpy.types.Object, image: bpy.types.Image) -> None:
    painted = bpy.data.materials.new(name=f"{obj.name}_printed")
    painted.use_nodes = True
    tree = painted.node_tree
    surface = tree.nodes.get("Principled BSDF")
    texture = tree.nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Linear"
    tree.links.new(surface.inputs["Base Color"], texture.outputs["Color"])
    surface.inputs["Roughness"].default_value = 0.86
    painted.diffuse_color = linear_rgba("#FFFFFF")

    obj.data.materials.clear()
    obj.data.materials.append(painted)
    for polygon in obj.data.polygons:
        polygon.material_index = 0
