"""Tile stills into a 2-column contact sheet: python3 scripts/contact.py out.png a.png b.png …"""
import sys
from PIL import Image
out, fs = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).resize((960, 540)) for f in fs]
rows = (len(ims) + 1) // 2
o = Image.new("RGB", (1920, 540 * rows))
for i, im in enumerate(ims):
    o.paste(im, ((i % 2) * 960, (i // 2) * 540))
o.save(out)
