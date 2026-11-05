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

// Taskwarrior card (left column). Read once each time the dashboard opens.
export const TASKS = {
  limit: 5, // most urgent pending tasks shown
  // Clicking a task's text opens its details; {uuid} is replaced
  info: "kitty --class floating-term --hold task {uuid} info",
  // Clicking "all" in the header
  list: "kitty --class floating-term --hold task list",
}

// Start/stop tiles (after the shortcuts above): Postgres, then Docker.
// The dot turns teal while the service is running; click to toggle it.
export const POSTGRES = {
  name: "Postgres",
  icon: "", // nf-dev-postgresql
  unit: "postgresql",
  start: "kitty --class floating-term sudo systemctl start postgresql",
  stop: "kitty --class floating-term sudo systemctl stop postgresql",
  pollMs: 3000,
}

// Stopping Docker also stops docker.socket, otherwise any docker
// command would wake the daemon straight back up.
export const DOCKER = {
  name: "Docker",
  icon: "\u{f0868}", // nf-md-docker
  unit: "docker",
  start: "kitty --class floating-term sudo systemctl start docker",
  stop: "kitty --class floating-term sudo systemctl stop docker.socket docker.service",
  pollMs: 3000,
}

// Package counts. Nothing is polled: they're counted once when AGS starts,
// then again when the dashboard opens if the last count is older than
// refreshMinutes (or when you click the refresh icon on the card).
// A row only shows when its "when" shell test succeeds (the manager is
// installed). "count" must print a single number. Add one by copying a line.
export const PACKAGES = {
  refreshMinutes: 10,
  managers: [
    { name: "pacman", icon: "\u{f08c7}", when: "command -v pacman", count: "pacman -Qnq | wc -l", tooltip: "Packages from the Arch repos" },
    { name: "AUR", icon: "\u{f03d6}", when: "command -v paru || command -v yay", count: "pacman -Qmq | wc -l", tooltip: "Foreign packages (AUR / built locally)" },
    { name: "Flatpak", icon: "", when: "command -v flatpak", count: "flatpak list --app --columns=application | wc -l", tooltip: "Flatpak apps (runtimes not counted)" },
    { name: "Snap", icon: "", when: "command -v snap", count: "snap list 2>/dev/null | tail -n +2 | wc -l", tooltip: "Snap packages" },
    { name: "npm", icon: "\u{f06f7}", when: "command -v npm", count: "npm ls -g --depth=0 --parseable 2>/dev/null | tail -n +2 | wc -l", tooltip: "Global npm packages" },
    { name: "pipx", icon: "\u{f0320}", when: "command -v pipx", count: 'ls -1 "$(pipx environment --value PIPX_LOCAL_VENVS)" 2>/dev/null | wc -l', tooltip: "Python apps installed with pipx" },
    { name: "uv", icon: "\u{f0320}", when: "command -v uv", count: 'ls -1 "$(uv tool dir)" 2>/dev/null | wc -l', tooltip: "Python tools installed with uv tool" },
    { name: "Cargo", icon: "\u{f1617}", when: "command -v cargo", count: "cargo install --list | grep -c '^[^ ]' || true", tooltip: "Crates installed with cargo install" },
    { name: "Go", icon: "\u{f07d3}", when: "command -v go", count: 'ls -1 "$(go env GOPATH)/bin" 2>/dev/null | wc -l', tooltip: "Binaries installed with go install" },
    // { name: "gem", icon: "\u{f0d2d}", when: "command -v gem", count: "gem list --no-versions | wc -l", tooltip: "Ruby gems (includes Ruby's default gems)" },
    // { name: "Homebrew", icon: "\u{f03d7}", when: "command -v brew", count: "brew list --formula | wc -l", tooltip: "Homebrew formulae" },
  ] as { name: string; icon: string; when: string; count: string; tooltip?: string }[],
}

// Weather row (bottom of the dashboard), from Open-Meteo: free, no API key.
// Fetched when the dashboard opens, only if older than refreshMinutes
// (or on a new day, or when you click the refresh icon on the card).
// Find coordinates for another place at https://open-meteo.com/en/docs
export const WEATHER = {
  place: "Cary, NC", // label in the card header only
  latitude: 35.7915,
  longitude: -78.7811,
  unit: "F" as "F" | "C",
  refreshMinutes: 30,
}

// Fan speeds (middle column, under System). Read from the motherboard's
// sensor chip (it87 driver from the AUR: it87-dkms-git), every pollMs while
// the dashboard is open. `index` is the N in /sys/class/hwmon/*/fanN_input.
// A fan reading 0 RPM is shown as "Stopped".
export const FANS = {
  board: "Motherboard", // placeholder: shown in the card header
  chip: "it8689", // start of the hwmon sensor name
  pollMs: 3000,
  fans: [
    { index: 1, name: "Case fan 1" },
    { index: 2, name: "Case fan 2" },
    { index: 3, name: "Case fan 3" },
  ],
}

// Webcam preview (left column, above the wallpaper). The camera only runs
// while the dashboard is open. Find your device with: v4l2-ctl --list-devices
// (use the first /dev/videoN listed under your webcam).
export const CAMERA = {
  enabled: true,
  device: "/dev/video0",
  height: 146, // preview height in px (16:9 at the left column's width)
  maxWidth: 640, // capture size cap; the preview is small, so this saves CPU
  mirror: true, // flip horizontally, like a mirror
}

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

// Teams notifications (Teams runs in Zen) get their own icon and highlight
// in the dashboard list. See isTeams() in widget/dashboard/NotificationList.tsx
export const TEAMS = {
  browser: /zen/i, // notification comes from this app (name, desktop entry or icon)
  match: /teams/i, // …and mentions this (app name, desktop entry, summary or body)
  allFromBrowser: false, // true = treat every notification from the browser as Teams
  icon: "\u{f02bb}",
}
