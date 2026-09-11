import argparse
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from journal import Timer  # noqa: E402
from progress import Chunks, Step, announce  # noqa: E402
from store import TRIPOSR_ROOT  # noqa: E402

sys.path.insert(0, str(TRIPOSR_ROOT))

import numpy as np  # noqa: E402
import rembg  # noqa: E402
import torch  # noqa: E402
import trimesh  # noqa: E402
from PIL import Image  # noqa: E402

from tsr.models import nerf_renderer  # noqa: E402
from tsr.system import TSR  # noqa: E402
from tsr.utils import remove_background, resize_foreground  # noqa: E402

CHECKPOINT = "stabilityai/TripoSR"


class ImagineError(RuntimeError):
    pass


def main() -> int:
    options = read_options()
    options.out.mkdir(parents=True, exist_ok=True)
    if options.journal:
        with Timer(options.journal, f"reconstruct {options.image.stem}",
                   "vision/imagine.py") as clock:
            clock.detail = {"checkpoint": CHECKPOINT, "marchingCubes": options.resolution,
                            "view": options.image.stem}
            return _sculpt_all(options)
    return _sculpt_all(options)


def _sculpt_all(options: argparse.Namespace) -> int:
    with Step("cut out"):
        subject = cut_out(options.image, options.foreground, options.precut, options.cutter)
        subject.save(options.out / "subject.png")

    device = pick_device(options.device)
    announce("device", f"{device} · chunk {options.chunk:,} · threshold {options.threshold}")
    with Step("load TripoSR"):
        model = load_model(device, options.chunk)

    chunks = Chunks(nerf_renderer)
    chunks.install()
    mesh = sculpt(model, subject, device, options.resolution, options.threshold, chunks)

    announce("posterise", f"{options.colours} colours")
    posterise(mesh, options.colours)
    linearise(mesh)
    announce("stand", f"{options.height:.0f} mm tall")
    stand(mesh, options.height)

    with Step("export glb"):
        target = options.out / "mesh.glb"
        mesh.export(target)
    (options.out / "meta.json").write_text(json.dumps({
        "source": str(options.image),
        "checkpoint": CHECKPOINT,
        "device": device,
        "marchingCubes": options.resolution,
        "vertices": int(len(mesh.vertices)),
        "faces": int(len(mesh.faces)),
        "watertight": bool(mesh.is_watertight),
        "heightMm": options.height,
        "mesh": str(target),
    }, indent=2))
    print(f"IMAGINED {target} {len(mesh.faces)} faces watertight={mesh.is_watertight}")
    return 0


def read_options() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--device", default="auto")
    parser.add_argument("--resolution", type=int, default=256)
    parser.add_argument("--threshold", type=float, default=25.0)
    parser.add_argument("--foreground", type=float, default=0.85)
    parser.add_argument("--chunk", type=int, default=8192)
    parser.add_argument("--height", type=float, default=200.0)
    parser.add_argument("--colours", type=int, default=5)
    parser.add_argument("--precut", action="store_true")
    parser.add_argument("--cutter", default="birefnet-general")
    parser.add_argument("--journal", type=Path)
    return parser.parse_args()


def pick_device(wanted: str) -> str:
    if wanted != "auto":
        return wanted
    if torch.backends.mps.is_available():
        return "mps"
    return "cuda:0" if torch.cuda.is_available() else "cpu"


def load_model(device: str, chunk: int) -> TSR:
    model = TSR.from_pretrained(CHECKPOINT, config_name="config.yaml", weight_name="model.ckpt")
    model.renderer.set_chunk_size(chunk)
    model.to(device)
    return model


def cut_out(path: Path, foreground: float, precut: bool, cutter: str) -> Image.Image:
    if not path.exists():
        raise ImagineError(f"The reference image {path} does not exist.")
    picture = Image.open(path)
    if not precut:
        picture = remove_background(picture, rembg.new_session(cutter))
    elif picture.mode != "RGBA":
        raise ImagineError(f"{path.name} carries no alpha, so it is not a cutout.")
    picture = resize_foreground(picture, foreground)
    flat = np.array(picture).astype(np.float32) / 255.0
    blended = flat[:, :, :3] * flat[:, :, 3:4] + (1 - flat[:, :, 3:4]) * 0.5
    return Image.fromarray((blended * 255.0).astype(np.uint8))


