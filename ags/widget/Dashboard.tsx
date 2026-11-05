import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createBinding, createComputed } from "ags"
import { livePoll, setDashboardOpen } from "../lib/scheduler"
import { execAsync } from "ags/process"
import AstalHyprland from "gi://AstalHyprland"
import Gauge from "./dashboard/Gauge"
import Calendar, { resetCalendar } from "./dashboard/Calendar"
import AudioRow from "./dashboard/AudioRow"
import Connectivity from "./dashboard/Connectivity"
import Launcher, { focusLauncher } from "./dashboard/Launcher"
import NotificationList from "./dashboard/NotificationList"
import Packages from "./dashboard/Packages"
import Network from "./dashboard/Network"
import { refreshPackages } from "../lib/packages"
import { refreshNetwork } from "../lib/network"
import Tasks from "./dashboard/Tasks"
import Wallpaper from "./dashboard/Wallpaper"
import { refreshWallpaper } from "../lib/wallpaper"
import { refreshTasks } from "../lib/tasks"
import Weather from "./dashboard/Weather"
import Fans from "./dashboard/Fans"
import Camera from "./dashboard/Camera"
import { refreshWeather } from "../lib/weather"
import { time, ampm, date, week, uptime, updates, updatesJob, refreshUpdates, cpu, memory, disk, temps, gpu } from "../lib/system"
import { speaker, microphone, defaultEndpoint } from "../lib/audio"
import { services } from "../lib/docker"
import { DASH_ICONS as I, SHORTCUTS, WORKSPACES, LAYOUTS } from "../config"

const hypr = AstalHyprland.get_default()
const V = Gtk.Orientation.VERTICAL

function hide() {
  const win = app.get_window("dashboard")
  if (win) win.visible = false
}

// Small uppercase card heading, optional content on the right
function Header({ title, children }: { title: string; children?: JSX.Element | JSX.Element[] }) {
  return (
    <box class="dash-header">
      <label class="dash-title" label={title} hexpand xalign={0} />
      {children}
    </box>
  )
}

// ── Left column ──────────────────────────────────────────────────────
function TimeCard() {
  return (
    <box class="dash-card time-card" orientation={V} spacing={6}>
      <Header title="LOCAL TIME">
        <label class="dash-title" label={week((w) => `WEEK ${w}`)} />
      </Header>
      <box spacing={6}>
        <label class="clock" label={time} />
        <label class="clock-ampm" label={ampm} valign={Gtk.Align.END} />
      </box>
      <label class="clock-date" label={date} xalign={0} />
      <box spacing={8} class="chips">
        <label class="chip" label={uptime((u) => `up ${u}`)} />
        <box
          class={updatesJob.busy((b) => (b ? "chip loading" : "chip"))}
          spacing={6}
          visible={createComputed(() => updates() >= 0 || updatesJob.busy())}
          tooltipText="Pending pacman updates (checked when the dashboard opens, at most every 30 min)"
        >
          <label class="chip-dot" label="●" />
          <label
            label={createComputed(() => {
              const n = updates()
              if (updatesJob.busy()) return "checking updates…"
              return n === 0 ? "up to date" : `${n} update${n === 1 ? "" : "s"}`
            })}
          />
        </box>
      </box>
    </box>
  )
}

// ── Middle column ────────────────────────────────────────────────────
function SystemCard() {
  return (
    <box class="dash-card" orientation={V} spacing={14}>
      <Header title="SYSTEM">
        <box spacing={14}>
          <box spacing={6}>
            <box class="legend-line load" valign={Gtk.Align.CENTER} />
            <label class="legend" label="Load" />
          </box>
          <box spacing={6}>
            <box class="legend-line temp" valign={Gtk.Align.CENTER} />
            <label class="legend" label="Temp" />
          </box>
        </box>
      </Header>
      <box homogeneous spacing={10} vexpand>
        <Gauge label="CPU" load={cpu} temp={temps((t) => t.cpu)} />
        <Gauge label="GPU" load={gpu((g) => g.percent)} temp={temps((t) => t.gpu)} />
        <Gauge label="MEMORY" load={memory((m) => m.percent)} temp={temps((t) => t.memory)} />
        <Gauge label="DISK" load={disk((d) => d.percent)} temp={temps((t) => t.nvme)} />
      </box>
    </box>
  )
}

