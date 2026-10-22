import { Gtk } from "ags/gtk4"
import AstalWp from "gi://AstalWp"
import { createBinding, createComputed } from "ags"

type Props = { ep: AstalWp.Endpoint; name: string; icon: string; iconMuted: string }

// Round mute button, name + percentage, slider underneath
export default function AudioRow({ ep, name, icon, iconMuted }: Props) {
  const volume = createBinding(ep, "volume")
  const mute = createBinding(ep, "mute")
  const percent = createComputed(() => (mute() ? "muted" : `${Math.round(volume() * 100)}%`))

  return (
    <box class={mute((m) => (m ? "audio-row muted" : "audio-row"))} spacing={14}>
      <button class="audio-icon" valign={Gtk.Align.CENTER} tooltipText="Mute / unmute" onClicked={() => (ep.mute = !ep.mute)}>
        <label label={mute((m) => (m ? iconMuted : icon))} />
      </button>
      <box orientation={Gtk.Orientation.VERTICAL} hexpand spacing={6} valign={Gtk.Align.CENTER}>
        <box>
          <label class="audio-name" label={name} hexpand xalign={0} />
          <label class="audio-value" label={percent} />
        </box>
        <slider
          class="audio-slider"
          hexpand
          min={0}
          max={1}
          value={volume}
          // Return false so GTK still moves the slider (a truthy return blocks it)
          onChangeValue={(_self, _scroll, value: number) => {
            ep.volume = Math.min(1, Math.max(0, value))
            return false
          }}
        />
      </box>
    </box>
  )
}
