// systemd service state for the dashboard's start/stop shortcut tiles
// (Docker, Postgres, ...). `systemctl is-active <unit>` runs through the
// dashboard job queue: once when it opens, then every pollMs while it's open.
import { createState, Accessor } from "ags"
import { execAsync } from "ags/process"
import { createJob, whileOpen, Job } from "./scheduler"

// "unknown" = not checked yet (first open)
export type ServiceState = "unknown" | "running" | "stopped" | "starting" | "stopping"

export type ServiceConfig = {
  name: string // shown in the tooltip
  icon: string
  unit: string // unit checked with systemctl is-active
  start: string
  stop: string
  pollMs: number // re-check interval while the dashboard is open
}

export type Service = ServiceConfig & {
  state: Accessor<ServiceState>
  job: Job // job.busy drives the loading indicator
  refresh: () => void
  toggle: () => void
}

export function createService(cfg: ServiceConfig): Service {
  const [state, setState] = createState<ServiceState>("unknown")
  let pending = false

  const job = createJob(() =>
    execAsync(["systemctl", "is-active", cfg.unit])
      .then((out) => out.trim() === "active")
      .catch(() => false) // is-active exits non-zero when inactive
      .then((active) => {
        const cur = state.get()
        // While a start/stop is in flight, keep the "…ing" state until it lands
        if (pending && ((cur === "starting" && !active) || (cur === "stopping" && active))) return
        pending = false
        setState(active ? "running" : "stopped")
      }),
  )
  const refresh = () => job.schedule()
  // The first check is queued by the dashboard on open (in order with the
  // other jobs); these are the re-checks while it stays open.
  whileOpen(cfg.pollMs, refresh, { immediate: false, firstDelay: cfg.pollMs })

  function toggle() {
    const running = state.get() === "running" || state.get() === "starting"
    pending = true
    setState(running ? "stopping" : "starting")
    execAsync(["bash", "-c", `setsid -f ${running ? cfg.stop : cfg.start} >/dev/null 2>&1`])
    // Give up waiting after 60s (e.g. the sudo prompt was closed). If the
    // dashboard is closed by then, the next open re-checks anyway.
    setTimeout(() => {
      pending = false
      refresh()
    }, 60_000)
  }

  return { ...cfg, state, job, refresh, toggle }
}
