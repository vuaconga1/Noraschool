"""Flood-fill background removal from image corners → RGBA PNG."""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ASSETS = Path(r"C:\Users\Duc\.cursor\projects\d-tin-nora-wewin-cambrigde-main\assets")
OUT_DIRS = [
    Path(r"d:\tin\nora\wewin-cambrigde-main\public\assets\vocab\pending"),
    Path(r"d:\tin\nora\wewin-cambrigde-main\frontend\public\assets\vocab\pending"),
]

WEAK = [
    "air",
    "daughter",
    "granddaughter",
    "grandson",
    "husband",
    "look",
    "no-fighting",
    "parents",
    "sidewalk",
    "son",
    "teeth",
    "tet-holiday-papaya",
]


def flood_remove(src: Path, color_thr: float = 42.0) -> Image.Image:
    img = Image.open(src).convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3].copy()

    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    seeds = [
        (0, 0),
        (w - 1, 0),
        (0, h - 1),
        (w - 1, h - 1),
        (w // 2, 0),
        (w // 2, h - 1),
        (0, h // 2),
        (w - 1, h // 2),
        (w // 4, 0),
        (3 * w // 4, 0),
        (0, h // 4),
        (0, 3 * h // 4),
    ]
    for x, y in seeds:
        q.append((x, y))
        visited[y, x] = True

    # reference color = median of seed pixels
    seed_colors = np.array([rgb[y, x] for x, y in seeds], dtype=np.float32)
    ref = np.median(seed_colors, axis=0)

    while q:
        x, y = q.popleft()
        dist = float(np.linalg.norm(rgb[y, x] - ref))
        # also allow gradual bg by comparing to local seed-ish brightness
        if dist > color_thr:
            continue
        alpha[y, x] = 0
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny, nx]:
                visited[ny, nx] = True
                q.append((nx, ny))

    # soften edges: any near-bg non-visited border-ish pixels already handled
    # feather: reduce alpha for pixels close in color to ref near transparent neighbors
    for _ in range(2):
        near = (alpha > 0) & (
            (np.pad(alpha, 1)[1:-1, :-2] == 0)
            | (np.pad(alpha, 1)[1:-1, 2:] == 0)
            | (np.pad(alpha, 1)[:-2, 1:-1] == 0)
            | (np.pad(alpha, 1)[2:, 1:-1] == 0)
        )
        dists = np.linalg.norm(rgb - ref, axis=2)
        soft = near & (dists < color_thr * 1.35)
        alpha[soft] = np.minimum(alpha[soft], (dists[soft] / (color_thr * 1.35) * 255))

    out = arr.copy()
    out[:, :, 3] = alpha
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def main() -> None:
    for slug in WEAK:
        src = ASSETS / f"{slug}.jpg"
        if not src.exists():
            print("MISSING", slug)
            continue
        # air needs higher thr because blue fills frame
        thr = 55.0 if slug == "air" else 48.0
        img = flood_remove(src, color_thr=thr)
        px = list(img.getdata())
        trans = sum(1 for *_, a in px if a < 10) / len(px)
        corner = img.getpixel((0, 0))
        for d in OUT_DIRS:
            img.save(d / f"{slug}.png", "PNG")
        flag = "OK" if corner[3] < 10 and trans > 0.2 else "WEAK"
        print(f"{flag} {slug}: transparent={trans*100:.1f}% corner={corner}")


if __name__ == "__main__":
    main()
