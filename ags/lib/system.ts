// System stats for the dashboard, read straight from /proc, /sys and Gio
// (replaces the eww helper scripts).
import GLib from "gi://GLib"
import Gio from "gi://Gio"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"
import { createState } from "ags"

const decoder = new TextDecoder()
function read(path: string): string | null {
  try {
    const [ok, bytes] = GLib.file_get_contents(path)
    return ok ? decoder.decode(bytes) : null
  } catch {
    return null
  }
}

const GB = 1024 ** 3

// ── Clock ────────────────────────────────────────────────────────────
const now = (fmt: string) => GLib.DateTime.new_now_local().format(fmt) ?? ""
const clean = (t: string) => t.trim().replace(/\s+/g, " ")
export const time = createPoll(clean(now("%l:%M")), 1000, () => clean(now("%l:%M"))) // 11:14 (no leading zero)
export const ampm = createPoll(now("%p"), 1000, () => now("%p"))
export const date = createPoll(clean(now("%A, %B %e, %Y")), 60_000, () => clean(now("%A, %B %e, %Y")))
export const week = createPoll(now("%V"), 60_000, () => String(Number(now("%V")))) // ISO week number

// "4d 2h", or "35m" right after boot
export const uptime = createPoll("", 60_000, () => {
  const secs = Math.floor(Number(read("/proc/uptime")?.split(" ")[0] ?? 0))
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (d) return `${d}d ${h}h`
  if (h) return `${h}h ${m}m`
  return `${m}m`
})

// Pending Arch updates (needs pacman-contrib for checkupdates). -1 = couldn't check.
const [updates, setUpdates] = createState(-1)
export { updates }
function checkUpdates() {
  execAsync(["bash", "-c", "command -v checkupdates >/dev/null || exit 9; checkupdates 2>/dev/null | wc -l"])
    .then((out) => setUpdates(Number(out.trim())))
    .catch(() => setUpdates(-1))
}
checkUpdates()
setInterval(checkUpdates, 30 * 60_000) // every 30 minutes

// ── CPU ──────────────────────────────────────────────────────────────
export const threads = GLib.get_num_processors()
let prev = { idle: 0, total: 0 }
export const cpu = createPoll(0, 2000, () => {
  const nums = (read("/proc/stat")?.split("\n")[0] ?? "").trim().split(/\s+/).slice(1).map(Number)
  const idle = (nums[3] ?? 0) + (nums[4] ?? 0)
  const total = nums.reduce((a, b) => a + b, 0)
  const dIdle = idle - prev.idle
  const dTotal = total - prev.total
  prev = { idle, total }
  return dTotal > 0 ? (1 - dIdle / dTotal) * 100 : 0
})

// ── Memory ───────────────────────────────────────────────────────────
export const memory = createPoll({ percent: 0, used: 0, total: 0 }, 2000, () => {
  const info = read("/proc/meminfo") ?? ""
  const kb = (key: string) => Number(info.match(new RegExp(`^${key}:\\s+(\\d+)`, "m"))?.[1] ?? 0)
  const total = kb("MemTotal") * 1024
  const used = total - kb("MemAvailable") * 1024
  return { percent: total ? (used / total) * 100 : 0, used: used / GB, total: total / GB }
})

// ── Disk (/) ─────────────────────────────────────────────────────────
export const disk = createPoll({ percent: 0, free: 0 }, 15_000, () => {
  try {
    const info = Gio.File.new_for_path("/").query_filesystem_info("filesystem::size,filesystem::free", null)
    const size = info.get_attribute_uint64("filesystem::size")
    const free = info.get_attribute_uint64("filesystem::free")
    return { percent: size ? ((size - free) / size) * 100 : 0, free: free / GB }
  } catch {
    return { percent: 0, free: 0 }
  }
})

// ── Temperatures ─────────────────────────────────────────────────────
// Sensors are found by name because hwmon numbers can change between boots.
function sensorTemps(): Record<string, number> {
  const out: Record<string, number> = {}
  try {
    const dir = GLib.Dir.open("/sys/class/hwmon", 0)
    let entry: string | null
    while ((entry = dir.read_name()) !== null) {
      const base = `/sys/class/hwmon/${entry}`
      const name = read(`${base}/name`)?.trim()
      const temp = Number(read(`${base}/temp1_input`))
      if (name && !(name in out) && temp) out[name] = Math.round(temp / 1000)
    }
    dir.close()
  } catch {}
  return out
}

const pick = (t: Record<string, number>, names: string[]) =>
  names.map((n) => t[n]).find((v) => v !== undefined) ?? null

type Temps = { cpu: number | null; gpu: number | null; memory: number | null; nvme: number | null }
export const temps = createPoll<Temps>({ cpu: null, gpu: null, memory: null, nvme: null }, 3000, () => {
  const t = sensorTemps()
  return {
    cpu: pick(t, ["k10temp", "zenpower", "coretemp"]),
    gpu: pick(t, ["amdgpu", "nouveau"]),
    memory: pick(t, ["spd5118", "jc42"]), // only some RAM sticks have a sensor
    nvme: pick(t, ["nvme"]),
  }
})

// ── GPU (amdgpu) ─────────────────────────────────────────────────────
// Usage and VRAM from /sys/class/drm/card*/device (the first card that reports them)
function gpuDevice(): string | null {
  try {
    const dir = GLib.Dir.open("/sys/class/drm", 0)
    let entry: string | null
    while ((entry = dir.read_name()) !== null) {
      if (!/^card\d+$/.test(entry)) continue
      const dev = `/sys/class/drm/${entry}/device`
      if (read(`${dev}/gpu_busy_percent`) !== null) {
        dir.close()
        return dev
      }
    }
    dir.close()
  } catch {}
  return null
}
const gpuDev = gpuDevice()

export const gpu = createPoll({ percent: 0, vramUsed: 0, vramTotal: 0 }, 2000, () => {
  if (!gpuDev) return { percent: 0, vramUsed: 0, vramTotal: 0 }
  return {
    percent: Number(read(`${gpuDev}/gpu_busy_percent`) ?? 0),
    vramUsed: Number(read(`${gpuDev}/mem_info_vram_used`) ?? 0) / GB,
    vramTotal: Number(read(`${gpuDev}/mem_info_vram_total`) ?? 0) / GB,
  }
})
