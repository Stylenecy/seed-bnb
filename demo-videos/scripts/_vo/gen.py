"""Generic voice-over generator: edge-tts → silence-trim → -12 LUFS → m4a.

    <venv-tts>/bin/python scripts/_vo/gen.py <slug> [line-id ...]

Reads   scripts/<slug>/vo.lines        one line per VO clip:  id | rate | pitch | text
                                        ('#' comments, blank lines ok; optional
                                        'voice = en-GB-RyanNeural' directive)
Writes  public/<slug>/vo/<id>.m4a       (only the ids given, or all)
        src/projects/<slug>/vo.gen.ts   VO_LINES {file, dur, text} + VoId (always, all lines)

Durations are measured with ffprobe. Placement on the beat grid lives in the
project's Main.tsx (placeVo / VoTrack / duckFor from the kit — see KIT.md).
"""
import asyncio
import json
import os
import re
import subprocess
import sys
import tempfile

import edge_tts

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DEFAULT_VOICE = "en-GB-RyanNeural"
LUFS = -12
GAP = 0.32  # max inner pause kept between sentences (s)


def run(cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


def duration(path):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).stdout.strip())


def parse_lines(path):
    voice, lines = DEFAULT_VOICE, []
    with open(path, encoding="utf-8") as f:
        for n, raw in enumerate(f, 1):
            s = raw.strip()
            if not s or s.startswith("#"):
                continue
            m = re.match(r"voice\s*=\s*(\S+)$", s)
            if m:
                voice = m.group(1)
                continue
            parts = [p.strip() for p in s.split("|", 3)]
            if len(parts) != 4 or not re.fullmatch(r"[a-z][a-z0-9_]*", parts[0]):
                sys.exit(f"{path}:{n}: expected 'id | rate | pitch | text' with a snake_case id, got: {s}")
            lid, rate, pitch, text = parts
            if not re.fullmatch(r"[+-]\d+%", rate) or not re.fullmatch(r"[+-]\d+Hz", pitch):
                sys.exit(f"{path}:{n}: rate like +6% and pitch like -1Hz, got {rate!r} {pitch!r}")
            lines.append((lid, rate, pitch, text))
    ids = [l[0] for l in lines]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        sys.exit(f"{path}: duplicate ids {sorted(dup)}")
    return voice, lines


def build(voice, lid, text, rate, pitch, out_dir, tmp):
    raw = os.path.join(tmp, f"{lid}.mp3")
    asyncio.run(edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(raw))
    trimmed = os.path.join(tmp, f"{lid}-trim.wav")
    # Trim leading + trailing silence (reverse trick), keep a 30 ms edge; edge-tts
    # leaves ~1 s pauses between sentences, so squeeze inner pauses down to GAP s.
    trim = (
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,"
        f"silenceremove=stop_periods=-1:stop_duration={GAP}:stop_silence={GAP}:stop_threshold=-45dB,"
        "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse"
    )
    run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-af", trim, "-ar", "48000", "-ac", "1", trimmed])
    # -12 LUFS integrated with a ~-1 dBFS ceiling: speech is peaky, so iterate
    # gain → soft limiter → re-measure until within 0.3 LU.
    cur = trimmed
    for i in range(4):
        m = run(["ffmpeg", "-hide_banner", "-i", cur, "-af", "ebur128", "-f", "null", "-"]).stderr
        integ = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", m)[-1])
        if abs(integ - LUFS) <= 0.3:
            break
        nxt = os.path.join(tmp, f"{lid}-g{i}.wav")
        run(["ffmpeg", "-y", "-v", "error", "-i", cur, "-af",
             f"volume={LUFS - integ:.2f}dB,alimiter=limit=0.89:attack=3:release=60:level=disabled", "-ar", "48000", nxt])
        cur = nxt
    out = os.path.join(out_dir, f"{lid}.m4a")
    run(["ffmpeg", "-y", "-v", "error", "-i", cur, "-ac", "1", "-c:a", "aac", "-b:a", "160k", out])
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    slug, only = sys.argv[1], set(sys.argv[2:])
    src = os.path.join(ROOT, "scripts", slug, "vo.lines")
    proj = os.path.join(ROOT, "src", "projects", slug)
    if not os.path.isfile(src):
        sys.exit(f"missing {src}")
    if not os.path.isdir(proj):
        sys.exit(f"missing {proj}")
    voice, lines = parse_lines(src)
    unknown = only - {l[0] for l in lines}
    if unknown:
        sys.exit(f"unknown ids: {sorted(unknown)}")
    out_dir = os.path.join(ROOT, "public", slug, "vo")
    os.makedirs(out_dir, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for lid, rate, pitch, text in lines:
            if only and lid not in only:
                continue
            out = build(voice, lid, text, rate, pitch, out_dir, tmp)
            print(f"{lid:10s} {duration(out):5.2f}s  {text}")
    missing = [l[0] for l in lines if not os.path.isfile(os.path.join(out_dir, f"{l[0]}.m4a"))]
    if missing:
        sys.exit(f"not generated yet: {missing} (run without ids)")
    with open(os.path.join(proj, "vo.gen.ts"), "w") as f:
        f.write(f"// generated by scripts/_vo/gen.py {slug} from scripts/{slug}/vo.lines ({voice}) — do not edit\n")
        f.write("export const VO_LINES = {\n")
        for lid, _r, _p, text in lines:
            dur = round(duration(os.path.join(out_dir, f"{lid}.m4a")), 3)
            f.write(f"  {lid}: {{ file: \"{slug}/vo/{lid}.m4a\", dur: {dur}, text: {json.dumps(text)} }},\n")
        f.write("} as const;\nexport type VoId = keyof typeof VO_LINES;\n")
    print(f"wrote src/projects/{slug}/vo.gen.ts ({len(lines)} lines)")


if __name__ == "__main__":
    main()
