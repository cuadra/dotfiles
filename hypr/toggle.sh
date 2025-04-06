#!/bin/bash

LAYOUT=$(hyprctl -j getoption general:layout | jq '.str' | sed 's/"//g')
echo "Current layout: $LAYOUT"
case $LAYOUT in
  "master")
    hyprctl keyword general:layout "dwindle"
    ;;
  "dwindle")
    hyprctl keyword general:layout "master"
    ;;
  *) ;;

esac
