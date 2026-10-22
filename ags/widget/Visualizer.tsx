import { Gtk } from "ags/gtk4"
import { VIS } from "../config"
import { values as getValues, onFrame, type Kind } from "../lib/audio"

type Props = {
  kind: Kind // which visualizer: "output" or "mic"
  bars: number
  level: () => number // 0..1 cap on bar height (volume, 0 when muted)
  gain?: number // multiply raw values (mic)
  gate?: number // noise gate 0..1 (mic)
}

// Pill-shaped bar path
function roundedBar(cr: any, x: number, y: number, w: number, h: number) {
  const r = Math.min(w / 2, h / 2)
  cr.newSubPath()
  cr.arc(x + w - r, y + r, r, -Math.PI / 2, 0)
  cr.arc(x + w - r, y + h - r, r, 0, Math.PI / 2)
  cr.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
  cr.arc(x + r, y + r, r, Math.PI, (3 * Math.PI) / 2)
  cr.closePath()
}

export default function Visualizer({ kind, bars, level, gain = 1, gate = 0 }: Props) {
  const width = bars * VIS.barWidth + (bars - 1) * VIS.gap

  function setup(area: Gtk.DrawingArea) {
    area.set_draw_func((self, cr, w, h) => {
      const color = self.get_color() // from CSS `color`
      cr.setSourceRGBA(color.red, color.green, color.blue, color.alpha)

      const values = getValues(kind)
      const cap = level()
      let x = (w - width) / 2

      for (let i = 0; i < bars; i++) {
        let v = Math.min(1, Math.max(0, (values[i] ?? 0) * gain))
        if (gate > 0) v = v < gate ? 0 : (v - gate) / (1 - gate)
        v *= cap

        const bh = Math.max(VIS.minHeight, v * VIS.height)
        const y = VIS.centered ? (h - bh) / 2 : (h + VIS.height) / 2 - bh
        roundedBar(cr, x, y, VIS.barWidth, bh)
        x += VIS.barWidth + VIS.gap
      }
      cr.fill()
      cr.$dispose()
    })

    // Redraw every time cava produces a new frame
    const off = onFrame(kind, () => area.queue_draw())
    area.connect("destroy", off)
  }

  return (
    <Gtk.DrawingArea
      class="visualizer"
      contentWidth={width}
      contentHeight={VIS.height}
      valign={Gtk.Align.CENTER}
      $={setup}
    />
  )
}