def posterise(mesh, colours: int) -> None:
    if colours < 2:
        raise ImagineError(f"A palette needs at least two colours, got {colours}.")
    tone = np.asarray(mesh.visual.vertex_colors)[:, :3].astype(np.float64)
    centres = _distinct(_cluster(tone, colours + 3), tone)
    centres = _whiten(centres)
    nearest = np.argmin(_spread(tone, centres), axis=1)
    flat = np.asarray(mesh.visual.vertex_colors).copy()
    flat[:, :3] = np.rint(centres[nearest]).astype(np.uint8)
    mesh.visual.vertex_colors = flat
    shares = [f"#{int(r):02X}{int(g):02X}{int(b):02X} {(nearest == index).mean()*100:.0f}%"
              for index, (r, g, b) in enumerate(np.rint(centres))]
    print("MEASURED palette " + "  ".join(shares))


SEPARATION = 52.0
WHITE_FLOOR = 140.0


def _whiten(centres):
    bright = centres.mean(axis=1) >= WHITE_FLOOR
    if not bright.any():
        bright[int(np.argmax(centres.mean(axis=1)))] = True
    centres[bright] = (255.0, 255.0, 255.0)
    keep = [index for index in range(len(centres))
            if not bright[index] or index == int(np.argmax(bright))]
    return centres[keep]


def _distinct(centres, tone):
    while len(centres) > 2:
        gaps = [(np.linalg.norm(centres[a] - centres[b]), a, b)
                for a in range(len(centres)) for b in range(a + 1, len(centres))]
        closest, left, right = min(gaps)
        if closest >= SEPARATION:
            break
        held = np.argmin(_spread(tone, centres), axis=1)
        loser = left if (held == left).sum() < (held == right).sum() else right
        centres = np.delete(centres, loser, axis=0)
    return centres


def _cluster(tone, colours: int):
    ranked = np.argsort(tone.sum(axis=1))
    centres = tone[ranked[np.linspace(0, len(ranked) - 1, colours).astype(int)]].copy()
    for _ in range(25):
        nearest = np.argmin(_spread(tone, centres), axis=1)
        for index in range(colours):
            members = tone[nearest == index]
            if len(members):
                centres[index] = members.mean(axis=0)
    return centres


def _spread(tone, centres):
    return ((tone[:, None, :] - centres[None, :, :]) ** 2).sum(axis=2)


def linearise(mesh) -> None:
    tone = np.asarray(mesh.visual.vertex_colors).astype(np.float64) / 255.0
    rgb = tone[:, :3]
    tone[:, :3] = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    mesh.visual.vertex_colors = np.clip(tone * 255.0, 0, 255).astype(np.uint8)


def stand(mesh, height_mm: float) -> None:
    low, high = mesh.bounds
    tall = float(high[2] - low[2])
    if tall <= 0:
        raise ImagineError("The generated mesh has no height; the image gave nothing to stand up.")
    mesh.apply_translation((
        -0.5 * float(low[0] + high[0]), -0.5 * float(low[1] + high[1]), -float(low[2])
    ))
    mesh.apply_scale(height_mm * 0.001 / tall)
    mesh.apply_transform(trimesh.transformations.rotation_matrix(-math.pi / 2, (1, 0, 0)))
    low, high = mesh.bounds
    print(f"MEASURED stand size {[round(float(v) * 1000, 1) for v in (high - low)]} mm")


def sculpt(model: TSR, subject: Image.Image, device: str, resolution: int, threshold: float,
           chunks: Chunks):
    with Step("encode"):
        with torch.no_grad():
            codes = model([subject], device=device)
    ladder = [rung for rung in (resolution, resolution + 32, resolution - 32,
                                resolution + 64, resolution - 64) if rung >= 96]
    for place, attempt in enumerate(ladder, start=1):
        announce(f"attempt {place} of {len(ladder)}",
                 f"marching cubes at {attempt} · {attempt ** 3:,} points")
        chunks.begin(attempt)
        meshes = model.extract_mesh(codes, True, resolution=attempt, threshold=threshold)
        if not meshes:
            continue
        mesh = meshes[0]
        print(f"MEASURED sculpt resolution={attempt} faces={len(mesh.faces)} "
              f"watertight={mesh.is_watertight}")
        if mesh.is_watertight:
            return mesh
        announce("open surface", f"{attempt} did not close, stepping the ladder")
    raise ImagineError(
        f"No marching cubes resolution near {resolution} produced a closed surface. "
        f"The cut-out probably has holes or touches the frame edge."
    )


if __name__ == "__main__":
    sys.exit(main())
