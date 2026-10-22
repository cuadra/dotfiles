#!/bin/bash
# Screen recording toggle (wl-screenrec + slurp). Saves to ~/Videos/Recordings.
#   record.sh        -> drag to select an area and start recording; run again to stop
#   record.sh full   -> record the whole screen
#   record.sh stop   -> stop the current recording
# Used by Super+Shift+R, the dashboard's Record shortcut and the red icon in the bar.
# Records what you hear (the default output). Errors go to ~/.config/hypr/record.log

dir="$HOME/Videos/Recordings"
log="$HOME/.config/hypr/record.log"

# Already recording? Stop it (SIGINT lets wl-screenrec finish the file cleanly).
if pgrep -x wl-screenrec >/dev/null; then
  pkill -INT -x wl-screenrec
  while pgrep -x wl-screenrec >/dev/null; do sleep 0.2; done
  notify-send -a Recorder "Recording saved" "$(ls -t "$dir" | head -1)"
  exit 0
fi
[ "$1" = "stop" ] && exit 0

command -v wl-screenrec >/dev/null || { notify-send -a Recorder -u critical "wl-screenrec is not installed"; exit 1; }

mkdir -p "$dir"
file="$dir/recording-$(date +%Y-%m-%d_%H-%M-%S).mp4"

# Audio: the monitor of the default output, i.e. whatever is playing
audio=(--audio --audio-device "$(pactl get-default-sink).monitor")

if [ "$1" = "full" ]; then
  area=()
else
  geometry=$(slurp) || exit 0 # Esc cancels the selection
  area=(-g "$geometry")
fi

{
  echo "=== $(date) ==="
  echo "wl-screenrec ${area[*]} ${audio[*]} -f $file"
} >"$log"
setsid -f wl-screenrec "${area[@]}" "${audio[@]}" -f "$file" >>"$log" 2>&1

# If it died right away, say so instead of failing silently
sleep 1.5
if ! pgrep -x wl-screenrec >/dev/null; then
  notify-send -a Recorder -u critical "Recording failed" "Details in ~/.config/hypr/record.log"
fi
