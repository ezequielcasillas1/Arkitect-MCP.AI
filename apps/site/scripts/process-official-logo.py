"""
Process the official beaver blueprint logo:
  1. Darken flat background blue to site token #111521
  2. Save full-square master (public/arkitect-logo-full.png)
  3. Extract transparent mark -> public/arkitect-mark.png
  4. Regenerate favicon / touch-icon / navbar assets

Usage:
    python scripts/process-official-logo.py [source.png]
"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
SCRIPTS = os.path.join(ROOT, "scripts")
DEFAULT_SOURCE = os.path.join(ROOT, "assets", "official-logo-source.png")
FULL_OUT = os.path.join(PUBLIC, "arkitect-logo-full.png")
MARK_OUT = os.path.join(PUBLIC, "arkitect-mark.png")
TARGET_BG = np.array([17, 21, 33], dtype=np.float32)  # #111521 — site nav surface


def darken_background(img: Image.Image) -> Image.Image:
    arr = np.asarray(img.convert("RGB")).astype(np.float32)
    h, w, _ = arr.shape

    patch = 24
    corners = [
        arr[0:patch, 0:patch],
        arr[0:patch, w - patch : w],
        arr[h - patch : h, 0:patch],
        arr[h - patch : h, w - patch : w],
    ]
    bg_orig = np.concatenate([c.reshape(-1, 3) for c in corners], axis=0).mean(axis=0)

    dist = np.sqrt(((arr - bg_orig[None, None, :]) ** 2).sum(axis=-1))
    brightness = arr.max(axis=-1)

    is_line = (brightness > 175) | (dist > 52)

    bg_level = float(bg_orig.max())
    lift = np.clip((brightness - bg_level * 0.82) / max(255.0 - bg_level * 0.82, 1.0), 0.0, 1.0)
    grid = lift * 0.11 * 255.0

    out = np.broadcast_to(TARGET_BG, arr.shape).copy()
    out[..., 0] += grid
    out[..., 1] += grid
    out[..., 2] += grid * 1.08

    result = np.where(is_line[..., None], arr, out)
    return Image.fromarray(np.clip(result, 0, 255).astype(np.uint8), mode="RGB")


def main() -> None:
    source = os.path.normpath(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SOURCE)
    if not os.path.isfile(source):
        print(f"Source not found: {source}")
        sys.exit(1)

    img = Image.open(source)
    size = max(img.size)
    square = img.resize((size, size), Image.LANCZOS) if img.size[0] != img.size[1] else img
    darkened = darken_background(square)
    darkened.save(FULL_OUT, optimize=True)
    print(f"Wrote {FULL_OUT} (bg -> #111521)")

    extract_script = os.path.join(SCRIPTS, "extract-logo-mark.py")
    subprocess.run([sys.executable, extract_script, FULL_OUT, MARK_OUT], check=True)

    gen_script = os.path.join(SCRIPTS, "generate-favicon.py")
    subprocess.run([sys.executable, gen_script], check=True)


if __name__ == "__main__":
    main()
