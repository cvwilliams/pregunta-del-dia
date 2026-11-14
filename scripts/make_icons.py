"""Build the app icons: outline '¿?' from the app's display font (Bricolage Grotesque),
write SVGs, render PNGs with rsvg-convert, and pack public/favicon.ico.

Run `make icons` (Docker). Directly: python make_icons.py <font.ttf> <out_dir>
"""
import struct
import subprocess
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

font_path, out = sys.argv[1], Path(sys.argv[2])

NAVY = '#012a45'
GREEN_1, GREEN_2 = '#1f6a51', '#123f33'
CREAM = '#f6eedb'
# Same tile as the pattern on the app's card backs (64x80).
TILE = ('M0-20 21 0 0 20-21 0ZM64-20l21 20-21 20-21-20ZM0 60l21 20-21 20-21-20Z'
        'M64 60l21 20-21 20-21-20ZM32 10l16.5 12-2.5 18 2.5 18L32 70 15.5 58 18 40l-2.5-18Z')

font = TTFont(font_path)
# Pin every variable axis: large optical size, bold, normal width.
wanted = {'opsz': 96, 'wght': 700, 'wdth': 100}
axes = {a.axisTag: min(max(wanted.get(a.axisTag, a.defaultValue), a.minValue), a.maxValue)
        for a in font['fvar'].axes} if 'fvar' in font else {}
if axes:
    font = instantiateVariableFont(font, axes)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font['head'].unitsPerEm


def text_path(text: str, size: float, cx: float, cy: float) -> str:
    """Outline `text` at `size`, centred on (cx, cy) by its ink bounds."""
    names = [cmap[ord(c)] for c in text]
    s = size / upm
    bp = BoundsPen(glyphs)
    x = 0
    for n in names:
        glyphs[n].draw(TransformPen(bp, (1, 0, 0, 1, x, 0)))
        x += glyphs[n].width
    xmin, ymin, xmax, ymax = bp.bounds
    ox = cx - (xmin + xmax) / 2 * s
    oy = cy + (ymin + ymax) / 2 * s
    pen = SVGPathPen(glyphs, ntos=lambda v: f'{v:.1f}'.rstrip('0').rstrip('.'))
    x = 0
    for n in names:
        glyphs[n].draw(TransformPen(pen, (s, 0, 0, -s, ox + x * s, oy)))
        x += glyphs[n].width
    return pen.getCommands()


def card(cx: float, cy: float, w: float, h: float) -> str:
    """A face-down card like the app's: cream frame, patterned green, cream rule, emblem."""
    k = w / 232  # proportions tuned at w=232
    x, y = cx - w / 2, cy - h / 2
    f, r = 12 * k, 26 * k
    gi = 8 * k
    em_r = 64 * k
    return f'''
  <g filter="url(#shadow)">
    <rect x="{x + 12*k:.1f}" y="{y + 10*k:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r:.1f}" fill="{CREAM}" opacity=".3" transform="rotate(9 {cx:.1f} {cy:.1f})"/>
    <rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r:.1f}" fill="{CREAM}"/>
  </g>
  <rect x="{x+f:.1f}" y="{y+f:.1f}" width="{w-2*f:.1f}" height="{h-2*f:.1f}" rx="{r-f*.8:.1f}" fill="url(#green)"/>
  <rect x="{x+f:.1f}" y="{y+f:.1f}" width="{w-2*f:.1f}" height="{h-2*f:.1f}" rx="{r-f*.8:.1f}" fill="url(#cardp)"/>
  <rect x="{x+f+gi:.1f}" y="{y+f+gi:.1f}" width="{w-2*(f+gi):.1f}" height="{h-2*(f+gi):.1f}" rx="{r-f-gi*.6:.1f}" fill="none" stroke="{CREAM}" stroke-width="{3*k:.1f}"/>
  <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{em_r + 14*k:.1f}" fill="{GREEN_2}" fill-opacity=".75"/>
  <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{em_r:.1f}" fill="{GREEN_2}" stroke="{CREAM}" stroke-width="{5*k:.1f}"/>
  <path d="{text_path('¿?', 92*k, cx, cy)}" fill="{CREAM}"/>'''


def icon(card_w: float, corner: float) -> str:
    card_h = card_w * 312 / 232
    k = card_w / 232
    clip = f'<rect width="512" height="512" rx="{corner}"/>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <clipPath id="bg">{clip}</clipPath>
    <pattern id="cardp" width="{32*k:.2f}" height="{40*k:.2f}" patternUnits="userSpaceOnUse" patternTransform="translate({256 - 16*k:.2f} {256 - 20*k:.2f})">
      <path d="{TILE}" transform="scale({k/2:.4f})" fill="#000" fill-opacity=".22"/>
    </pattern>
    <linearGradient id="green" x1="0" y1="0" x2=".45" y2="1">
      <stop offset="0" stop-color="{GREEN_1}"/><stop offset="1" stop-color="{GREEN_2}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="{8*k:.1f}" stdDeviation="{10*k:.1f}" flood-color="#000814" flood-opacity=".45"/>
    </filter>
  </defs>
  <g clip-path="url(#bg)">
    <rect width="512" height="512" fill="{NAVY}"/>
  </g>{card(256, 256, card_w, card_h)}
</svg>
'''


# Rounded icon for the favicon / standard PWA icons.
(out / 'icon.svg').write_text(icon(card_w=232, corner=112))
# Full-bleed with the card inside the maskable safe zone (centre circle, r = 40%).
(out / 'icon-maskable.svg').write_text(icon(card_w=196, corner=0))
# iOS rounds the corners itself, so the touch icon is full-bleed at the normal card size.
apple = out / '.apple-touch.svg'
apple.write_text(icon(card_w=232, corner=0))

for src, name, size in [
    ('icon.svg', 'icon-192.png', 192),
    ('icon.svg', 'icon-512.png', 512),
    ('icon-maskable.svg', 'icon-maskable-512.png', 512),
    ('.apple-touch.svg', 'apple-touch-icon.png', 180),
]:
    subprocess.run(['rsvg-convert', '-w', str(size), '-h', str(size), '-o', str(out / name), str(out / src)], check=True)
    print('wrote', name)
apple.unlink()

# favicon.ico for browsers that don't use SVG favicons (Safari) or that just request
# /favicon.ico. Without one they fall back to a guess, such as the parent domain's icon.
# Each size is rendered from the SVG so it stays crisp, and stored as PNG inside the ICO.
sizes = [16, 32, 48]
pngs = []
for size in sizes:
    tmp = out / f'.favicon-{size}.png'
    subprocess.run(['rsvg-convert', '-w', str(size), '-h', str(size), '-o', str(tmp), str(out / 'icon.svg')], check=True)
    pngs.append(tmp.read_bytes())
    tmp.unlink()
header = struct.pack('<HHH', 0, 1, len(sizes))
offset = len(header) + 16 * len(sizes)
entries = b''
for size, data in zip(sizes, pngs):
    entries += struct.pack('<BBBBHHII', size, size, 0, 0, 1, 32, len(data), offset)
    offset += len(data)
(out.parent / 'favicon.ico').write_bytes(header + entries + b''.join(pngs))
print('wrote favicon.ico')
