// Installed-package counts per package manager (configured in config.ts).
// Each manager is its own job in the dashboard queue, so they run one at a
// time. Counted when the dashboard opens if older than refreshMinutes.
import { createState, createComputed } from "ags"
import { execAsync } from "ags/process"
import { createJob } from "./scheduler"
import { PACKAGES } from "../config"

// AGS may start with a minimal PATH; user-level tool dirs are added here.
const PATH = 'export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$HOME/go/bin:$HOME/.bun/bin:$PATH"'

function countOne(m: { when: string; count: string }): Promise<number | null> {
  const script = `${PATH}\n${m.when} >/dev/null 2>&1 || exit 3\n${m.count}`
  // timeout: a broken manager (e.g. snapd not running) can't hang the queue
  return execAsync(["timeout", "20", "bash", "-c", script])
    .then((out) => {
      const n = parseInt(out.trim().split("\n").pop() ?? "", 10)
      return Number.isFinite(n) ? n : null
    })
    .catch(() => null)
}

const countedAt: number[] = PACKAGES.managers.map(() => 0)

export const managers = PACKAGES.managers.map((m, i) => {
  const [count, setCount] = createState<number | null>(null) // null = not installed
  const [checked, setChecked] = createState(false) // counted at least once
  const job = createJob(() =>
    countOne(m).then((n) => {
      setCount(n)
      setChecked(true)
      countedAt[i] = Date.now()
    }),
  )
  return { name: m.name, icon: m.icon, tooltip: m.tooltip ?? "", count, checked, job }
})

// For the card header
export const anyBusy = createComputed(() => managers.some((m) => m.job.busy()))
export const total = createComputed(() => managers.reduce((s, m) => s + (m.count() ?? 0), 0))
export const firstRun = createComputed(() => managers.every((m) => !m.checked()))
export const noneFound = createComputed(() => managers.every((m) => m.checked() && m.count() === null))

export function refreshPackages(force = false) {
  const stale = PACKAGES.refreshMinutes * 60_000
  managers.forEach((m, i) => {
    if (force || Date.now() - countedAt[i] > stale) m.job.schedule({ manual: force })
  })
}
