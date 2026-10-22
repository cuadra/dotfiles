import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createBinding, createComputed, createState } from "ags"
import { execAsync } from "ags/process"
import Visualizer from "./Visualizer"
import { speaker, microphone, level } from "../lib/audio"
import { BAR, OUTPUT, MIC, ICONS } from "../config"

function SpeakerIcon() {
  const volume = createBinding(speaker, "volume")
  const mute = createBinding(speaker, "mute")
  const icon = createComputed(() => {
    if (mute() || volume() <= 0) return ICONS.speakerMuted
    const i = Math.min(2, Math.floor(volume() * 3))
    return ICONS.speaker[i]
  })
  return <label class="icon speaker" label={icon} />
}

function MicIcon() {
  const mute = createBinding(microphone, "mute")
  return (
    <label class="icon mic" label={mute((m) => (m ? ICONS.micMuted : ICONS.mic))} />
  )
}

// Always shown: greyed out when idle, pulsing red while wl-screenrec runs.
// Click to start recording an area, or to stop the current recording.
const [recording, setRecording] = createState(false)
setInterval(() => {
  execAsync(["pgrep", "-x", "wl-screenrec"])
    .then(() => setRecording(true))
    .catch(() => setRecording(false)) // pgrep exits non-zero when nothing matches
}, 1000)

function RecordingIcon() {
  return (
    <button
      class={recording((r) => (r ? "recording active" : "recording"))}
      valign={Gtk.Align.CENTER}
      tooltipText={recording((r) => (r ? "Recording — click to stop" : "Record an area (Super+Shift+R)"))}
      // record.sh toggles: starts an area selection when idle, stops when recording
      onClicked={() => execAsync(["bash", "-c", "setsid -f bash ~/.config/hypr/record.sh >/dev/null 2>&1"])}
    >
      <label class="icon" label={ICONS.recording} />
    </button>
  )
}

export default function Bar(gdkmonitor: Gdk.Monitor) {
  return (
    <window
      visible
      name="bar"
      namespace="ags-bar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      // Anchored to the top only, so the bar is centered and as wide as its content.
      anchor={Astal.WindowAnchor.TOP}
      marginTop={BAR.marginTop}
      // Don't reserve space: Hyprland's gaps_out keeps windows below the bar,
      // and notifications can sit level with it.
      exclusivity={Astal.Exclusivity.NORMAL}
      layer={Astal.Layer.TOP}
      application={app}
    >
      <box class="bar-body" spacing={12} valign={Gtk.Align.CENTER}>
        <RecordingIcon />
        <label class="icon divider" label={ICONS.divider} />
        <Visualizer kind="mic" bars={MIC.bars} level={() => level(microphone)}
                    gain={MIC.gain} gate={MIC.gate} />
        <MicIcon />
        <label class="icon divider" label={ICONS.divider} />
        <Visualizer kind="output" bars={OUTPUT.bars} level={() => level(speaker)} />
        <SpeakerIcon />
      </box>
    </window>
  )
}
