#!/bin/bash

LAYOUT=$(hyprctl -j getoption general:layout | jq '.str' | sed 's/"//g')
echo "Current layout: $LAYOUT"
case $LAYOUT in
  "master")
    hyprctl keyword general:layout "scrolling"
    ;;
  "scrolling")
    hyprctl keyword general:layout "monocle"
    ;;
  "monocle")
    hyprctl keyword general:layout "dwindle"
    ;;
  "dwindle")
    hyprctl keyword general:layout "master"
    ;;
  *) ;;

esac

# Announce the new layout
NEW=$(hyprctl -j getoption general:layout | jq -r '.str')
notify-send -a Hyprland -t 1500 -r 9102 \
  -h string:x-canonical-private-synchronous:hypr-layout \
  "Layout: $NEW"
