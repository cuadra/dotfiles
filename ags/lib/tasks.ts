// Taskwarrior tasks for the dashboard. Read once each time the dashboard
// opens (and after you complete one), through the dashboard job queue
// (lib/scheduler.ts) — not polled.
import { createState } from "ags"
import { execAsync } from "ags/process"
import { createJob } from "./scheduler"

export type Task = {
  uuid: string
  description: string
  project: string
  priority: string // "H" | "M" | "L" | ""
  due: Date | null
  urgency: number
}
export type TaskList = { available: boolean; loaded: boolean; tasks: Task[] }

const [tasks, setTasks] = createState<TaskList>({ available: true, loaded: false, tasks: [] })
export { tasks }

const TASK = ["task", "rc.verbose=nothing", "rc.confirmation=off"]

// Taskwarrior dates look like 20261030T040000Z (UTC)
function parseDate(s?: string): Date | null {
  const m = s?.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/)
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])) : null
}

export const tasksJob = createJob(() =>
  // Pending and not hidden by a wait date, most urgent first
  execAsync([...TASK, "status:pending", "-WAITING", "export"])
    .then((out) => {
      const list: any[] = JSON.parse(out || "[]")
      setTasks({
        available: true,
        loaded: true,
        tasks: list
          .map((t) => ({
            uuid: t.uuid,
            description: t.description ?? "",
            project: t.project ?? "",
            priority: t.priority ?? "",
            due: parseDate(t.due),
            urgency: Number(t.urgency ?? 0),
          }))
          .sort((a, b) => b.urgency - a.urgency),
      })
    })
    .catch(() => setTasks({ available: false, loaded: true, tasks: [] })), // task not installed / broken
)

export function refreshTasks(manual = false) {
  tasksJob.schedule({ manual })
}

export function markDone(task: Task) {
  // Drop it from the card right away, then re-read
  setTasks({ ...tasks.get(), tasks: tasks.get().tasks.filter((t) => t.uuid !== task.uuid) })
  execAsync([...TASK, task.uuid, "done"])
    .then(() => execAsync(["notify-send", "-a", "Taskwarrior", "Task done", `${task.description}\n(task undo to revert)`]))
    .catch(() => {})
    .finally(() => refreshTasks())
}

// "overdue 2d", "today", "tomorrow", "Fri", "Nov 12"
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
export function dueLabel(due: Date): { text: string; cls: string } {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((day(due) - day(new Date())) / 86_400_000)
  if (days < 0 || (days === 0 && due.getTime() < Date.now() && due.getHours() + due.getMinutes() > 0))
    return { text: days < 0 ? `overdue ${-days}d` : "overdue", cls: "overdue" }
  if (days === 0) return { text: "due today", cls: "due-soon" }
  if (days === 1) return { text: "due tomorrow", cls: "due-soon" }
  if (days < 7) return { text: `due ${DAYS[due.getDay()]}`, cls: "" }
  return { text: `due ${MONTHS[due.getMonth()]} ${due.getDate()}`, cls: "" }
}
