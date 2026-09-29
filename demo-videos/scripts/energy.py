"""Print a per-bar normalised energy map for a track (paste into src/kit/tracks.ts).
usage: python3 scripts/energy.py public/music/<file>.mp3 <bpm> <first-beat-s>"""
import sys, subprocess, numpy as np
path, bpm, off = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "11025", "-f", "s16le", "-"], capture_output=True).stdout
a = np.frombuffer(raw, dtype=np.int16).astype(float) / 32768
sr = 11025; bar = 4 * 60 / bpm
vals = []; k = 0
while True:
    s = int((off + k * bar) * sr); e = int((off + (k + 1) * bar) * sr)
    if s >= len(a): break
    seg = a[s:min(e, len(a))]; vals.append(float(np.sqrt((seg ** 2).mean()))); k += 1
m = max(vals)
print(", ".join("{ t: %.2f, e: %.2f }" % (off + i * bar, min(1, v / m) ** 1.5) for i, v in enumerate(vals)))
