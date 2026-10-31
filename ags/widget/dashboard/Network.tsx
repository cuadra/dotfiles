import { Gtk } from "ags/gtk4"
import Pango from "gi://Pango"
import { Accessor } from "ags"
import { execAsync } from "ags/process"
import { network, networkJob, networkLoaded, refreshNetwork } from "../../lib/network"

const V = Gtk.Orientation.VERTICAL
const ICON = {
  refresh: "\u{f0450}",
  wired: "\u{f0200}",
  wifi: "\u{f05a9}",
  vpn: "\u{f0582}",
  offline: "\u{f0a8e}",
}

// One "label ........ value" line; click to copy the value (needs wl-clipboard)
function Row({ icon, name, value }: { icon: string; name: string; value: Accessor<string> }) {
  return (
    <button
      class="info-row info-copy"
      visible={value((v) => v !== "")}
      tooltipText={value((v) => `${v}\nClick to copy`)}
      onClicked={() => execAsync(["wl-copy", value.get()]).catch(() => {})}
    >
      <box spacing={10}>
        <label class="info-icon row-icon" label={icon} />
        <label class="info-name" label={name} xalign={0} widthRequest={78} />
        <label
          class={networkJob.busy((b) => (b ? "info-value loading" : "info-value"))}
          label={value}
          hexpand
          xalign={1}
          ellipsize={Pango.EllipsizeMode.MIDDLE}
          maxWidthChars={26}
        />
      </box>
    </button>
  )
}

// Interface, addresses and link speed. Read when the dashboard opens (queued); not polled.
// Values pulse while a read is queued or running.
export default function Network() {
  const n = network
  const icon = n((x) => (!x.online ? ICON.offline : x.kind === "Wi-Fi" ? ICON.wifi : x.kind === "Wired" ? ICON.wired : ICON.vpn))
  return (
    <box class="dash-card" orientation={V} spacing={10} hexpand>
      <box spacing={8}>
        <label class="dash-title" label="NETWORK" hexpand xalign={0} />
        <label class={n((x) => (x.online ? "info-icon" : "info-icon off"))} label={icon} />
        <label
          class="dash-meta"
          label={n((x) => (x.online ? `${x.kind} · ${x.iface}` : "Offline"))}
          visible={networkLoaded}
        />
        <button class="dash-refresh" tooltipText="Read again" valign={Gtk.Align.CENTER} onClicked={() => refreshNetwork(true)}>
          <label class={networkJob.busy((b) => (b ? "busy" : ""))} label={ICON.refresh} />
        </button>
      </box>
      <label class="info-name loading-text" label="Reading…" xalign={0} visible={networkLoaded((l) => !l)} />
      <box orientation={V} spacing={2}>
        <Row icon={"\u{f0a5f}"} name="Local IP" value={n((x) => x.ipv4)} />
        <Row icon={"\u{f0317}"} name="Subnet" value={n((x) => x.prefix)} />
        <Row icon={"\u{f0a60}"} name="IPv6" value={n((x) => x.ipv6)} />
        <Row icon={"\u{f11e2}"} name="Gateway" value={n((x) => x.gateway)} />
        <Row icon={"\u{f01d6}"} name="DNS" value={n((x) => x.dns)} />
        <Row icon={"\u{f05a9}"} name="Network" value={n((x) => x.ssid)} />
        <Row icon={"\u{f04c5}"} name="Link speed" value={n((x) => x.speed)} />
        <Row icon={"\u{f0efe}"} name="MAC" value={n((x) => x.mac)} />
        <Row icon={"\u{f0379}"} name="Hostname" value={n((x) => x.hostname)} />
      </box>
    </box>
  )
}
