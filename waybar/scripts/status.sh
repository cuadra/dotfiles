#!/bin/bash

status=$(hyprctl activewindow | grep 'class:' | awk '{print $2}')
#title=$(hyprctl activewindow | grep 'title:' | awk '{print $2}')
#title=$(hyprctl activewindow -j | jq '.title')

case $status in
  "com.mitchellh.ghostty")
    status="󰊠   Ghostty"
    ;;
  "kitty")
    status="󰄛   Kitty"
    ;;
  "")
    status=" Desktop"
    ;;
  *)
    status=""
    ;;
esac


echo "$status"
