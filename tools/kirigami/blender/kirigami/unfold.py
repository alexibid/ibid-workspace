from dataclasses import dataclass
from pathlib import Path

import bpy

from .selection import activate

ADDON = "bl_ext.blender_org.export_paper_model"

PAGE_SIZES_M = {
    "A4": (0.210, 0.297),
    "A3": (0.297, 0.420),
    "US_LETTER": (0.216, 0.279),
    "US_LEGAL": (0.216, 0.356),
}


class UnfoldFailure(RuntimeError):
    pass


@dataclass(frozen=True)
class PageSetup:
    preset: str = "A4"
    margin_mm: float = 5.0
    tab_style: str = "STICKER"
    number_style: str = "INSIDE"
    tab_width_mm: float = 3.0
    auto_scale: bool = True
    bake_samples: int = 8

    @property
    def size_m(self) -> tuple[float, float]:
        size = PAGE_SIZES_M.get(self.preset)
        if size is None:
            raise UnfoldFailure(
                f"Unknown page preset '{self.preset}'. Known: {', '.join(PAGE_SIZES_M)}."
            )
        return size

    @property
    def printable_m(self) -> tuple[float, float]:
        inset = (self.margin_mm + self.tab_width_mm) * 2 * 0.001
        width, height = self.size_m
        return width - inset, height - inset


def enable_addon() -> None:
    try:
        bpy.ops.preferences.addon_enable(module=ADDON)
    except Exception as error:
        raise UnfoldFailure(
            f"The 'Export Paper Model' extension ({ADDON}) is not installed in this Blender."
        ) from error


def prepare_bake(page: PageSetup) -> None:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = page.bake_samples
    scene.render.bake.use_pass_direct = False
    scene.render.bake.use_pass_indirect = False


def apply_page(page: PageSetup) -> None:
    settings = bpy.context.scene.paper_model
    settings.limit_by_page = True
    settings.page_size_preset = page.preset
    settings.output_size_x, settings.output_size_y = page.printable_m
    settings.use_auto_scale = page.auto_scale


def mark_seams(obj: bpy.types.Object) -> None:
    activate(obj)
    try:
        bpy.ops.mesh.unfold()
    except RuntimeError as error:
        raise UnfoldFailure(f"'{obj.name}' could not be unfolded: {error}") from error


def export_net(obj: bpy.types.Object, target: Path, page: PageSetup) -> dict:
    activate(obj)
    target.parent.mkdir(parents=True, exist_ok=True)
    width, height = page.size_m
    try:
        bpy.ops.export_mesh.paper_model(
            filepath=str(target),
            page_size_preset=page.preset,
            output_size_x=width,
            output_size_y=height,
            output_margin=page.margin_mm * 0.001,
            sticker_width=page.tab_width_mm * 0.001,
            tab_style=page.tab_style,
            number_style=page.number_style,
            output_layers="ONESIDE",
            texture_type="TEXTURE",
            image_packing="ISLAND_EMBED",
            bake_samples=page.bake_samples,
            file_format="PDF" if target.suffix == ".pdf" else "SVG",
        )
    except RuntimeError as error:
        raise UnfoldFailure(f"'{obj.name}' could not be exported: {error}") from error

    written = _written(target)
    if not written:
        raise UnfoldFailure(f"'{obj.name}' produced no file at {target}.")

    return {
        "part": obj.name,
        "files": [path.name for path in written],
        "bytes": sum(path.stat().st_size for path in written),
        "pages": _page_count(written),
        "islands": len(obj.data.paper_island_list),
    }


def _written(target: Path) -> list[Path]:
    if target.exists():
        return [target]
    return sorted(target.parent.glob(f"{target.stem}_*{target.suffix}"))


def _page_count(written: list[Path]) -> int:
    if written[0].suffix != ".pdf":
        return len(written)
    content = written[0].read_bytes()
    return max(1, content.count(b"/Type /Page") - content.count(b"/Type /Pages"))

