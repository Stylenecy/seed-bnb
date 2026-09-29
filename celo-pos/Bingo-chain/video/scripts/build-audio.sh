#!/usr/bin/env bash
# Regenerate the narration track for the demo, using macOS `say`.
# Edit VOICE, the LINES (name|scene-start-ms|text), then run: bash scripts/build-audio.sh
# Background music is the user's mp3 in public/audio, mixed in Demo.tsx at 30%.
# After it finishes, re-render:  pnpm render
set -euo pipefail
cd "$(dirname "$0")/.."

VOICE="${VOICE:-Daniel}"   # any installed voice — see `say -v '?'`
RATE="${RATE:-190}"
SRC="src/audio_src"
OUT="public/audio"
TOTAL_SEC=102               # ≥ composition length
mkdir -p "$SRC" "$OUT"

LINES=(
"landing|400|This is BINGOChain. Strategic, onchain bingo, on Celo. Seal a five by five board before the game begins, call numbers in turn, and let the chain prove every winner. Strategy over luck."
"arenas|15600|Step into the lobby. Each arena is a live table. Choose your stake in LANCE, see the open seats, and claim one."
"create|23500|Open your own table in seconds. Pick a token, set the stake, choose the seats."
"game_build|29500|Now build your board. Drag the numbers in, or auto fill, then seal it, and join the match."
"game_play|36200|The board is your call pad. On each turn, tap a number to call it, onchain. Complete a line, and the meter lights up. B. I. N. G. O. Line them all up, for the win."
"game_win|50700|Bingo! The pot is yours, and every board is revealed, and verifiable."
"cup|55400|Climb the Cup. Compete by volume staked, race the countdown, and rise up the live leaderboard."
"profile|62000|And it's all yours to track. Your stats, your achievements, your LANCE wallet."
"problem|69200|But here's the thing. Most online games ask you to trust the house. Hidden randomness. Opaque winners. Your funds, on their server."
"solution|77600|BINGOChain fixes that. Boards are sealed with commit and reveal, and the chain itself replays every move to verify the winner. No oracle. No cheating."
"whyonchain|86700|Why onchain? Celo's sub cent fees make every call viable. There is no house, and every game is auditable on Celoscan."
"cta|94600|Seal your board. Call the winning line. Claim the pot. Play BINGOChain, now, on Celo."
)

inputs=(); filters=(); labels=(); i=0
for row in "${LINES[@]}"; do
  IFS='|' read -r name off text <<< "$row"
  say -v "$VOICE" -r "$RATE" -o "$SRC/$name.aiff" "$text"
  ffmpeg -y -loglevel error -i "$SRC/$name.aiff" -ar 48000 -ac 1 "$SRC/$name.wav"
  printf "%-12s %5.2fs @ %sms\n" "$name" "$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$SRC/$name.wav")" "$off"
  inputs+=(-i "$SRC/$name.wav")
  filters+=("[$i]adelay=${off}|${off}[a$i];")
  labels+=("[a$i]")
  i=$((i+1))
done

ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex \
 "${filters[*]}${labels[*]}amix=inputs=$i:normalize=0:duration=longest,apad=whole_dur=${TOTAL_SEC},aresample=48000[out]" \
 -map "[out]" -ac 1 "$OUT/narration.wav"

echo "✓ wrote $OUT/narration.wav ($(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$OUT/narration.wav")s) — now run: pnpm render"
