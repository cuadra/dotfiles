import { Gtk } from "ags/gtk4"
import { Accessor } from "ags"
import Ring from "./Ring"

const HOT = 80 // °C, temperature turns red at or above this

type Props = {
  icon: string
  title: string
  usage: Accessor<number> // 0..100 %
  temp: Accessor<number | null> // °C, null = no sensor (inner ring and line hidden)
  detail: Accessor<string>
}

// One monitored system: stacked rings (outer = usage, inner = temperature)
// with the readings beside them
export default function StatCard({ icon, title, usage, temp, detail }: Props) {
  const hot = temp((t) => t !== null && t >= HOT)
  return (
    <box class="stat-card" spacing={16} hexpand>
      <Ring
        icon={icon}
        outer={usage((u) => u / 100)}
        inner={temp((t) => (t === null ? null : t / 100))}
        hot={hot}
      />
      <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER} spacing={4}>
        <label class="card-title" label={title} xalign={0} />
        <box spacing={6}>
          <label class="dot usage" label="●" />
          <label class="card-value" label={usage((u) => `${Math.round(u)}%`)} />
          <label class="card-unit" label="usage" />
        </box>
        <box spacing={6} visible={temp((t) => t !== null)}>
          <label class={hot((h) => (h ? "dot temp hot" : "dot temp"))} label="●" />
          <label class="card-value" label={temp((t) => `${t ?? "--"}°C`)} />
          <label class="card-unit" label="temp" />
        </box>
        <label class="card-detail" label={detail} xalign={0} />
      </box>
    </box>
  )
}
