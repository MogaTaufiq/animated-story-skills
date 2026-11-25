# Contact sheet of stills: python3 scripts/sheet.py out.jpg a.jpg b.jpg ... (4 columns, frame number captioned)
import sys, os
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f) for f in files]
w, h = ims[0].size; cols = 4; rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * h), "black")
for i, (im, f) in enumerate(zip(ims, files)):
    x, y = (i % cols) * w, (i // cols) * h
    sheet.paste(im.resize((w, h)), (x, y))
    ImageDraw.Draw(sheet).text((x + 6, y + 6), os.path.basename(f), fill="white")
sheet.save(out, quality=85)
