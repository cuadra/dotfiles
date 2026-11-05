// Fan speeds for the dashboard, read from the motherboard's sensor chip
// (/sys/class/hwmon, it87 driver). Plain file reads every few seconds, and
// only while the dashboard is open (lib/scheduler.ts).
import GLib from "gi://GLib"
import { livePoll } from "./scheduler"
import { FANS } from "../config"

export type Fan = { name: string; rpm: number | null } // null = couldn't read
export type FanState = { status: "unknown" | "ok" | "missing"; fans: Fan[] }

const decoder = new TextDecoder()
function read(path: string): string | null {
  try {
    const [ok, bytes] = GLib.file_get_contents(path)
    return ok ? decoder.decode(bytes).trim() : null
  } catch {
    return null
  }
}

// hwmon numbers can change between boots, so the chip is found by name
let chip: string | null = null
function findChip(): string | null {
  try {
    const dir = GLib.Dir.open("/sys/class/hwmon", 0)
    let entry: string | null
    while ((entry = dir.read_name()) !== null) {
      const base = `/sys/class/hwmon/${entry}`
      if (read(`${base}/name`)?.startsWith(FANS.chip)) {
        dir.close()
        return base
      }
    }
    dir.close()
  } catch {}
  return null
}

export const fans = livePoll<FanState>(
  { status: "unknown", fans: FANS.fans.map((f) => ({ name: f.name, rpm: null })) },
  FANS.pollMs,
  () => {
    if (!chip || !read(`${chip}/name`)?.startsWith(FANS.chip)) chip = findChip()
    if (!chip) return { status: "missing", fans: FANS.fans.map((f) => ({ name: f.name, rpm: null })) }
    return {
      status: "ok",
      fans: FANS.fans.map((f) => {
        const v = read(`${chip}/fan${f.index}_input`)
        const n = v === null ? NaN : Number(v)
        return { name: f.name, rpm: Number.isFinite(n) ? n : null }
      }),
    }
  },
)
