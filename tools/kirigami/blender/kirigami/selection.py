import bpy


def deselect_all() -> None:
    for obj in bpy.data.objects:
        if obj.name in bpy.context.view_layer.objects:
            obj.select_set(False)


def activate(obj: bpy.types.Object) -> None:
    deselect_all()
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)


def select_only(objects: list[bpy.types.Object]) -> None:
    deselect_all()
    for obj in objects:
        obj.select_set(True)
    if objects:
        bpy.context.view_layer.objects.active = objects[0]
