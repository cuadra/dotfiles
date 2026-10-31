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
