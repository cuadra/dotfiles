import { Gtk } from "ags/gtk4"
import { cameraStatus, cameraPaintable } from "../../lib/camera"
import { CAMERA } from "../../config"

const V = Gtk.Orientation.VERTICAL
const CAM_ICON = "\u{f0100}" // nf-md-camera
const CAM_OFF = "\u{f05df}" // nf-md-camera_off

const MESSAGE = {
  off: "Camera off",
  starting: "Starting camera…",
  live: "",
  busy: "In use by another app",
  missing: "No camera found",
  error: "Camera error",
}

// Left column, above the wallpaper: live webcam preview while the dashboard is open
export default function Camera() {
  return (
    <box class={cameraStatus((s) => `camera ${s}`)} overflow={Gtk.Overflow.HIDDEN} visible={CAMERA.enabled}>
      <overlay hexpand>
        {/* Sets the size (overlays don't count toward size, so the video can't stretch the column) */}
        <box hexpand heightRequest={CAMERA.height} />
        <Gtk.Picture
          $type="overlay"
          paintable={cameraPaintable}
          contentFit={Gtk.ContentFit.COVER}
          canShrink
          hexpand
          vexpand
        />
        <box
          $type="overlay"
          orientation={V}
          spacing={6}
          halign={Gtk.Align.CENTER}
          valign={Gtk.Align.CENTER}
          visible={cameraStatus((s) => s !== "live")}
        >
          <label
            class={cameraStatus((s) => (s === "starting" ? "camera-icon loading-text" : "camera-icon"))}
            label={cameraStatus((s) => (s === "starting" ? CAM_ICON : CAM_OFF))}
          />
          <label class="camera-message" label={cameraStatus((s) => MESSAGE[s])} />
        </box>
        <box
          $type="overlay"
          class="camera-badge"
          spacing={5}
          halign={Gtk.Align.START}
          valign={Gtk.Align.START}
          visible={cameraStatus((s) => s === "live")}
        >
          <label class="camera-dot" label="●" />
          <label label="LIVE" />
        </box>
      </overlay>
    </box>
  )
}
