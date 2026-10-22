import { Gtk } from "ags/gtk4"
import { Accessor } from "ags"

type Props = { icon: string; name: string; value: Accessor<number | null> }

// Temperature row: name, bar (0-100°C, red above 80°C), value
export default function Temp({ icon, name, value }: Props) {
  return (
    <box class="temp-row" spacing={12}>
      <label class="temp-icon" label={icon} widthRequest={22} />
      <label class="temp-name" label={name} xalign={0} widthRequest={60} />
      <levelbar
        class={value((v) => (v !== null && v >= 80 ? "temp-bar hot" : "temp-bar"))}
        hexpand
        valign={Gtk.Align.CENTER}
        minValue={0}
        maxValue={100}
        value={value((v) => v ?? 0)}
      />
      <label class="temp-value" label={value((v) => `${v ?? "--"}°C`)} xalign={1} widthRequest={60} />
    </box>
  )
}
