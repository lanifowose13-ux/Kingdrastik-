"""Builds the animated lion assets from assets/lion-cutout.png.

terminal: assets/raster.json, frames of half-block cells for a Raster element
apps:     assets/lion.webp.b64, the still picture the animated SVG embeds
Run: python3 tools/build_assets.py
"""
import base64, io, json, math, struct, sys
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = Image.open(ROOT / 'assets/lion-cutout.png').convert('RGBA')
FRAMES, COLS, ROWS = 40, 64, 28           # 40 frames, 10 fps = a 4 s loop
DEFAULT = 0x01000000

def frame(i, w, h):
    t = i / FRAMES * 2 * math.pi
    big = 4
    W, H = w * big, h * big
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    # ground shadow
    sh = Image.new('L', (W, H), 0)
    sa = np.zeros((H, W), np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    breath = 0.5 + 0.5 * math.sin(t)
    sa = np.exp(-(((xx - W * .5) / (W * .40)) ** 2 + ((yy - H * .94) / (H * .05)) ** 2) * 2) * (150 - 25 * breath)
    shadow = Image.fromarray(sa.astype(np.uint8))
    canvas.paste((0, 0, 0, 255), (0, 0), shadow)
    # breathe (taller), lean (a slow 3D-feeling sway)
    fw = int(W * .92); fh = int(SRC.height * fw / SRC.width * (1 + .018 * breath))
    lion = SRC.resize((fw, fh), Image.LANCZOS)
    lean = .035 * math.sin(t * 1)  # shear around the feet
    lion = lion.transform(lion.size, Image.AFFINE, (1, lean, -lean * fh, 0, 1, 0), Image.BICUBIC)
    a = np.asarray(lion).astype(np.float32)
    # moving rim light sweeping across the statue
    pos = ((i / FRAMES) * 1.6 - .3) * fw
    band = np.exp(-(((np.arange(fw) - pos) / (fw * .09)) ** 2))[None, :]
    lum = a[..., :3].mean(-1) / 255
    glow = (band * (.35 + .9 * lum) * 85)[..., None]
    a[..., :3] = np.clip(a[..., :3] + glow * np.array([1.0, .95, .8]), 0, 255)
    lion = Image.fromarray(a.astype(np.uint8), 'RGBA')
    canvas.alpha_composite(lion, ((W - fw) // 2, int(H * .95) - fh))
    return canvas.resize((w, h), Image.LANCZOS)

def cells(img):
    a = np.asarray(img).astype(np.int64)
    out = []
    for r in range(ROWS):
        for c in range(COLS):
            top, bot = a[2 * r, c], a[2 * r + 1, c]
            rgb = lambda p: int(p[0]) << 16 | int(p[1]) << 8 | int(p[2])
            ton, bon = top[3] > 110, bot[3] > 110
            if ton and bon: out += [0x2580, rgb(top), rgb(bot)]
            elif ton: out += [0x2580, rgb(top), DEFAULT]
            elif bon: out += [0x2584, rgb(bot), DEFAULT]
            else: out += [0x20, DEFAULT, DEFAULT]
    return base64.b64encode(struct.pack(f'<{len(out)}I', *out)).decode()

frames = [cells(frame(i, COLS, ROWS * 2)) for i in range(FRAMES)]
(ROOT / 'assets/raster.json').write_text(json.dumps({'columns': COLS, 'rows': ROWS, 'fps': 10, 'frames': frames}))
frame(0, COLS, ROWS * 2).resize((COLS * 8, ROWS * 16), Image.NEAREST).save('/tmp/claude-0/lionimg/raster-preview.png')

still = SRC.resize((400, int(SRC.height * 400 / SRC.width)), Image.LANCZOS)
buf = io.BytesIO(); still.save(buf, 'WEBP', quality=80, method=6)
b64 = base64.b64encode(buf.getvalue()).decode()
(ROOT / 'assets/lion.webp.b64').write_text(b64)
print('raster.json', (ROOT / 'assets/raster.json').stat().st_size, 'webp b64', len(b64), 'still', still.size)
