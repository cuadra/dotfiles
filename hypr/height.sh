#!/bin/bash
# Toggle tiled windows between full height and a centered 1080px band.
# Band mode also caps a lone window at one column width instead of full width.

TOP=$(hyprctl -j getoption general:gaps_out | jq -r '.custom' | awk '{print $1}')

if [ "$TOP" = "535" ]; then
  # Back to normal
  hyprctl --batch "keyword general:gaps_out 40,20,20,20 ; \
                   keyword plugin:hyprscrolling:fullscreen_on_one_column true"
  MSG="Height: full"
else
  # 2160 - 535 - 535 = 1090, minus gaps_in (5 top + 5 bottom) = 1080
  hyprctl --batch "keyword general:gaps_out 535,20,535,20 ; \
                   keyword plugin:hyprscrolling:fullscreen_on_one_column false"
  MSG="Height: 1080 band"
fi

notify-send -a Hyprland -t 1500 -r 9103 \
  -h string:x-canonical-private-synchronous:hypr-height \
  "$MSG"
