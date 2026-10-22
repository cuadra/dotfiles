import { Gtk } from "ags/gtk4"
import Pango from "gi://Pango"
import AstalBluetooth from "gi://AstalBluetooth"
import { Accessor } from "ags"
import { createPoll } from "ags/time"

const bluetooth = AstalBluetooth.get_default()

const ICON = {
  bt: "\u{f00af}",
  btOff: "\u{f00b2}",
}

// Bluetooth (BlueZ) state, checked once a second
const bt = createPoll({ available: false, on: false, status: "" }, 1000, () => {
  const a = bluetooth.adapter
  if (!a) return { available: false, on: false, status: "No Bluetooth adapter" }
  if (!a.powered) return { available: true, on: false, status: "Off" }
  const n = bluetooth.devices.filter((d) => d.connected).length
  return { available: true, on: true, status: n ? `On · ${n} connected` : "On" }
})

type State = { available: boolean; on: boolean; status: string }

function ToggleRow({ name, state, icons, set }: {
  name: string
  state: Accessor<State>
  icons: [string, string] // on, off
  set: (on: boolean) => void
}) {
  return (
    <box class={state((s) => (s.on ? "toggle-row on" : "toggle-row"))} spacing={12}>
      <label class="toggle-icon" label={state((s) => (s.on ? icons[0] : icons[1]))} />
      <box orientation={Gtk.Orientation.VERTICAL} hexpand valign={Gtk.Align.CENTER}>
        <label class="toggle-name" label={name} xalign={0} />
        <label class="toggle-status" label={state((s) => s.status)} xalign={0} ellipsize={Pango.EllipsizeMode.END} maxWidthChars={18} />
      </box>
      <switch
        class="toggle"
        valign={Gtk.Align.CENTER}
        active={state((s) => s.on)}
        sensitive={state((s) => s.available)}
        // Return false so GTK still flips the switch (a truthy return blocks it)
        onStateSet={(_self, on: boolean) => {
          set(on)
          return false
        }}
      />
    </box>
  )
}

export default function Connectivity() {
  return (
    <box class="dash-card" orientation={Gtk.Orientation.VERTICAL} spacing={12} hexpand>
      <label class="dash-title" label="CONNECTIVITY" xalign={0} />
      <ToggleRow
        name="Bluetooth"
        state={bt}
        icons={[ICON.bt, ICON.btOff]}
        set={(on) => {
          const a = bluetooth.adapter
          if (a && a.powered !== on) a.powered = on
        }}
      />
    </box>
  )
}
