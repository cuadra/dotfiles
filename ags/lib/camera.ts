// Webcam preview for the dashboard (GStreamer -> GTK paintable).
// The camera only runs while the dashboard is open: the pipeline is built when
// it opens and torn down when it closes, so the device (and its light) is free
// the rest of the time. Needs gst-plugins-good and gst-plugin-gtk4.
import Gst from "gi://Gst?version=1.0"
import GLib from "gi://GLib"
import Gdk from "gi://Gdk?version=4.0"
import { createState } from "ags"
import { dashboardOpen } from "./scheduler"
import { CAMERA } from "../config"

Gst.init(null)

export type CameraStatus = "off" | "starting" | "live" | "busy" | "missing" | "error"
const [status, setStatus] = createState<CameraStatus>("off")
const [paintable, setPaintable] = createState<Gdk.Paintable | null>(null)
export { status as cameraStatus, paintable as cameraPaintable }

let pipeline: Gst.Element | null = null
let bus: Gst.Bus | null = null
let busId = 0

// First try: raw video no wider than maxWidth (light on CPU).
// Fallback: whatever the camera offers, decoded (e.g. MJPEG-only cameras).
function describe(limited: boolean) {
  const source = `v4l2src device=${CAMERA.device}`
  const format = limited ? `video/x-raw,width=[1,${CAMERA.maxWidth}] ! videoconvert` : "decodebin ! videoconvert ! videoscale"
  const flip = CAMERA.mirror ? " ! videoflip method=horizontal-flip" : ""
  return `${source} ! ${format}${flip} ! gtk4paintablesink name=sink`
}

function stop(reset = true) {
  if (pipeline) pipeline.set_state(Gst.State.NULL)
  if (bus) {
    bus.disconnect(busId)
    bus.remove_signal_watch()
  }
  pipeline = bus = null
  setPaintable(null)
  if (reset) setStatus("off")
}

function start(limited = true) {
  stop(false)
  if (!GLib.file_test(CAMERA.device, GLib.FileTest.EXISTS)) return setStatus("missing")
  setStatus("starting")

  let p: Gst.Element
  try {
    p = Gst.parse_launch(describe(limited))
  } catch {
    return setStatus("error") // a GStreamer plugin is missing
  }
  const sink = (p as Gst.Bin).get_by_name("sink") as any
  setPaintable((sink?.paintable as Gdk.Paintable) ?? null)

  const b = p.get_bus()!
  b.add_signal_watch()
  busId = b.connect("message", (_bus, msg: Gst.Message) => {
    if (msg.type === Gst.MessageType.STATE_CHANGED && msg.src === p) {
      const [, next] = msg.parse_state_changed()
      if (next === Gst.State.PLAYING) setStatus("live")
    } else if (msg.type === Gst.MessageType.ERROR) {
      const [err] = msg.parse_error()
      const text = err?.message ?? ""
      if (/busy/i.test(text)) {
        stop(false)
        setStatus("busy") // another app (Teams, a browser, …) has the camera
      } else if (/cannot identify|no such|not found/i.test(text)) {
        stop(false)
        setStatus("missing")
      } else if (limited) {
        start(false) // camera has no small raw mode: try its other formats
      } else {
        stop(false)
        setStatus("error")
      }
    }
  })
  pipeline = p
  bus = b
  p.set_state(Gst.State.PLAYING)
}

if (CAMERA.enabled) {
  dashboardOpen.subscribe(() => (dashboardOpen.get() ? start() : stop()))
}
