"""
Regenerates favicon/touch-icon/navbar assets from public/arkitect-mark.png
(the master transparent mark). Run after replacing that master file:

    python scripts/generate-favicon.py

Small badge sizes (16/32) get a brightness/saturation boost so the mark
reads clearly against the dark badge background at tiny scale; the
apple-touch-icon and navbar asset use the mark as-is.
"""
import io
import os

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
MASTER_PATH = os.path.join(PUBLIC, "arkitect-mark.png")
DARK_BG = (17, 21, 33, 255)  # #111521 — site's dark brand surface


def brighten_for_small(im, gamma=0.5, sat=1.35):
    arr = np.asarray(im).astype(np.float32)
    rgb = np.power(np.clip(arr[..., :3], 0, 255) / 255.0, gamma) * 255.0
    out = np.dstack([rgb, arr[..., 3]]).astype(np.uint8)
    result = Image.fromarray(out, mode="RGBA")
    r, g, b, a = result.split()
    boosted = ImageEnhance.Color(Image.merge("RGB", (r, g, b))).enhance(sat)
    r2, g2, b2 = boosted.split()
    return Image.merge("RGBA", (r2, g2, b2, a))


def rounded_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def badge(size, fill_frac, radius_frac, source):
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg_layer = Image.new("RGBA", (size, size), DARK_BG)
    canvas = Image.composite(bg_layer, canvas, rounded_mask(size, int(size * radius_frac)))
    inner = int(size * fill_frac)
    mark = source.resize((inner, inner), Image.LANCZOS)
    off = (size - inner) // 2
    canvas.alpha_composite(mark, (off, off))
    return canvas


def png_to_ico(png_buffers, sizes, out_path):
    count = len(png_buffers)
    header = bytearray(6)
    header[2] = 1
    header[4] = count & 0xFF
    entries = bytearray()
    offset = 6 + count * 16
    for buf, size in zip(png_buffers, sizes):
        entry = bytearray(16)
        entry[0] = 0 if size >= 256 else size
        entry[1] = 0 if size >= 256 else size
        entry[4] = 1
        entry[6] = 32
        entry[8:12] = len(buf).to_bytes(4, "little")
        entry[12:16] = offset.to_bytes(4, "little")
        entries += entry
        offset += len(buf)
    with open(out_path, "wb") as f:
        f.write(header)
        f.write(entries)
        for buf in png_buffers:
            f.write(buf)


def main():
    master = Image.open(MASTER_PATH).convert("RGBA")
    bright = brighten_for_small(master)

    fav32 = badge(32, 0.86, 0.20, bright)
    fav16 = badge(16, 0.92, 0.22, bright)
    fav32.save(os.path.join(PUBLIC, "favicon-32.png"), optimize=True)
    fav16.save(os.path.join(PUBLIC, "favicon-16.png"), optimize=True)

    buf16, buf32 = io.BytesIO(), io.BytesIO()
    fav16.save(buf16, format="PNG")
    fav32.save(buf32, format="PNG")
    png_to_ico([buf16.getvalue(), buf32.getvalue()], [16, 32], os.path.join(PUBLIC, "favicon.ico"))

    apple = Image.new("RGBA", (180, 180), DARK_BG)
    inner = int(180 * 0.72)
    apple.alpha_composite(master.resize((inner, inner), Image.LANCZOS), ((180 - inner) // 2,) * 2)
    apple.convert("RGB").save(os.path.join(PUBLIC, "apple-touch-icon.png"), optimize=True)

    nav = master.resize((128, 128), Image.LANCZOS)
    nav.save(os.path.join(PUBLIC, "arkitect-mark-nav.png"), optimize=True)

    print("Wrote favicon-16.png, favicon-32.png, favicon.ico, apple-touch-icon.png, arkitect-mark-nav.png")


if __name__ == "__main__":
    main()
