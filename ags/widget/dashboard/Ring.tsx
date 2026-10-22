import { Gtk } from "ags/gtk4"
import { Accessor } from "ags"

// Track color = rofi "selected" ($d-selected in style.scss), visible on the raised cards
const TRACK = [73 / 255, 77 / 255, 100 / 255]
// Inner ring colors: the outer ring's color at reduced opacity, or "hot" red ($d-hot)
const INNER_ALPHA = 0.55
const HOT = [243 / 255, 139 / 255, 168 / 255]

type Props = {
  outer: Accessor<number> // 0..1 (usage)
  inner?: Accessor<number | null> // 0..1 (temperature), null = no inner ring
  hot?: Accessor<boolean> // inner ring turns red
  icon: string // drawn in the middle
  size?: number
}

// Two concentric gauges drawn with cairo. The outer arc uses the CSS `color` of .ring.
export default function Ring({ outer, inner, hot, icon, size = 104 }: Props) {
  function arc(cr: any, cx: number, cy: number, r: number, v: number, rgba: number[]) {
    cr.setSourceRGBA(TRACK[0], TRACK[1], TRACK[2], 1)
    cr.arc(cx, cy, r, 0, 2 * Math.PI)
    cr.stroke()
    if (v <= 0) return
    cr.setSourceRGBA(rgba[0], rgba[1], rgba[2], rgba[3])
    cr.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * Math.min(1, v))
    cr.stroke()
  }

  function setup(area: Gtk.DrawingArea) {
    area.set_draw_func((self, cr, w, h) => {
      const lw = 8 // ring thickness
      const gap = 5 // space between the two rings
      const cx = w / 2
      const cy = h / 2
      const rOuter = Math.min(w, h) / 2 - lw / 2
      const rInner = rOuter - lw - gap
      const c = self.get_color()
      cr.setLineWidth(lw)
      cr.setLineCap(1) // round ends

      arc(cr, cx, cy, rOuter, outer.get(), [c.red, c.green, c.blue, c.alpha])
      const iv = inner?.get()
      if (iv !== undefined && iv !== null) {
        const col = hot?.get() ? [...HOT, 1] : [c.red, c.green, c.blue, c.alpha * INNER_ALPHA]
        arc(cr, cx, cy, rInner, iv, col)
      }
      cr.$dispose()
    })
    const unsubs = [outer.subscribe(() => area.queue_draw())]
    if (inner) unsubs.push(inner.subscribe(() => area.queue_draw()))
    if (hot) unsubs.push(hot.subscribe(() => area.queue_draw()))
    area.connect("destroy", () => unsubs.forEach((u) => u()))
  }

  return (
    <overlay halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
      <Gtk.DrawingArea class="ring" contentWidth={size} contentHeight={size} $={setup} />
      <label $type="overlay" class="ring-icon" label={icon} />
    </overlay>
  )
}