// ── Right column ─────────────────────────────────────────────────────
function ShortcutsCard() {
  return (
    <box class="dash-card" orientation={V} spacing={14} hexpand>
      <Header title="SHORTCUTS" />
      <box spacing={12}>
        {SHORTCUTS.map((s) => (
          <button
            class="shortcut"
            tooltipText={s.label}
            onClicked={() => {
              hide()
              execAsync(["bash", "-c", `setsid -f ${s.cmd} >/dev/null 2>&1`]) // detached
            }}
          >
            <label label={s.icon} />
          </button>
        ))}
        {/* Postgres / Docker: click to start/stop the service; the dot shows its state */}
        {services.map((svc) => (
          <button
            class={createComputed(() => `shortcut service ${svc.state()}${svc.job.busy() ? " checking" : ""}`)}
            tooltipText={svc.state((d) =>
              ({
                unknown: `Checking ${svc.name}…`,
                running: `${svc.name} running · click to stop`,
                stopped: `${svc.name} stopped · click to start`,
                starting: `Starting ${svc.name}…`,
                stopping: `Stopping ${svc.name}…`,
              })[d],
            )}
            onClicked={() => {
              hide() // the sudo prompt opens in a floating terminal
              svc.toggle()
            }}
          >
            <overlay>
              <label label={svc.icon} />
              <box $type="overlay" class="service-dot" halign={Gtk.Align.END} valign={Gtk.Align.START} />
            </overlay>
          </button>
        ))}
      </box>
    </box>
  )
}

// Workspace dots (active = wide pill, hover = window count) + layout switcher
const workspaceInfo = livePoll(
  WORKSPACES.map((id) => ({ id, windows: 0 })),
  1000,
  () => WORKSPACES.map((id) => ({ id, windows: hypr.workspaces.find((w) => w.id === id)?.clients?.length ?? 0 })),
)
const activeWorkspace = createBinding(hypr, "focusedWorkspace")((w) => w?.id ?? 0)
const layout = livePoll("", 1000, () => {
  try {
    return JSON.parse(hypr.message("j/getoption general:layout")).str as string
  } catch {
    return "?"
  }
})
function setLayout(name: string) {
  hypr.message(`eval hl.config({ general = { layout = "${name}" } })`) // Lua config: no "keyword" request
  execAsync(["notify-send", "-a", "Hyprland", `Layout: ${name}`]) // same popup as Super+Tab
}

function WorkspaceCard() {
  return (
    <box class="ws-row" spacing={12} valign={Gtk.Align.END} vexpand>
      {/* Free-floating under the calendar: workspace dots left, layouts right */}
      <box spacing={8} valign={Gtk.Align.CENTER} hexpand>
        {WORKSPACES.map((id) => {
          const n = workspaceInfo((list) => list.find((w) => w.id === id)?.windows ?? 0)
          // active = wide pill; occupied = brighter dot; empty = faint dot
          const cls = createComputed(() =>
            activeWorkspace() === id ? "ws-dot active" : n() > 0 ? "ws-dot occupied" : "ws-dot",
          )
          return (
            <button
              class={cls}
              valign={Gtk.Align.CENTER}
              tooltipText={n((c) => `Workspace ${id} · ${c} window${c === 1 ? "" : "s"}`)}
              onClicked={() => hypr.message(`dispatch hl.dsp.focus({ workspace = ${id} })`)}
            />
          )
        })}
      </box>
      <box class="ws-divider" valign={Gtk.Align.CENTER} />
      <box class="seg" spacing={2} homogeneous>
        {LAYOUTS.map((l) => (
          <button
            class={layout((cur) => (cur === l.name ? "seg-btn active" : "seg-btn"))}
            tooltipText={`${l.name} · ${l.description}`}
            onClicked={() => setLayout(l.name)}
          >
            <label label={l.icon} halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} hexpand vexpand />
          </button>
        ))}
      </box>
    </box>
  )
}

