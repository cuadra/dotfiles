import { Gtk } from "ags/gtk4"
import { Accessor } from "ags"
import { PURPLE, TEAL, HOT, HOT_AT } from "./theme"

type Props = {
  label: string
  load: Accessor<number> // 0..100 %
  temp: Accessor<number | null> // °C, null = no sensor (inner arc + text hidden)
  size?: number
}

// 270° gauge: tick ring, purple load arc with a glowing end dot, teal temp arc inside
export default function Gauge({ label, load, temp, size = 100 }: Props) {
  const START = (135 * Math.PI) / 180 // bottom-left
  const SWEEP = (270 * Math.PI) / 180

  function setup(area: Gtk.DrawingArea) {
    area.set_draw_func((_self, cr, w, h) => {
      const cx = w / 2
      const cy = h / 2
      const R = Math.min(w, h) / 2
      cr.setLineCap(1) // round

      // Tick ring
      const ticks = 40
      cr.setLineWidth(1.5)
      cr.setSourceRGBA(1, 1, 1, 0.12)
      for (let i = 0; i <= ticks; i++) {
        const a = START + (SWEEP * i) / ticks
        cr.moveTo(cx + Math.cos(a) * (R - 1), cy + Math.sin(a) * (R - 1))
        cr.lineTo(cx + Math.cos(a) * (R - 5), cy + Math.sin(a) * (R - 5))
      }
      cr.stroke()

      // Load arc (outer)
      const rLoad = R - 14
      const v = Math.min(1, Math.max(0, load.get() / 100))
      cr.setLineWidth(7)
      cr.setSourceRGBA(1, 1, 1, 0.06)
      cr.arc(cx, cy, rLoad, START, START + SWEEP)
      cr.stroke()
      if (v > 0) {
        cr.setSourceRGBA(PURPLE[0], PURPLE[1], PURPLE[2], 1)
        cr.arc(cx, cy, rLoad, START, START + SWEEP * v)
        cr.stroke()
      }

      // Temperature arc (inner, thinner)
      const t = temp.get()
      if (t !== null) {
        const rTemp = rLoad - 11
        const tv = Math.min(1, Math.max(0, t / 100))
        const col = t >= HOT_AT ? HOT : TEAL
        cr.setLineWidth(3)
        cr.setSourceRGBA(1, 1, 1, 0.05)
        cr.arc(cx, cy, rTemp, START, START + SWEEP)
        cr.stroke()
        if (tv > 0) {
          cr.setSourceRGBA(col[0], col[1], col[2], 0.9)
          cr.arc(cx, cy, rTemp, START, START + SWEEP * tv)
          cr.stroke()
        }
      }

      // Glowing dot at the end of the load arc
      const a = START + SWEEP * v
      const kx = cx + Math.cos(a) * rLoad
      const ky = cy + Math.sin(a) * rLoad
      for (const [r, alpha] of [[11, 0.08], [8, 0.14], [6, 0.25]]) {
        cr.setSourceRGBA(PURPLE[0], PURPLE[1], PURPLE[2], alpha)
        cr.arc(kx, ky, r, 0, 2 * Math.PI)
        cr.fill()
      }
      cr.setSourceRGBA(1, 1, 1, 1)
      cr.arc(kx, ky, 4.5, 0, 2 * Math.PI)
      cr.fill()

      cr.$dispose()
    })
    const unsubs = [load.subscribe(() => area.queue_draw()), temp.subscribe(() => area.queue_draw())]
    area.connect("destroy", () => unsubs.forEach((u) => u()))
  }

  return (
    <box class="gauge" orientation={Gtk.Orientation.VERTICAL} spacing={10} halign={Gtk.Align.CENTER}>
      <overlay>
        <Gtk.DrawingArea contentWidth={size} contentHeight={size} $={setup} />
        {/* Percentage, centered in the ring */}
        <box $type="overlay" halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
          <label class="gauge-value" label={load((l) => `${Math.round(l)}`)} />
          <label class="gauge-unit" label="%" valign={Gtk.Align.END} />
        </box>
        {/* Temperature, in the opening at the bottom of the arcs */}
        <label
          $type="overlay"
          class="gauge-temp"
          halign={Gtk.Align.CENTER}
          valign={Gtk.Align.END}
          label={temp((t) => `${t ?? "--"}°C`)}
          visible={temp((t) => t !== null)}
        />
      </overlay>
      <label class="gauge-label" label={label} />
    </box>
  )
}
