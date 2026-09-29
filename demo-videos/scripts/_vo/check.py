"""Mix check for a VO render (plain python3, needs ffmpeg/ffprobe).

    python3 scripts/_vo/check.py out/<slug>-vo.mp4 [out/<slug>.mp4] [--limit]

Prints integrated loudness (target -13…-11 LUFS), true peak (≤ -0.5 dBFS),
silences > 1 s, and the duration (must equal the no-VO cut when given).
--limit: if the true peak is over, re-encode ONLY the audio through a
-1 dBTP limiter in place (video stream copied untouched).
"""
import os
import re
import subprocess
import sys


def sh(cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


def dur(p):
    return float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).stdout)


def loud(p):
    e = sh(["ffmpeg", "-hide_banner", "-i", p, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    summ = e[e.rfind("Summary:"):]
    return float(re.search(r"I:\s+(-?[\d.]+)", summ).group(1)), float(re.search(r"Peak:\s+(-?[\d.]+|-inf)", summ).group(1))


def silences(p):
    e = sh(["ffmpeg", "-hide_banner", "-i", p, "-vn", "-af", "silencedetect=n=-45dB:d=1", "-f", "null", "-"]).stderr
    starts = re.findall(r"silence_start: ([\d.]+)", e)
    ends = re.findall(r"silence_end: ([\d.]+)", e)
    return list(zip(starts, ends + ["end"] * (len(starts) - len(ends))))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit(__doc__)
    vo = args[0]
    i, tp = loud(vo)
    if tp > -0.5 and "--limit" in sys.argv:
        tmp = vo + ".lim.mp4"
        sh(["ffmpeg", "-y", "-v", "error", "-i", vo, "-map", "0", "-c:v", "copy", "-af",
            "alimiter=limit=0.84:attack=2:release=50:level=disabled", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", tmp])
        os.replace(tmp, vo)
        print("limited audio in place")
        i, tp = loud(vo)
    ok_i = -13.0 <= i <= -11.0
    print(f"integrated {i:.1f} LUFS {'OK' if ok_i else 'OUT OF -13…-11'} · true peak {tp:.1f} dBFS {'OK' if tp <= -0.5 else 'OVER -0.5'}")
    s = silences(vo)
    print("silences >1s:", ", ".join(f"{a}→{b}" for a, b in s) or "none")
    d = dur(vo)
    if len(args) > 1:
        r = dur(args[1])
        print(f"duration {d:.3f}s vs no-VO {r:.3f}s {'OK' if abs(d - r) < 0.05 else 'MISMATCH'}")
    else:
        print(f"duration {d:.3f}s")


if __name__ == "__main__":
    main()
