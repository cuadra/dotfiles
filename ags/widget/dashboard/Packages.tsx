import { Gtk } from "ags/gtk4"
import { createComputed } from "ags"
import { managers, anyBusy, total, firstRun, noneFound, refreshPackages } from "../../lib/packages"

const V = Gtk.Orientation.VERTICAL
const REFRESH = "\u{f0450}"
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",") // 1234 -> 1,234

// Installed package count per manager; managers that aren't installed are hidden.
// Rows count one at a time; a row's value pulses while it's queued or counting.
export default function Packages() {
  const status = createComputed(() => {
    if (firstRun()) {
      const left = managers.filter((m) => !m.checked()).length
      return `Counting… ${managers.length - left}/${managers.length}`
    }
    return "No package managers found"
  })
  return (
    <box class="dash-card" orientation={V} spacing={10} hexpand>
      <box spacing={8}>
        <label class="dash-title" label="PACKAGES" hexpand xalign={0} />
        <label class="dash-meta" label={total((n) => `${fmt(n)} total`)} visible={total((n) => n > 0)} />
        <button class="dash-refresh" tooltipText="Count again" valign={Gtk.Align.CENTER} onClicked={() => refreshPackages(true)}>
          <label class={anyBusy((b) => (b ? "busy" : ""))} label={REFRESH} />
        </button>
      </box>
      <label class="info-name loading-text" label={status} xalign={0} visible={createComputed(() => firstRun() || noneFound())} />
      <box orientation={V} spacing={2}>
        {managers.map((m) => (
          <box class="info-row" spacing={10} visible={m.count((n) => n !== null)} tooltipText={m.tooltip}>
            <label class="info-icon row-icon" label={m.icon} />
            <label class="info-name" label={m.name} hexpand xalign={0} />
            <label
              class={m.job.busy((b) => (b ? "info-value loading" : "info-value"))}
              label={m.count((n) => fmt(n ?? 0))}
            />
          </box>
        ))}
      </box>
    </box>
  )
}
