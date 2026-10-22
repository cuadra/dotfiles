import { Gtk } from "ags/gtk4"
import Pango from "gi://Pango"
import AstalWp from "gi://AstalWp"
import { createBinding, createComputed } from "ags"
import { createPoll } from "ags/time"
import { defaultEndpoint, type Kind } from "../../lib/audio"

// "...(HDMI 2) [XG32UCG]" -> "XG32UCG · HDMI 2", and drop filler words
function shorten(desc: string) {
  const hdmi = desc.match(/\((HDMI[^)]*)\) \[([^\]]*)\]/)
  if (hdmi) return `${hdmi[2]} · ${hdmi[1]}`
  return desc.replace(/ Audio Controller| Digital Stereo| Analog Stereo/g, "")
}

type Props = {
  ep: AstalWp.Endpoint // the default speaker or microphone
  kind: Kind
  name: string
  icon: string
  iconMuted: string
}

// Mute button, name + device, slider, percentage
export default function VolumeRow({ ep, kind, name, icon, iconMuted }: Props) {
  const volume = createBinding(ep, "volume")
  const mute = createBinding(ep, "mute")
  const device = createPoll("", 3000, () => shorten(defaultEndpoint(kind)?.description ?? ""))
  const percent = createComputed(() => (mute() ? "muted" : `${Math.round(volume() * 100)}%`))

  return (
    <box class={mute((m) => (m ? "vol-row muted" : "vol-row"))} spacing={14}>
      <button class="vol-mute" tooltipText="Mute / unmute" onClicked={() => (ep.mute = !ep.mute)}>
        <label label={mute((m) => (m ? iconMuted : icon))} />
      </button>
      <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER} widthRequest={170}>
        <label class="vol-name" label={name} xalign={0} />
        <label class="vol-device" label={device} xalign={0} ellipsize={Pango.EllipsizeMode.END} maxWidthChars={24} />
      </box>
      <slider
        class="vol-scale"
        hexpand
        valign={Gtk.Align.CENTER}
        min={0}
        max={1}
        value={volume}
        // change-value gives the value being dragged to. Return false so GTK
        // still moves the slider (returning a truthy value blocks the move).
        onChangeValue={(_self, _scroll, value: number) => {
          ep.volume = Math.min(1, Math.max(0, value))
          return false
        }}
      />
      <label class="vol-value" label={percent} xalign={1} widthRequest={60} />
    </box>
  )
}
