import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createBinding, createComputed, createState } from "ags"
import { execAsync } from "ags/process"
import Visualizer from "./Visualizer"
import { speaker, microphone, level } from "../lib/audio"
import { BAR, OUTPUT, MIC, ICONS } from "../config"

function SpeakerIcon() {
  const mute = createBinding(speaker, "mute")
  // One fixed icon so the bar never shifts; muted just turns it dark grey (see style.scss).
  // Click to mute / unmute the speaker
  return (
    <button
      class={mute((m) => (m ? "audio-toggle muted" : "audio-toggle"))}
      focusOnClick={false}
      cursor={Gdk.Cursor.new_from_name("pointer", null)}
      valign={Gtk.Align.CENTER}
      tooltipText={mute((m) => (m ? "Speaker muted — click to unmute" : "Click to mute speaker"))}
      onClicked={() => (speaker.mute = !speaker.mute)}
    >
      <label class="icon speaker" label={ICONS.speaker[2]} />
    </button>
  )
}

function MicIcon() {
  const mute = createBinding(microphone, "mute")
  // Click to mute / unmute the microphone
  return (
    <button
      class={mute((m) => (m ? "audio-toggle muted" : "audio-toggle"))}
      focusOnClick={false}
      cursor={Gdk.Cursor.new_from_name("pointer", null)}
      valign={Gtk.Align.CENTER}
      tooltipText={mute((m) => (m ? "Mic muted — click to unmute" : "Click to mute mic"))}
      onClicked={() => (microphone.mute = !microphone.mute)}
    >
      <label class="icon mic" label={ICONS.mic} />
    </button>
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
