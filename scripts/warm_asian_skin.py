from PIL import Image
import numpy as np

src = r"C:\Users\Duc\.cursor\projects\d-tin-nora-wewin-cambrigde-main\assets\choosetopic-pink-asian-v2.jpg"
out_path = r"C:\Users\Duc\.cursor\projects\d-tin-nora-wewin-cambrigde-main\assets\choosetopic-pink-asian-warm.jpg"
public_png = r"d:\tin\nora\wewin-cambrigde-main\public\assets\choosetopic.png"
frontend_png = r"d:\tin\nora\wewin-cambrigde-main\frontend\public\assets\choosetopic.png"

img = Image.open(src).convert("RGB")
arr = np.array(img).astype(np.float32)
h, w = arr.shape[:2]

# Tight ROI around girl (face + arms + hands), avoid wall/floor/owl
y0, y1 = int(h * 0.55), int(h * 0.92)
x0, x1 = int(w * 0.02), int(w * 0.40)
region = arr[y0:y1, x0:x1].copy()
r, g, b = region[:, :, 0], region[:, :, 1], region[:, :, 2]

# Skin: warm flesh with yellow bias; exclude hot pink (low G) and cream wall (very close R≈G≈B high)
yellow_bias = (g - b) > 18
not_hot_pink = g > 140
flesh_range = (r > 175) & (g > 140) & (b > 95) & (b < 210)
r_leads = (r >= g - 8) & ((r - g) < 70)
not_near_white_equal = ~((r > 245) & (g > 235) & (b > 220) & ((r - b) < 25))
# Exclude book pages / bright equal cream inside book
not_cream_flat = ~((r > 240) & (g > 220) & (b > 190) & ((g - b) < 25) & ((r - g) < 20))

mask = flesh_range & yellow_bias & not_hot_pink & r_leads & not_near_white_equal & not_cream_flat
print("skin pixels", int(mask.sum()), "of", mask.size)

out = region.copy()
# Shift toward warmer Asian yellow-beige while keeping shading
# Reduce blue, slightly boost green/yellow, gently lower value so not chalk-white
out[:, :, 0][mask] = np.clip(out[:, :, 0][mask] * 0.98 + 8, 0, 255)   # keep warm red
out[:, :, 1][mask] = np.clip(out[:, :, 1][mask] * 1.02 + 6, 0, 255)   # more yellow
out[:, :, 2][mask] = np.clip(out[:, :, 2][mask] * 0.82 - 8, 0, 255)   # less blue -> yellower

arr[y0:y1, x0:x1] = out
result = Image.fromarray(arr.astype(np.uint8))
result.save(out_path, quality=95)
result.save(public_png, format="PNG")
result.save(frontend_png, format="PNG")
print("saved", out_path)
print("installed", public_png)

# QC samples
for name, yy, xx in [
    ("cheek", int(h * 0.66), int(w * 0.20)),
    ("hand", int(h * 0.72), int(w * 0.32)),
    ("shirt", int(h * 0.80), int(w * 0.18)),
]:
    print(name, arr[yy, xx].astype(int))
