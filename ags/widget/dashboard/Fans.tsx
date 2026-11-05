import { Gtk } from "ags/gtk4"
import { fans } from "../../lib/fans"
import { FANS } from "../../config"

const V = Gtk.Orientation.VERTICAL
const FAN = "\u{f0210}" // nf-md-fan
const FAN_OFF = "\u{f081d}" // nf-md-fan_off
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",") // 2096 -> 2,096

// One tile per fan: icon, RPM (or "Stopped"), name
export default function Fans() {
  return (
    <box class="dash-card" orientation={V} spacing={12} hexpand>
      <box spacing={8}>
        <label class="dash-title" label="FANS" hexpand xalign={0} />
        <label class="dash-meta" label={FANS.board} />
      </box>
      <label
        class="info-name"
        label="Fan sensor not found · is the it87 driver loaded?"
        xalign={0}
        visible={fans((s) => s.status === "missing")}
      />
      <box homogeneous spacing={10} visible={fans((s) => s.status !== "missing")}>
        {FANS.fans.map((cfg, i) => {
          const f = fans((s) => s.fans[i])
          const running = f((x) => (x.rpm ?? 0) > 0)
          return (
            <box class={f((x) => (x.rpm === null ? "fan" : x.rpm > 0 ? "fan running" : "fan stopped"))} spacing={10}>
              <label class="fan-icon" label={running((r) => (r ? FAN : FAN_OFF))} />
              <box orientation={V} valign={Gtk.Align.CENTER}>
                <label
                  class="fan-rpm"
                  label={f((x) => (x.rpm === null ? "—" : x.rpm > 0 ? `${fmt(x.rpm)} RPM` : "Stopped"))}
                  xalign={0}
                />
                <label class="fan-name" label={cfg.name} xalign={0} />
              </box>
            </box>
          )
        })}
      </box>
    </box>
  )
}
