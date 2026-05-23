#!/bin/bash

# Fetch current layout
LAYOUT=$(hyprctl getoption general:layout -j | jq -r '.str')

# Output JSON for Waybar
# text = the word displayed
# alt = tells Waybar which icon to pick
# class = lets you colorize specific layouts in style.css
echo "{\"text\": \"$LAYOUT\", \"alt\": \"$LAYOUT\", \"class\": \"$LAYOUT\"}"
