// Network details for the dashboard. Read once each time the dashboard
// opens (or on the card's refresh icon), through the dashboard job queue
// (lib/scheduler.ts) — no polling, no traffic counters,
// no speed tests, nothing sent over the network. "Speed" is the negotiated
// link rate the kernel / Wi-Fi driver already knows.
import GLib from "gi://GLib"
import { createState } from "ags"
import { execAsync } from "ags/process"
import { createJob } from "./scheduler"

export type NetInfo = {
  online: boolean
  iface: string
  kind: "Wired" | "Wi-Fi" | "VPN / virtual" | ""
  ipv4: string // 192.168.1.20
  prefix: string // /24
  ipv6: string // global address, if any
  gateway: string
  dns: string
  mac: string
  speed: string // "1 Gb/s", or "867 Mb/s · 5 GHz" on Wi-Fi
  ssid: string
  hostname: string
}

const empty: NetInfo = {
  online: false, iface: "", kind: "", ipv4: "", prefix: "", ipv6: "",
  gateway: "", dns: "", mac: "", speed: "", ssid: "", hostname: GLib.get_host_name(),
}
const [network, setNetwork] = createState<NetInfo>(empty)
export { network }

const decoder = new TextDecoder()
function read(path: string): string {
  try {
    const [ok, bytes] = GLib.file_get_contents(path)
    return ok ? decoder.decode(bytes).trim() : ""
  } catch {
    return ""
  }
}
const exists = (path: string) => GLib.file_test(path, GLib.FileTest.EXISTS)
const run = (cmd: string[]) => execAsync(cmd).catch(() => "")
const json = (s: string) => {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

// 1000 -> "1 Gb/s", 2500 -> "2.5 Gb/s", 100 -> "100 Mb/s"
function rate(mbps: number) {
  return mbps >= 1000 ? `${+(mbps / 1000).toFixed(1)} Gb/s` : `${Math.round(mbps)} Mb/s`
}
function band(mhz: number) {
  if (mhz >= 5925) return "6 GHz"
  if (mhz >= 4900) return "5 GHz"
  return mhz ? "2.4 GHz" : ""
}

async function dnsFor(iface: string) {
  // systemd-resolved knows the real upstream servers per link
  const out = await run(["resolvectl", "dns", iface])
  const servers = out.split(":").slice(1).join(":").trim()
  if (servers) return servers.split(/\s+/).join(", ")
  return read("/etc/resolv.conf")
    .split("\n")
    .map((l) => l.match(/^nameserver\s+(\S+)/)?.[1])
    .filter(Boolean)
    .join(", ")
}

async function readNetwork(): Promise<NetInfo> {
  const hostname = GLib.get_host_name()
  // Routing-table lookup only (no packet is sent): which interface/IP/gateway
  // would be used to reach the internet.
  const route = json(await run(["ip", "-j", "route", "get", "1.1.1.1"]))?.[0]
  if (!route?.dev) return { ...empty, hostname }

  const iface: string = route.dev
  const addr = json(await run(["ip", "-j", "addr", "show", "dev", iface]))?.[0] ?? {}
  const infos: any[] = addr.addr_info ?? []
  const v4 = infos.find((a) => a.family === "inet" && a.local === route.prefsrc) ?? infos.find((a) => a.family === "inet")
  const v6 = infos.find((a) => a.family === "inet6" && a.scope === "global" && !a.temporary) ?? infos.find((a) => a.family === "inet6" && a.scope === "global")

  const sys = `/sys/class/net/${iface}`
  const wifi = exists(`${sys}/wireless`)
  const kind: NetInfo["kind"] = wifi ? "Wi-Fi" : exists(`${sys}/device`) ? "Wired" : "VPN / virtual"

  let speed = ""
  let ssid = ""
  if (wifi) {
    const link = await run(["iw", "dev", iface, "link"])
    ssid = link.match(/SSID:\s*(.+)/)?.[1]?.trim() ?? ""
    const bitrate = Number(link.match(/tx bitrate:\s*([\d.]+)\s*MBit/)?.[1] ?? 0)
    const freq = Number(link.match(/freq:\s*([\d.]+)/)?.[1] ?? 0)
    speed = [bitrate ? rate(bitrate) : "", band(freq)].filter(Boolean).join(" · ")
    if (!ssid) ssid = (await run(["nmcli", "-g", "GENERAL.CONNECTION", "device", "show", iface])).trim()
  } else {
    const mbps = Number(read(`${sys}/speed`)) // -1 / unreadable when unknown
    if (mbps > 0) speed = rate(mbps)
  }

  return {
    online: true,
    iface,
    kind,
    ipv4: v4?.local ?? route.prefsrc ?? "",
    prefix: v4?.prefixlen !== undefined ? `/${v4.prefixlen}` : "",
    ipv6: v6?.local ?? "",
    gateway: route.gateway ?? "",
    dns: await dnsFor(iface),
    mac: addr.address ?? read(`${sys}/address`),
    speed,
    ssid,
    hostname,
  }
}

export const networkJob = createJob(() =>
  readNetwork()
    .then(setNetwork)
    .catch(() => setNetwork({ ...empty, hostname: GLib.get_host_name() })),
)
// "loaded" = read at least once (first open shows "Reading…" instead of blanks)
const [loaded, setLoaded] = createState(false)
export { loaded as networkLoaded }
network.subscribe(() => setLoaded(true))

export function refreshNetwork(manual = false) {
  networkJob.schedule({ manual })
}
