#!/usr/bin/env python3
# Generates UTZLINE $ Summary's icon set: a simple dollar-sign-in-a-coin
# glyph with a small upward "trend" tick (money + growth), in this app's
# own accent color (#caa025 -- a gold/money hue, chosen because it's the
# one hue not already used by a sibling app: Site Measure/Viewer are
# orange-red, Install ITP green, Manufacture ITP purple, Delivery ITP
# amber (#b8791a), Projects crimson, Scheduler blue/teal, Machine Schedule
# teal, Solid Surface Schedule indigo).
from PIL import Image, ImageDraw, ImageFont
import os

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

OUT = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(OUT, exist_ok=True)

BG = (22, 18, 9, 255)        # --bg
ACCENT = (202, 160, 37, 255) # --accent #caa025
ACCENT_DK = (140, 108, 20, 255)
WHITE = (247, 242, 230, 255)

def draw_coin(d, cx, cy, size, color):
    r = size / 2
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=max(2, int(size * 0.07)))
    # inner ring for a "coin" feel
    r2 = r * 0.84
    d.ellipse([cx - r2, cy - r2, cx + r2, cy + r2], outline=color, width=max(1, int(size * 0.025)))

def draw_dollar(d, cx, cy, size, color):
    # A crisp "$" from a real bold sans font -- far more legible at small
    # icon sizes than a hand-traced curve. Sized/centered by its own
    # measured bounding box so it optically centers inside the coin
    # regardless of the font's internal glyph metrics/padding.
    font_size = int(size * 1.05)
    font = ImageFont.truetype(FONT_PATH, font_size)
    bbox = d.textbbox((0, 0), "$", font=font)
    gw, gh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = cx - gw / 2 - bbox[0]
    ty = cy - gh / 2 - bbox[1]
    d.text((tx, ty), "$", font=font, fill=color)

def draw_trend_tick(d, cx, cy, size, color):
    # small upward arrow, bottom-right corner -- "growth"
    tick_r = size * 0.16
    d.ellipse([cx - tick_r, cy - tick_r, cx + tick_r, cy + tick_r], fill=color)
    lw = max(2, int(size * 0.035))
    ax0, ay0 = cx - tick_r*0.45, cy + tick_r*0.35
    ax1, ay1 = cx - tick_r*0.05, cy - tick_r*0.15
    ax2, ay2 = cx + tick_r*0.5, cy - tick_r*0.4
    d.line([ax0, ay0, ax1, ay1], fill=WHITE, width=lw)
    d.line([ax1, ay1, ax2, ay2], fill=WHITE, width=lw)
    # arrowhead
    d.line([ax2, ay2, ax2 - tick_r*0.32, ay2 + tick_r*0.06], fill=WHITE, width=lw)
    d.line([ax2, ay2, ax2 - tick_r*0.06, ay2 + tick_r*0.32], fill=WHITE, width=lw)

def make_icon(path, size, maskable):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable:
        d.rectangle([0, 0, size, size], fill=BG)
        glyph_size = size * 0.60
    else:
        d.rounded_rectangle([0, 0, size, size], radius=size * 0.18, fill=BG)
        glyph_size = size * 0.70
    cx, cy = size / 2, size / 2
    draw_coin(d, cx, cy, glyph_size, WHITE)
    draw_dollar(d, cx, cy, glyph_size, WHITE)
    draw_trend_tick(d, cx + glyph_size * 0.32, cy + glyph_size * 0.32, glyph_size, ACCENT)
    img.save(path)

make_icon(os.path.join(OUT, "icon-192.png"), 192, False)
make_icon(os.path.join(OUT, "icon-512.png"), 512, False)
make_icon(os.path.join(OUT, "icon-192-maskable.png"), 192, True)
make_icon(os.path.join(OUT, "icon-512-maskable.png"), 512, True)
print("done")
