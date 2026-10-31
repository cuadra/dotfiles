import AstalWp from "gi://AstalWp"
import AstalCava from "gi://AstalCava"
import { execAsync } from "ags/process"
import { OUTPUT, MIC, DEBUG_MIC } from "../config"

const wp = AstalWp.get_default()!

// These always mirror the current system default devices
export const speaker = wp.defaultSpeaker
export const microphone = wp.defaultMicrophone

export type Kind = "output" | "mic"

// ── Visualizer instances ─────────────────────────────────────────────
// A cava instance is only created once its device name is known, and is
// never re-pointed while running (changing `source` on a live instance
// crashes). When the device changes, the old one is stopped and a new one
// is created.
//
// To save CPU/GPU, an instance only exists while it has something to show:
//   output — an app is playing audio (a playback stream is RUNNING) and the
//            speaker isn't muted
//   mic    — the microphone isn't muted (a hardware mute on the QuadCast
//            can't be seen from here; the bars just stay flat then, and the
//            Visualizer skips redraws while nothing changes)
// Starting is instant; stopping waits STOP_DELAY_MS so short gaps (track
// changes, a quick pause) don't tear the instance down and rebuild it.
const current: Record<Kind, { cava: AstalCava.Cava; source: string } | null> = {
  output: null,
  mic: null,
}
const listeners: Record<Kind, Set<() => void>> = { output: new Set(), mic: new Set() }

// The default-device objects don't carry a device name, so look the device up
// in the full device list (by its "default" flag), falling back to pactl.
export function defaultEndpoint(kind: Kind): AstalWp.Endpoint | null {
  const list = kind === "output" ? wp.audio.speakers : wp.audio.microphones
  return list?.find((ep) => ep.isDefault) ?? null
}

function defaultName(kind: Kind): string | null {
  return defaultEndpoint(kind)?.name ?? null
}

async function wantedSource(kind: Kind): Promise<string | null> {
  let name = defaultName(kind)
  if (!name) {
    try {
      name = (await execAsync(kind === "output" ? "pactl get-default-sink" : "pactl get-default-source")).trim()
    } catch {
      name = null
    }
  }
  if (!name) return null
  return kind === "output" ? `${name}.monitor` : name
}

function create(kind: Kind, source: string) {
  const cfg = kind === "output" ? OUTPUT : MIC
  const cava = new AstalCava.Cava({
    bars: cfg.bars,
    input: AstalCava.Input.PULSE,
    source,
    // output auto-levels; mic uses fixed sensitivity (see MIC in config.ts)
    autosens: kind === "output",
    stereo: false,
    noise_reduction: cfg.noiseReduction,
    framerate: 60,
  })
  cava.connect("notify::values", () => listeners[kind].forEach((fn) => fn()))
  return cava
}

const STOP_DELAY_MS = 1500

// Should this visualizer be running right now?
function wanted(kind: Kind): boolean {
  if (kind === "mic") return !microphone.mute
  if (speaker.mute) return false
  return (wp.audio?.streams ?? []).some((s) => s.state === AstalWp.NodeState.RUNNING)
}

function stop(kind: Kind) {
  const c = current[kind]
  if (!c) return
  c.cava.active = false
  current[kind] = null
  console.log(`[audio] ${kind} visualizer paused`)
  listeners[kind].forEach((fn) => fn()) // one last redraw: flat bars
}

const busy: Record<Kind, boolean> = { output: false, mic: false }
const again: Record<Kind, boolean> = { output: false, mic: false }

async function sync(kind: Kind) {
  if (busy[kind]) {
    again[kind] = true // re-run once the current check finishes
    return
  }
  busy[kind] = true
  try {
    if (!wanted(kind)) return stop(kind)
    const source = await wantedSource(kind)
    if (!source || current[kind]?.source === source) return
    stop(kind) // device changed: stop the old one
    current[kind] = { cava: create(kind, source), source }
    console.log(`[audio] ${kind} visualizer listening to ${source}`)
  } finally {
    busy[kind] = false
    if (again[kind]) {
      again[kind] = false
      sync(kind)
    }
  }
}

// Start right away when wanted; stop after a short delay when not
const stopTimer: Record<Kind, ReturnType<typeof setTimeout> | null> = { output: null, mic: null }
function update(kind: Kind) {
  if (wanted(kind)) {
    if (stopTimer[kind]) clearTimeout(stopTimer[kind]!)
    stopTimer[kind] = null
    sync(kind)
  } else if (current[kind] && !stopTimer[kind]) {
    stopTimer[kind] = setTimeout(() => {
      stopTimer[kind] = null
      sync(kind)
    }, STOP_DELAY_MS)
  }
}

// Event-driven: playback streams starting/stopping and mute changes
let hooked = false
function hook() {
  const audio = wp.audio
  if (hooked || !audio) return
  hooked = true
  const watch = (s: AstalWp.Stream) => s.connect("notify::state", () => update("output"))
  audio.streams?.forEach(watch)
  audio.connect("stream-added", (_a, s) => {
    watch(s)
    update("output")
  })
  audio.connect("stream-removed", () => update("output"))
  speaker.connect("notify::mute", () => update("output"))
  microphone.connect("notify::mute", () => update("mic"))
}

// Start once WirePlumber is ready, then re-check every 3s so a changed or
// late-appearing default device is picked up (a no-op when nothing changed).
function syncAll() {
  hook()
  update("output")
  update("mic")
}
wp.connect("ready", syncAll)
setTimeout(syncAll, 500)
setInterval(syncAll, 3000)

// ── Used by the Visualizer widget ────────────────────────────────────
export function values(kind: Kind): number[] {
  return current[kind]?.cava.values ?? []
}

export function onFrame(kind: Kind, fn: () => void) {
  listeners[kind].add(fn)
  return () => listeners[kind].delete(fn)
}

// 0..1 volume factor, 0 when muted. Bars are capped by this.
export function level(ep: AstalWp.Endpoint) {
  return ep.mute ? 0 : Math.min(1, Math.max(0, ep.volume))
}

// Temporary troubleshooting: once a second, print what the mic visualizer sees.
// Turn off with DEBUG_MIC = false in config.ts.
if (DEBUG_MIC) {
  let peak = 0
  onFrame("mic", () => {
    for (const v of values("mic")) if (v > peak) peak = v
  })
  setInterval(() => {
    console.log(
      `[mic] source=${current.mic?.source ?? "(not started yet)"} ` +
        `mute=${microphone.mute} volume=${microphone.volume.toFixed(2)} ` +
        `raw peak=${peak.toFixed(4)} -> after gain=${Math.min(1, peak * MIC.gain).toFixed(3)} ` +
        `(gate ${MIC.gate})`,
    )
    peak = 0
  }, 1000)
}
