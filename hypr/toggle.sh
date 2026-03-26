#!/bin/bash

LAYOUT=$(hyprctl -j getoption general:layout | jq '.str' | sed 's/"//g')
echo "Current layout: $LAYOUT"
case $LAYOUT in
  "master")
    hyprctl keyword general:layout "scrolling"
    notify-send -a Hyprland 'Layout changed to Scrolling'
    ;;
  "scrolling")
    hyprctl keyword general:layout "monocle"
    notify-send -a Hyprland 'Layout changed to Monocle'
    ;;
  "monocle")
    hyprctl keyword general:layout "dwindle"
    notify-send -a Hyprland 'Layout changed to Dwindle'
    ;;
  "dwindle")
    hyprctl keyword general:layout "master"
    notify-send -a Hyprland 'Layout changed to Master'
    ;;
  *) ;;

esac
