"""Remove solid black or white backgrounds from vocab images → RGBA PNG."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def detect_bg_mode(img: Image.Image) -> str:
    """Guess whether corners are black or white."""
    rgba = img.convert("RGBA")
    w, h = rgba.size
    samples = [
        rgba.getpixel((0, 0)),
        rgba.getpixel((w - 1, 0)),
        rgba.getpixel((0, h - 1)),
        rgba.getpixel((w - 1, h - 1)),
        rgba.getpixel((w // 2, 0)),
        rgba.getpixel((0, h // 2)),
    ]
    avg = sum(sum(c[:3]) for c in samples) / (len(samples) * 3)
    return "white" if avg >= 200 else "black"


def make_transparent(
    src: Path,
    dest: Path,
    *,
    mode: str | None = None,
    threshold: int | None = None,
    softness: int = 20,
) -> None:
    img = Image.open(src).convert("RGBA")
    bg = mode or detect_bg_mode(img)
    thr = threshold if threshold is not None else (245 if bg == "white" else 18)
    pixels = img.load()
    w, h = img.size

    for y in range(h):
        for x in range(w):
            r, g, b, _a = pixels[x, y]
            if bg == "white":
                score = min(r, g, b)
                if score >= thr:
                    pixels[x, y] = (r, g, b, 0)
                elif score >= thr - softness:
                    alpha = int(max(0, min(255, (thr - score) / softness * 255)))
                    pixels[x, y] = (r, g, b, alpha)
            else:
                score = max(r, g, b)
                if score <= thr:
                    pixels[x, y] = (r, g, b, 0)
                elif score <= thr + softness:
                    alpha = int(max(0, min(255, (score - thr) / softness * 255)))
                    pixels[x, y] = (r, g, b, alpha)

    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "PNG")
    check = Image.open(dest).convert("RGBA")
    px = list(check.getdata())
    trans = sum(1 for *_, a in px if a < 10)
    print(
        f"{dest.name}: bg={bg} size={check.size} "
        f"transparent={round(100 * trans / len(px), 1)}% corner={check.getpixel((0, 0))}"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("src", type=Path)
    parser.add_argument("dest", type=Path)
    parser.add_argument("--mode", choices=["black", "white", "auto"], default="auto")
    args = parser.parse_args()
    make_transparent(args.src, args.dest, mode=None if args.mode == "auto" else args.mode)


if __name__ == "__main__":
    main()
