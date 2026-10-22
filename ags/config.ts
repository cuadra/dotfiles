// Everything you'd want to tweak lives here.

export const BAR = {
  marginTop: 0, // px from the top of the screen (matches Hyprland gaps_out math)
}

// Visualizer shapes (pixels)
export const VIS = {
  barWidth: 3, // width of each bar
  gap: 2, // space between bars
  height: 26, // max bar height
  minHeight: 2, // height of a bar during silence (keeps a flat line)
  centered: true, // true = bars grow up AND down from the middle
}

export const OUTPUT = {
  bars: 28,
  noiseReduction: 0.77, // 0..1, higher = smoother/slower
}

// Prints mic levels to the terminal once a second (run "ags run ~/.config/ags" to see it)
export const DEBUG_MIC = false

export const MIC = {
  bars: 14,
  noiseReduction: 0.77,
  // The mic uses fixed sensitivity (no auto-leveling) so a hardware-muted
  // QuadCast stays flat. gain boosts the raw signal; gate drops anything
  // below that share of full height and stretches the rest back to full.
  gain: 1.5, // raise if speech barely moves the bars, lower if it often hits the top
  gate: 0.15, // raise if it flickers when quiet, lower if soft speech is cut off
}

// Nerd Font glyphs (same ones Waybar used)
export const ICONS = {
  speaker: ["", "", ""], // low, medium, high
  speakerMuted: "\u{f0581}",
  mic: "",
  micMuted: "",
  divider: "",
  recording: "󰑊", // shown in the bar while recording
}

// ── Dashboard (Super+D) ──────────────────────────────────────────────
export const DASH_ICONS = {
  cpu: "\u{f0ee0}",
  memory: "\u{f035b}",
  disk: "\u{f02ca}",
  gpu: "\u{f08ae}",
  workspace: "\u{f0570}",
  speaker: "\u{f057e}",
  speakerMuted: "\u{f075f}",
  mic: "\u{f036c}",
  micMuted: "\u{f036d}",
  // same icons Waybar used for each layout
  layouts: {
    dwindle: "",
    master: "",
    scrolling: "",
    monocle: "",
  } as Record<string, string>,
}

// Workspaces shown on the dashboard
export const WORKSPACES = [1, 2, 3, 4]

// Layouts shown on the dashboard (same set Super+Tab cycles through)
export const LAYOUTS = [
  { name: "dwindle", icon: "\uf009", description: "binary splits" },
  { name: "master", icon: "\ue8e5", description: "main + stack" },
  { name: "scrolling", icon: "\uf07e", description: "scrolling columns" },
  { name: "monocle", icon: "\uf2d2", description: "one at a time" },
]

// Shortcut tiles. Add one by copying a line.
// "--class floating-term" opens kitty as a regular floating window (Hyprland rule).
export const SHORTCUTS = [
  {
    icon: "",
    label: "Tasks",
    cmd: "kitty --class floating-term --hold task list",
  },
  {
    icon: "",
    label: "Start Postgres",
    cmd: "kitty sudo systemctl start postgresql",
  },
  {
    icon: "",
    label: "Postgres Login",
    cmd: "kitty psql -h localhost -U postgres -d gsktesting",
  },
  {
    // Drag to select an area; click again (or the red bar icon) to stop
    icon: "󰑊",
    label: "Record screen",
    cmd: "bash ~/.config/hypr/record.sh",
  },
]

// ── Notifications ────────────────────────────────────────────────────
export const NOTIFY = {
  width: 500,
  marginTop: 10, // same as the bar, so popups sit level with it
  marginRight: 23, // gap from the right screen edge
  timeout: 2000, // ms, normal notifications (when the app doesn't set one)
  lowTimeout: 5000, // ms, low-priority notifications
  hyprTimeout: 1500, // ms, workspace popups
  // critical notifications stay until dismissed
  closeIcon: "",
}
