import importlib.util
import json
import sys
import traceback
from datetime import datetime, timezone
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))

from kirigami import PageSetup, Studio  # noqa: E402
from kirigami import report as reporting  # noqa: E402
from kirigami import preview, texture, unfold, validate  # noqa: E402

RESULT_MARKER = "KIRIGAMI_RESULT"


class JobError(RuntimeError):
    def __init__(self, stage: str, message: str) -> None:
        super().__init__(message)
        self.stage = stage


def main() -> int:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    job_path = Path(_flag(argv, "--job"))
    job = json.loads(job_path.read_text())
    out_dir = Path(_flag(argv, "--out", str(job_path.parent / "out"))).resolve()
    result_path = Path(_flag(argv, "--result", str(job_path.parent / "result.json")))

    try:
        manifest = run(job, out_dir)
    except JobError as error:
        _emit(result_path, {"ok": False, "stage": error.stage, "error": str(error),
                            "trace": traceback.format_exc(), "id": job.get("id")})
        return 1
    except Exception as error:  # noqa: BLE001
        _emit(result_path, {"ok": False, "stage": "unknown",
                            "error": f"{type(error).__name__}: {error}",
                            "trace": traceback.format_exc(), "id": job.get("id")})
        return 1

    _emit(result_path, {"ok": True, "manifest": manifest})
    return 0


def run(job: dict, out_dir: Path) -> dict:
    reset_scene()
    unfold.enable_addon()
    page = read_page(job.get("page", {}))
    unfold.apply_page(page)
    unfold.prepare_bake(page)

    studio = build(job)
    reports = [validate.inspect(part.obj) for part in studio.parts]
    clean = reporting.is_clean(reports)
    survey = studio.survey()

    if not clean and not job.get("allowOffenders", False):
        raise JobError("validate", f"The mesh carries offenders — {reporting.offender_summary(reports)}")

    if job.get("preflightOnly", False):
        return {"id": job.get("id", studio.title), "preflight": True, "clean": clean,
                "offenders": reporting.totals(reports), "survey": survey,
                "parts": [{"name": p.name, "faces": len(p.obj.data.polygons)}
                          for p in studio.parts]}

    out_dir.mkdir(parents=True, exist_ok=True)
    paint_parts(studio, page)
    nets = unfold_parts(studio, out_dir, page, job)
    glb = export_preview(studio, out_dir, job)

    manifest = compose(job, studio, reports, nets, glb, page, survey)
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
    return manifest


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0


def read_page(raw: dict) -> PageSetup:
    return PageSetup(
        preset=raw.get("preset", "A4"),
        margin_mm=float(raw.get("marginMm", 5.0)),
        tab_style=raw.get("tabStyle", "STICKER"),
        number_style=raw.get("numberStyle", "INSIDE"),
        tab_width_mm=float(raw.get("tabWidthMm", 3.0)),
    )


def build(job: dict) -> Studio:
    studio = Studio(tier=job.get("tier", "tier-2"), title=job.get("title", ""),
                    family=job.get("family", "sitting-animal"))
    if job.get("mesh"):
        return adopt(job, studio)
    return author(job, studio)


def adopt(job: dict, studio: Studio) -> Studio:
    try:
        part = studio.adopt(job.get("part", "subject"), job["mesh"], job.get("role"))
        if job.get("features"):
            studio.imprint(part, job["features"])
    except Exception as error:  # noqa: BLE001
        raise JobError("build", f"Adopting {job['mesh']} raised {type(error).__name__}: {error}")
    return studio


def author(job: dict, studio: Studio) -> Studio:
    script = Path(job["script"]).resolve()
    if not script.exists():
        raise JobError("build", f"The model script {script} does not exist.")
    spec = importlib.util.spec_from_file_location("kirigami_model", script)
    if spec is None or spec.loader is None:
        raise JobError("build", f"{script} could not be loaded as a Python module.")
    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
    except Exception as error:  # noqa: BLE001
        raise JobError("build", f"{script.name} failed to import: {type(error).__name__}: {error}")
    if not hasattr(module, "build"):
        raise JobError("build", f"{script.name} defines no build(studio) function.")

    try:
        module.build(studio)
    except Exception as error:  # noqa: BLE001
        raise JobError("build", f"build(studio) raised {type(error).__name__}: {error}")
    if not studio.parts:
        raise JobError("build", "build(studio) welded no parts; nothing can be unfolded.")
    abandoned = studio.abandoned_solids()
    if abandoned:
        raise JobError(
            "build",
            f"These solids were never welded into a part and would print as loose shells: "
            f"{', '.join(abandoned)}",
        )
    return studio


def paint_parts(studio: Studio, page: PageSetup) -> None:
    try:
        for part in studio.parts:
            if part.obj.get("kirigami_scanned"):
                continue
            texture.flatten(part.obj, page.bake_samples)
    except texture.BakeError as error:
        raise JobError("paint", str(error))


def unfold_parts(studio: Studio, out_dir: Path, page: PageSetup, job: dict) -> list[dict]:
    if not job.get("outputs", {}).get("pdf", True):
        return []
    nets_dir = out_dir / "nets"
    try:
        nets = []
        for part in studio.parts:
            unfold.mark_seams(part.obj)
            sheet = unfold.export_net(part.obj, nets_dir / f"{part.name}.pdf", page)
            vector = unfold.export_net(part.obj, nets_dir / f"{part.name}.svg", page)
            nets.append({**sheet, "vectors": vector["files"]})
        return nets
    except unfold.UnfoldFailure as error:
        raise JobError("unfold", str(error))


def export_preview(studio: Studio, out_dir: Path, job: dict) -> dict | None:
    if not job.get("outputs", {}).get("glb", True):
        return None
    try:
        return preview.export_glb(studio.objects, out_dir / "model.glb")
    except preview.PreviewError as error:
        raise JobError("preview", str(error))


def compose(job: dict, studio: Studio, reports: list, nets: list[dict],
            glb: dict | None, page: PageSetup, survey: dict) -> dict:
    by_part = {report.part: report for report in reports}
    net_by_part = {net["part"]: net for net in nets}
    return {
        "id": job.get("id", studio.title),
        "title": studio.title,
        "createdAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "blender": bpy.app.version_string,
        "tier": {
            "id": studio.tier.id,
            "ages": studio.tier.ages,
            "style": studio.tier.style,
            "palette": studio.tier.palette,
        },
        "page": {"preset": page.preset, "marginMm": page.margin_mm, "tabStyle": page.tab_style},
        "clean": reporting.is_clean(reports),
        "offenders": reporting.totals(reports),
        "parts": [
            {
                "name": part.name,
                "role": part.role,
                "zones": studio.zones_of(part.name),
                "colours": studio.colours_of(part),
                "mesh": by_part[part.name].as_dict(),
                "net": net_by_part.get(part.name),
            }
            for part in studio.parts
        ],
        "preview": glb,
        "survey": survey,
    }


def _flag(argv: list[str], name: str, fallback: str | None = None) -> str:
    if name in argv:
        return argv[argv.index(name) + 1]
    if fallback is not None:
        return fallback
    raise JobError("arguments", f"Missing required argument {name}.")


def _emit(target: Path, payload: dict) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, indent=2))
    print(f"{RESULT_MARKER} {target}", flush=True)


if __name__ == "__main__":
    sys.exit(main())
