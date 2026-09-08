import bpy
from mathutils import Vector

from .decals import RESOLUTION, mask
from .palettes import linear_rgba
from .shapes import MM

Range = tuple[float, float] | None


class ShadingError(RuntimeError):
    pass


def paint(obj: bpy.types.Object, hex_colour: str) -> None:
    obj.data.materials.clear()
    obj.data.materials.append(_material(f"{obj.name}_paper", hex_colour))
    for polygon in obj.data.polygons:
        polygon.material_index = 0


def shade(obj: bpy.types.Object, hex_colour: str, name: str,
          x: Range = None, y: Range = None, z: Range = None) -> int:
    if x is None and y is None and z is None:
        raise ShadingError(
            f"Zone '{name}' on '{obj.name}' bounds no axis, so it would repaint the whole part."
        )
    slot = len(obj.data.materials)
    obj.data.materials.append(_material(f"{obj.name}_{name}", hex_colour))

    painted = 0
    for polygon in obj.data.polygons:
        centre = obj.matrix_world @ polygon.center
        if _within(centre, x, y, z):
            polygon.material_index = slot
            painted += 1

    if painted == 0:
        raise ShadingError(
            f"Zone '{name}' on '{obj.name}' covers no face. Its box sits off the mesh — "
            f"check the millimetres against the part's own bounds."
        )
    return painted


def mark(obj: bpy.types.Object, hex_colour: str, name: str,
         at: tuple[float, float, float], radius: float) -> int:
    if radius <= 0:
        raise ShadingError(f"Mark '{name}' on '{obj.name}' needs a positive radius.")
    slot = len(obj.data.materials)
    obj.data.materials.append(_material(f"{obj.name}_{name}", hex_colour))
    target = Vector(at) * MM
    reach = radius * MM

    painted = 0
    for polygon in obj.data.polygons:
        if ((obj.matrix_world @ polygon.center) - target).length <= reach:
            polygon.material_index = slot
            painted += 1

    if painted == 0:
        raise ShadingError(
            f"Mark '{name}' on '{obj.name}' caught no face within {radius:.0f} mm of "
            f"{at}. Move the point onto the surface or widen the radius."
        )
    return painted


PLANES = {"x": (1, 2), "y": (0, 2), "z": (0, 1)}


def decal(obj: bpy.types.Object, hex_colour: str, name: str, shape: str,
          at: tuple[float, float, float], size: tuple[float, float], facing: str,
          depth: float | None = None) -> None:
    if facing not in PLANES:
        raise ShadingError(f"A decal faces x, y or z, not '{facing}'.")
    if min(size) <= 0:
        raise ShadingError(f"Decal '{name}' needs a positive size, got {size}.")
    if not obj.data.materials:
        raise ShadingError(f"'{obj.name}' has no material to draw '{name}' onto.")

    image = bpy.data.images.new(f"{obj.name}_{name}", RESOLUTION, RESOLUTION, alpha=True)
    image.pixels = mask(shape)

    local = obj.matrix_world.inverted() @ (Vector(at) * MM)
    across, along = PLANES[facing]
    span = (size[0] * MM, size[1] * MM)
    corner = (local[across] - span[0] * 0.5, local[along] - span[1] * 0.5)
    axis = "xyz".index(facing)
    window = None if depth is None else (local[axis] - depth * MM, local[axis] + depth * MM)
    for material in obj.data.materials:
        _overlay(material, image, linear_rgba(hex_colour), corner, span,
                 (across, along), axis, window)


def _overlay(material, image, colour, corner, span, axes, axis, window) -> None:
    tree = material.node_tree
    surface = tree.nodes.get("Principled BSDF")
    base = surface.inputs["Base Color"]

    coords = tree.nodes.new("ShaderNodeTexCoord")
    split = tree.nodes.new("ShaderNodeSeparateXYZ")
    join = tree.nodes.new("ShaderNodeCombineXYZ")
    place = tree.nodes.new("ShaderNodeMapping")
    texture = tree.nodes.new("ShaderNodeTexImage")
    blend = tree.nodes.new("ShaderNodeMixRGB")

    texture.image = image
    texture.extension = "CLIP"
    place.inputs["Scale"].default_value = (1 / span[0], 1 / span[1], 1)
    place.inputs["Location"].default_value = (
        -corner[0] / span[0], -corner[1] / span[1], 0)
    blend.inputs["Color2"].default_value = colour

    if base.is_linked:
        tree.links.new(blend.inputs["Color1"], base.links[0].from_socket)
    else:
        blend.inputs["Color1"].default_value = base.default_value

    tree.links.new(split.inputs["Vector"], coords.outputs["Object"])
    tree.links.new(join.inputs["X"], split.outputs["XYZ"[axes[0]]])
    tree.links.new(join.inputs["Y"], split.outputs["XYZ"[axes[1]]])
    tree.links.new(place.inputs["Vector"], join.outputs["Vector"])
    tree.links.new(texture.inputs["Vector"], place.outputs["Vector"])
    if window is None:
        tree.links.new(blend.inputs["Factor"], texture.outputs["Alpha"])
    else:
        tree.links.new(blend.inputs["Factor"],
                       _slab(tree, split, texture, axis, window).outputs["Value"])
    tree.links.new(base, blend.outputs["Color"])


def _slab(tree, split, texture, axis, window):
    low = tree.nodes.new("ShaderNodeMath")
    low.operation = "GREATER_THAN"
    low.inputs[1].default_value = window[0]
    high = tree.nodes.new("ShaderNodeMath")
    high.operation = "LESS_THAN"
    high.inputs[1].default_value = window[1]
    band = tree.nodes.new("ShaderNodeMath")
    band.operation = "MULTIPLY"
    gated = tree.nodes.new("ShaderNodeMath")
    gated.operation = "MULTIPLY"

    depth = split.outputs["XYZ"[axis]]
    tree.links.new(low.inputs[0], depth)
    tree.links.new(high.inputs[0], depth)
    tree.links.new(band.inputs[0], low.outputs["Value"])
    tree.links.new(band.inputs[1], high.outputs["Value"])
    tree.links.new(gated.inputs[0], band.outputs["Value"])
    tree.links.new(gated.inputs[1], texture.outputs["Alpha"])
    return gated


def _within(centre: bpy.types.bpy_prop_array, x: Range, y: Range, z: Range) -> bool:
    return all(
        span is None or span[0] * MM <= value <= span[1] * MM
        for value, span in ((centre.x, x), (centre.y, y), (centre.z, z))
    )


def _material(name: str, hex_colour: str) -> bpy.types.Material:
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    surface = material.node_tree.nodes.get("Principled BSDF")
    if surface is None:
        raise ShadingError(f"Material '{name}' has no Principled BSDF to paint.")
    colour = linear_rgba(hex_colour)
    surface.inputs["Base Color"].default_value = colour
    surface.inputs["Roughness"].default_value = 0.86
    surface.inputs["Metallic"].default_value = 0.0
    material.diffuse_color = colour
    return material
