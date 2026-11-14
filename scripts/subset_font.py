"""Build the self-hosted Bricolage Grotesque subset used by the standalone app.

Usage: python subset_font.py <BricolageGrotesque[opsz,wdth,wght].ttf> <out.woff2>

Keeps the optical-size axis (12-96) and weights 400-800, pins width to normal,
and keeps only Latin characters (Spanish and English text, punctuation).
"""
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

UNICODES = "U+0020-007E,U+00A0-00FF,U+0152-0153,U+2013-2014,U+2018-201E,U+2022,U+2026,U+20AC,U+2192"

src, out = sys.argv[1], sys.argv[2]
font = instancer.instantiateVariableFont(TTFont(src), {"opsz": (12, 96), "wght": (400, 800), "wdth": 100})
opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk", "tnum", "case"]
opts.name_IDs = ["*"]
opts.notdef_outline = True
sub = subset.Subsetter(opts)
sub.populate(unicodes=subset.parse_unicodes(UNICODES))
sub.subset(font)
font.flavor = "woff2"
font.save(out)
