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

const busy: Record<Kind, boolean> = { output: false, mic: false }

async function sync(kind: Kind) {
  if (busy[kind]) return // a check is already running
  busy[kind] = true
  try {
    const source = await wantedSource(kind)
    if (!source || current[kind]?.source === source) return
    if (current[kind]) current[kind]!.cava.active = false // stop the old one
    current[kind] = { cava: create(kind, source), source }
    console.log(`[audio] ${kind} visualizer listening to ${source}`)
  } finally {
    busy[kind] = false
  }
}

// Start once WirePlumber is ready, then re-check every 3s so a changed or
// late-appearing default device is picked up (a no-op when nothing changed).
function syncAll() {
  sync("output")
  sync("mic")
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
