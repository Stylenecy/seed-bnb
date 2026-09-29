"""cermin voice-over: edge-tts (en-GB-RyanNeural) → silence-trim → -12 LUFS → m4a.

    <venv-tts>/bin/python scripts/cermin/vo.py [line-id ...]

Writes public/cermin/vo/<id>.m4a and src/projects/cermin/vo.gen.ts (measured
durations). Placement on the beat grid lives in src/projects/cermin/Main.tsx.
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
OUT = os.path.join(ROOT, "public", "cermin", "vo")
GEN = os.path.join(ROOT, "src", "projects", "cermin", "vo.gen.ts")
VOICE = "en-GB-RyanNeural"
LUFS = -12
GAP = 0.32  # max inner pause (s)

# id, text, rate, pitch — per-line tuning (energy up on the hits, calmer on the explainers).
LINES = [
    ("hook", "You hold BNB. Rent's due, so you sell it… and then it pumps.", "+6%", "+0Hz"),
    ("never", "What if you never had to sell?", "+4%", "+2Hz"),
    ("intro", "This is Cermin: self-driving banking for native BNB.", "+2%", "-1Hz"),
    ("how", "Lock BNB once, in your own vault. It borrows a stablecoin against it: cash, without selling.", "+10%", "-2Hz"),
    ("dips", "Dip? It defends.", "+4%", "+0Hz"),
    ("rises", "Rise? It skims.", "+4%", "+2Hz"),
    ("app", "It's live on BSC testnet. Connect a wallet, and choose your BNB.", "+8%", "-1Hz"),
    ("setup", "Pick a goal and a risk profile. Balanced borrows at fifty percent.", "+8%", "-1Hz"),
    ("sign", "Review, then sign once. One transaction opens the vault.", "+6%", "-1Hz"),
    ("vault", "A real vault: point-oh-four BNB locked, twelve hundred dollars to spend.", "+10%", "-1Hz"),
    ("pump", "The mock feed jumps ten percent…", "+8%", "+2Hz"),
    ("skim", "and the keeper skims it.", "+8%", "+3Hz"),
    ("dip", "Then BNB crashes below the defense line.", "+10%", "-3Hz"),
    ("defend", "Defend repays debt from the vault's own savings…", "+10%", "-1Hz"),
    ("safe", "back to its line, far from liquidation.", "+8%", "+0Hz"),
    ("anyone", "Defend is permissionless: anyone can call it.", "+10%", "+1Hz"),
    ("withdraw", "Withdraw it anywhere. Your BNB stays put.", "+10%", "-1Hz"),
    ("close", "Close it: your BNB comes back.", "+4%", "+1Hz"),
    ("proof", "All of it real, on BSC testnet. The price feed is a testnet mock; the Chainlink adapter is verified on the live feed.", "+10%", "-1Hz"),
    ("stats", "Borrowed without selling. Defended before liquidation. Every coin returned.", "+6%", "+0Hz"),
    ("outro", "Cermin. Your BNB stays whole.", "-2%", "-2Hz"),
]


def run(cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


def duration(path):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).stdout.strip())


async def synth(text, rate, pitch, path):
    await edge_tts.Communicate(text, VOICE, rate=rate, pitch=pitch).save(path)


def build(lid, text, rate, pitch, tmp):
    raw = os.path.join(tmp, f"{lid}.mp3")
    asyncio.run(synth(text, rate, pitch, raw))
    trimmed = os.path.join(tmp, f"{lid}-trim.wav")
    # Trim leading + trailing silence (reverse trick), keep a 30 ms edge; edge-tts puts
    # ~1 s pauses between sentences, so squeeze inner pauses down to GAP s.
    trim = (
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,"
        f"silenceremove=stop_periods=-1:stop_duration={GAP}:stop_silence={GAP}:stop_threshold=-45dB,"
        "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse"
    )
    run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-af", trim, "-ar", "48000", "-ac", "1", trimmed])
    # -12 LUFS integrated with a -1 dBFS ceiling: speech is too peaky for a purely
    # linear gain, so iterate gain → soft limiter → re-measure until within 0.3 LU.
    out = os.path.join(OUT, f"{lid}.m4a")
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
    run(["ffmpeg", "-y", "-v", "error", "-i", cur, "-ac", "1", "-c:a", "aac", "-b:a", "160k", out])
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[1:])
    with tempfile.TemporaryDirectory() as tmp:
        for lid, text, rate, pitch in LINES:
            if only and lid not in only:
                continue
            out = build(lid, text, rate, pitch, tmp)
            print(f"{lid:9s} {duration(out):5.2f}s  {text}")
    durs = {lid: round(duration(os.path.join(OUT, f"{lid}.m4a")), 3) for lid, *_ in LINES}
    texts = {lid: t for lid, t, *_ in LINES}
    with open(GEN, "w") as f:
        f.write("// generated by scripts/cermin/vo.py — do not edit\n")
        f.write("export const VO_LINES = {\n")
        for lid, *_ in LINES:
            f.write(f"  {lid}: {{ file: \"cermin/vo/{lid}.m4a\", dur: {durs[lid]}, text: {json.dumps(texts[lid])} }},\n")
        f.write("} as const;\nexport type VoId = keyof typeof VO_LINES;\n")


if __name__ == "__main__":
    main()
