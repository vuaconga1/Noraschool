"""Convert generated vocab JPGs in Cursor assets → transparent PNG in pending folders."""

from __future__ import annotations

import re
from pathlib import Path

from PIL import Image

ASSETS = Path(r"C:\Users\Duc\.cursor\projects\d-tin-nora-wewin-cambrigde-main\assets")
OUT_DIRS = [
    Path(r"d:\tin\nora\wewin-cambrigde-main\public\assets\vocab\pending"),
    Path(r"d:\tin\nora\wewin-cambrigde-main\frontend\public\assets\vocab\pending"),
]

# word -> slug overrides
SLUG_OVERRIDES = {
    "sydney opera house chỉ dành cho level": "sydney-opera-house",
}


def slugify(word: str) -> str:
    if word in SLUG_OVERRIDES:
        return SLUG_OVERRIDES[word]
    return re.sub(r"[^a-z0-9]+", "-", word.lower()).strip("-")


def detect_bg(img: Image.Image) -> str:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    samples = [
        rgba.getpixel((2, 2)),
        rgba.getpixel((w - 3, 2)),
        rgba.getpixel((2, h - 3)),
        rgba.getpixel((w - 3, h - 3)),
        rgba.getpixel((w // 2, 2)),
        rgba.getpixel((2, h // 2)),
    ]
    avg = sum(sum(c[:3]) for c in samples) / (len(samples) * 3)
    return "white" if avg >= 200 else "black"


def remove_bg(src: Path) -> Image.Image:
    img = Image.open(src).convert("RGBA")
    bg = detect_bg(img)
    pixels = img.load()
    w, h = img.size
    softness = 22
    if bg == "white":
        thr = 242
        for y in range(h):
            for x in range(w):
                r, g, b, _a = pixels[x, y]
                score = min(r, g, b)
                if score >= thr:
                    pixels[x, y] = (r, g, b, 0)
                elif score >= thr - softness:
                    alpha = int(max(0, min(255, (thr - score) / softness * 255)))
                    pixels[x, y] = (r, g, b, alpha)
    else:
        thr = 22
        for y in range(h):
            for x in range(w):
                r, g, b, _a = pixels[x, y]
                score = max(r, g, b)
                # keep very dark subject pixels if neighbors are colored
                if score <= thr:
                    pixels[x, y] = (r, g, b, 0)
                elif score <= thr + softness:
                    alpha = int(max(0, min(255, (score - thr) / softness * 255)))
                    pixels[x, y] = (r, g, b, alpha)
    return img, bg


def main() -> None:
    missing = [
        "air",
        "angle",
        "ao dai",
        "barbecue",
        "be quiet",
        "ben thanh market",
        "black cat",
        "city",
        "conical hat",
        "cowboy",
        "custard apple",
        "daughter",
        "driver",
        "fist bump",
        "go straight",
        "granddaughter",
        "grandson",
        "ha noi",
        "hello",
        "helmet",
        "high five",
        "hot chocolate",
        "husband",
        "listen",
        "listen to your teacher",
        "look",
        "look at the teacher",
        "meat pie",
        "mid-autumn day",
        "no fighting",
        "no running",
        "palace",
        "parents",
        "pho",
        "pirate",
        "pumkin",
        "pyramid",
        "raise your hand",
        "seed",
        "sidewalk",
        "sit nicely",
        "sled",
        "snow",
        "snowflake",
        "son",
        "statue",
        "stop",
        "superhero",
        "sydney opera house chỉ dành cho level",
        "teeth",
        "temple",
        "tet holiday papaya",
        "turn left",
        "turn right",
        "vegemite",
        "wait",
        "wife",
        "sand castle",
        # already generated earlier
        "bamboo",
        "boomerang",
    ]

    ok = 0
    missing_src = []
    weak = []
    for word in missing:
        slug = slugify(word)
        src = ASSETS / f"{slug}.jpg"
        if not src.exists():
            # try transparent-named leftovers
            alt = ASSETS / f"{slug}-transparent.jpg"
            src = alt if alt.exists() else src
        if not src.exists():
            missing_src.append(slug)
            continue
        img, bg = remove_bg(src)
        px = list(img.getdata())
        trans = sum(1 for *_, a in px if a < 10) / len(px)
        corner = img.getpixel((0, 0))
        for out_dir in OUT_DIRS:
            out_dir.mkdir(parents=True, exist_ok=True)
            dest = out_dir / f"{slug}.png"
            img.save(dest, "PNG")
        status = "OK"
        if trans < 0.15 or corner[3] > 10:
            status = "WEAK"
            weak.append(slug)
        print(f"{status} {slug}: bg={bg} transparent={trans*100:.1f}% corner={corner}")
        ok += 1

    print(f"\nProcessed {ok}/{len(missing)}")
    if missing_src:
        print("Missing source JPGs:", ", ".join(missing_src))
    if weak:
        print("Weak transparency:", ", ".join(weak))


if __name__ == "__main__":
    main()
