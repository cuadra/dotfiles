import { Gtk } from "ags/gtk4"
import { Accessor } from "ags"

type Props = {
  icon: string | Accessor<string>
  value: string | Accessor<string>
  caption: string | Accessor<string>
  tooltip?: string
  active?: Accessor<boolean> // highlighted when true
  onClicked?: () => void
}

// Status tile: icon, big value, small caption (clickable if onClicked is given)
export default function Tile({ icon, value, caption, tooltip, active, onClicked }: Props) {
  return (
    <button class={active ? active((a) => (a ? "tile active" : "tile")) : "tile"} hexpand tooltipText={tooltip ?? ""} onClicked={() => onClicked?.()}>
      <box spacing={14}>
        <label class="tile-icon" label={icon} />
        <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER}>
          <label class="tile-value" label={value} xalign={0} />
          <label class="tile-caption" label={caption} xalign={0} />
        </box>
      </box>
    </button>
  )
}
