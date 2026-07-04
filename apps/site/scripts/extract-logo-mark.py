"""
One-off utility: cuts a flat-background logo/mark render into a clean
transparent PNG with smooth (non-jagged) alpha edges around glow/bloom.

Usage:
    python scripts/extract-logo-mark.py <source.png> <output.png>

Method: sample the background color from the image corners, compute each
pixel's color distance from it, map distance -> alpha with a smoothstep
curve (avoids the jagged cutout a hard color-key threshold produces on
glowing/anti-aliased lines), then apply a light Gaussian blur restricted to
the alpha channel to remove residual single-pixel jitter, and unmultiply
edge pixel colors so no dark background halo remains once recomposited on
a different background.

After producing a cutout, crop to content and pad into
public/arkitect-mark.png, then run generate-favicon.py to rebuild the
derived favicon/touch-icon/navbar assets.
"""
import sys

import numpy as np
from PIL import Image, ImageFilter


def extract(src_path, out_path, lo=8.0, hi=60.0, blur_radius=0.6):
    img = Image.open(src_path).convert("RGB")
    arr = np.asarray(img).astype(np.float32)
    h, w, _ = arr.shape

    patch = 24
    corners = [
        arr[0:patch, 0:patch], arr[0:patch, w - patch:w],
        arr[h - patch:h, 0:patch], arr[h - patch:h, w - patch:w],
    ]
    bg = np.concatenate([c.reshape(-1, 3) for c in corners], axis=0).mean(axis=0)

    dist = np.sqrt(((arr - bg[None, None, :]) ** 2).sum(axis=-1))
    t = np.clip((dist - lo) / (hi - lo), 0.0, 1.0)
    alpha = t * t * (3 - 2 * t)

    brightness = arr.max(axis=-1)
    bt = np.clip((brightness - 40.0) / 100.0, 0.0, 1.0)
    alpha = np.maximum(alpha, (bt * bt * (3 - 2 * bt)) * 0.9)

    alpha_img = Image.fromarray((alpha * 255).astype(np.uint8), mode="L")
    alpha_blurred = alpha_img.filter(ImageFilter.GaussianBlur(radius=blur_radius))
    a = np.clip(np.asarray(alpha_blurred).astype(np.float32) / 255.0, 0, 1)
    a = a * a * (3 - 2 * a)

    edge_mask = (a > 0.02) & (a < 0.98)
    a_safe = np.clip(a, 0.08, 1.0)[..., None]
    unmult = bg[None, None, :] + (arr - bg[None, None, :]) / a_safe
    out_rgb = np.clip(np.where(edge_mask[..., None], unmult, arr), 0, 255).astype(np.uint8)

    out = Image.fromarray(np.dstack([out_rgb, (a * 255).astype(np.uint8)]), mode="RGBA")
    out.save(out_path)
    print(f"Estimated background: {bg}; saved {out_path} ({out.size})")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python extract-logo-mark.py <source.png> <output.png>")
        sys.exit(1)
    extract(sys.argv[1], sys.argv[2])
