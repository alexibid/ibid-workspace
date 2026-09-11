from typing import List
import bpy

def compute_boolean_intersection_solid(prism_objects: List[bpy.types.Object]) -> bpy.types.Object:
    if not prism_objects:
        raise ValueError("No prism objects provided for boolean intersection")

    base_obj = prism_objects[0]
    base_obj.name = "Model_Resulting_Solid"

    for other in prism_objects[1:]:
        mod = base_obj.modifiers.new(name=f"Intersect_{other.name}", type='BOOLEAN')
        mod.operand_type = 'OBJECT'
        mod.object = other
        mod.operation = 'INTERSECT'
        mod.solver = 'EXACT'

        bpy.context.view_layer.objects.active = base_obj
        bpy.ops.object.modifier_apply(modifier=mod.name)

        bpy.data.objects.remove(other, do_unlink=True)

    bpy.context.view_layer.objects.active = base_obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=0.0002)
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')

    mat = bpy.data.materials.new(name="Mat_Mannequin_Clay")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.75, 0.74, 0.72, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.85
    base_obj.data.materials.clear()
    base_obj.data.materials.append(mat)

    return base_obj
