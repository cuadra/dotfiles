// Dashboard scheduler: nothing here runs while the dashboard is closed.
//
// livePoll  — cheap in-process readings (clock, /proc, /sys, in-memory state).
//             Tick on open, then on an interval only while the dashboard is open.
// whileOpen — run something on an interval only while the dashboard is open.
// createJob — anything that starts a process or does I/O (systemctl, ip,
//             task, package managers, checkupdates). Jobs go through one
//             queue, run one at a time with a short gap between them, and
//             expose a `busy` accessor for loading indicators.
import { createState, createComputed, Accessor } from "ags"

const GAP_MS = 80 // pause between queued jobs, so nothing piles up at once

// ── Open / closed ────────────────────────────────────────────────────
const [open, setOpen] = createState(false)
export const dashboardOpen = open

type Live = { start: () => void; stop: () => void }
const live: Live[] = []

export function setDashboardOpen(v: boolean) {
  if (v === open.get()) return
  setOpen(v)
  if (v) live.forEach((l) => l.start())
  else {
    live.forEach((l) => l.stop())
    dropQueued() // don't keep fetching for a closed dashboard
    jobs.forEach((j) => j.markStale())
  }
}

// ── Interval only while open ─────────────────────────────────────────
export function whileOpen(ms: number, fn: () => void, opts: { immediate?: boolean; firstDelay?: number } = {}) {
  let first: ReturnType<typeof setTimeout> | null = null
  let every: ReturnType<typeof setInterval> | null = null
  live.push({
    start() {
      first = setTimeout(() => {
        first = null
        if (opts.immediate !== false) fn()
        every = setInterval(fn, ms)
      }, opts.firstDelay ?? 0)
    },
    stop() {
      if (first) clearTimeout(first)
      if (every) clearInterval(every)
      first = every = null
    },
  })
}

// Same idea as ags/time createPoll, but paused while the dashboard is closed
export function livePoll<T>(
  init: T,
  ms: number,
  fn: (prev: T) => T,
  opts: { onOpen?: () => void; firstDelay?: number } = {},
): Accessor<T> {
  const [value, set] = createState<T>(init)
  const tick = () => {
    try {
      set(fn(value.get()))
    } catch {}
  }
  if (opts.onOpen) live.push({ start: opts.onOpen, stop: () => {} })
  whileOpen(ms, tick, { firstDelay: opts.firstDelay })
  return value
}

// ── Job queue ────────────────────────────────────────────────────────
export type JobState = "idle" | "queued" | "loading"

type Internal = {
  state: Accessor<JobState>
  setState: (s: JobState) => void
  run: () => Promise<unknown>
  markStale: () => void
}
const jobs: Internal[] = []
const queue: Internal[] = []
let running = false
let nextAt = 0 // earliest time the next job may start (enforces GAP_MS)
let waiting: ReturnType<typeof setTimeout> | null = null

function pump() {
  if (running || waiting || !queue.length) return
  const wait = nextAt - Date.now()
  if (wait > 0) {
    waiting = setTimeout(() => {
      waiting = null
      pump()
    }, wait)
    return
  }
  const job = queue.shift()!
  running = true
  job.setState("loading")
  job
    .run()
    .catch(() => {})
    .finally(() => {
      job.setState("idle")
      running = false
      nextAt = Date.now() + GAP_MS
      pump()
    })
}

function dropQueued() {
  queue.splice(0).forEach((j) => j.setState("idle"))
}

export type Job = {
  state: Accessor<JobState>
  // true while this job is queued/running AND the card has no fresh data
  // since the dashboard opened (or since a manual refresh). Background
  // re-checks while open (e.g. every 3s) don't flash the indicator.
  busy: Accessor<boolean>
  schedule: (opts?: { manual?: boolean }) => void
}

export function createJob(run: () => Promise<unknown>): Job {
  const [state, setState] = createState<JobState>("idle")
  const [fresh, setFresh] = createState(false)
  const internal: Internal = {
    state,
    setState,
    run: () => run().finally(() => setFresh(true)),
    markStale: () => setFresh(false),
  }
  jobs.push(internal)
  const busy = createComputed(() => state() !== "idle" && !fresh())
  return {
    state,
    busy,
    schedule(opts = {}) {
      if (!open.get()) return
      if (opts.manual) setFresh(false)
      if (state.get() !== "idle") return // already queued or running
      setState("queued")
      queue.push(internal)
      pump()
    },
  }
}