// Short device names: "...(HDMI 2) [XG32UCG]" -> "XG32UCG · HDMI 2"
function deviceName(kind: "output" | "mic") {
  const d = defaultEndpoint(kind)?.description ?? ""
  const hdmi = d.match(/\((HDMI[^)]*)\) \[([^\]]*)\]/)
  return hdmi ? `${hdmi[2]} · ${hdmi[1]}` : d.replace(/ Audio Controller| Digital Stereo| Analog Stereo/g, "")
}
const outputName = livePoll("", 3000, () => deviceName("output"))
const inputName = livePoll("", 3000, () => deviceName("mic"))

function AudioCard({ title, device, children }: { title: string; device: any; children: JSX.Element }) {
  return (
    <box class="dash-card" orientation={V} spacing={12}>
      <Header title={title}>
        <label class="dash-meta" label={device} />
      </Header>
      {children}
    </box>
  )
}

// ── Window ───────────────────────────────────────────────────────────
export default function Dashboard(gdkmonitor: Gdk.Monitor) {
  return (
    <window
      name="dashboard"
      namespace="ags-dashboard"
      class="Dashboard"
      gdkmonitor={gdkmonitor}
      // Covers the whole screen (dim backdrop); the dashboard is centered on it.
      // EXCLUSIVE keyboard so Esc reaches us.
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
      layer={Astal.Layer.OVERLAY}
      keymode={Astal.Keymode.EXCLUSIVE}
      exclusivity={Astal.Exclusivity.IGNORE}
      application={app}
      visible={false}
      $={(self) =>
        self.connect("notify::visible", () => {
          // Live readings (clock, gauges, workspaces, ...) run only while open
          setDashboardOpen(self.visible)
          if (!self.visible) return
          resetCalendar()
          focusLauncher()
          refreshWallpaper() // reads hyprpaper.conf; thumbnail only re-decoded if it changed
          // Queued one at a time, in this order (cheapest / most visible first)
          services.forEach((svc) => svc.refresh())
          refreshNetwork()
          refreshTasks()
          refreshWeather() // Open-Meteo, at most every 30 min (config.ts)
          refreshPackages() // only managers whose count is stale (config.ts)
          refreshUpdates() // checkupdates, at most every 30 min
        })
      }
    >
      <Gtk.EventControllerKey
        onKeyPressed={(_, keyval) => {
          if (keyval === Gdk.KEY_Escape) {
            hide()
            return true
          }
          return false
        }}
      />
      <box class="backdrop" hexpand vexpand>
        {/* Clicking the dimmed area (not the dashboard itself) closes it */}
        <Gtk.GestureClick
          onPressed={(self, _n, x, y) => {
            const backdrop = self.get_widget()!
            if (backdrop.pick(x, y, Gtk.PickFlags.DEFAULT) === backdrop) hide()
          }}
        />
        <box class="dash" orientation={V} spacing={14} halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
          {/* App launcher across the top */}
          <Launcher onLaunch={hide} />
          <box spacing={14}>
            {/* Left: time, calendar, workspaces + layouts (no card), camera, wallpaper */}
            <box orientation={V} spacing={14} widthRequest={260}>
              <TimeCard />
              <Calendar />
              <Tasks onOpen={hide} />
              <WorkspaceCard />
              <Camera />
              <Wallpaper onOpen={hide} />
            </box>
            {/* Middle: system (4 gauges in a row), shortcuts, output, input */}
            <box orientation={V} spacing={14} hexpand>
              <SystemCard />
              <Fans />
              {/* Shortcuts with the Bluetooth toggle beside it */}
              <box spacing={14} homogeneous>
                <ShortcutsCard />
                <Connectivity />
              </box>
              {/* Package managers + network details (read on open, not polled) */}
              <box spacing={14} homogeneous>
                <Packages />
                <Network />
              </box>
              <AudioCard title="OUTPUT" device={outputName}>
                <AudioRow ep={speaker} name="Speaker" icon={I.speaker} iconMuted={I.speakerMuted} />
              </AudioCard>
              <AudioCard title="INPUT" device={inputName}>
                <AudioRow ep={microphone} name="Microphone" icon={I.mic} iconMuted={I.micMuted} />
              </AudioCard>
            </box>
            {/* Right: notification history */}
            <box orientation={V} spacing={14} widthRequest={320} hexpand={false}>
              <NotificationList />
            </box>
          </box>
          {/* 7-day forecast across the bottom */}
          <Weather />
        </box>
      </box>
    </window>
  )
}
