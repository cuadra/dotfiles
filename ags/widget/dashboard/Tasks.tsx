import { Gtk } from "ags/gtk4"
import Pango from "gi://Pango"
import { execAsync } from "ags/process"
import { tasks, tasksJob, markDone, dueLabel, refreshTasks } from "../../lib/tasks"
import { TASKS } from "../../config"

const V = Gtk.Orientation.VERTICAL

// Most urgent pending Taskwarrior tasks. Circle = mark done,
// text = open the task's details in a floating terminal.
export default function Tasks({ onOpen }: { onOpen: () => void }) {
  const launch = (cmd: string) => {
    onOpen() // close the dashboard
    execAsync(["bash", "-c", `setsid -f ${cmd} >/dev/null 2>&1`])
  }
  const count = tasks((l) => l.tasks.length)

  return (
    <box class="dash-card" orientation={V} spacing={12} visible={tasks((l) => l.available)}>
      <box spacing={8}>
        <label class="dash-title" label="TASKS" hexpand xalign={0} />
        <label class="dash-meta" label={count((n) => `${n} pending`)} visible={count((n) => n > 0)} />
        <button class="dash-refresh" tooltipText="Read again" valign={Gtk.Align.CENTER} onClicked={() => refreshTasks(true)}>
          <label class={tasksJob.busy((b) => (b ? "busy" : ""))} label={"\u{f0450}"} />
        </button>
        <button class="task-all" tooltipText="Open the full task list" valign={Gtk.Align.CENTER} onClicked={() => launch(TASKS.list)}>
          <label label="all ›" />
        </button>
      </box>
      <label class="task-meta loading-text" label="Loading…" xalign={0} visible={tasks((l) => !l.loaded)} />
      <label class="task-meta" label="Nothing pending" xalign={0} visible={tasks((l) => l.loaded && l.tasks.length === 0)} />
      <box orientation={V} spacing={8} class={tasksJob.busy((b) => (b ? "loading" : ""))}>
        {Array.from({ length: TASKS.limit }, (_, i) => {
          const task = tasks((l) => l.tasks[i] ?? null)
          const due = task((t) => (t?.due ? dueLabel(t.due) : null))
          return (
            <box spacing={10} visible={task((t) => t !== null)}>
              <button
                class={task((t) => `task-check prio-${t?.priority || "none"}`)}
                valign={Gtk.Align.START}
                tooltipText="Mark done"
                onClicked={() => {
                  const t = task.get()
                  if (t) markDone(t)
                }}
              />
              <button
                class="task-open"
                hexpand
                tooltipText={task((t) => t?.description ?? "")}
                onClicked={() => {
                  const t = task.get()
                  if (t) launch(TASKS.info.replace("{uuid}", t.uuid))
                }}
              >
                <box orientation={V} spacing={2}>
                  <label
                    class="task-desc"
                    label={task((t) => t?.description ?? "")}
                    xalign={0}
                    ellipsize={Pango.EllipsizeMode.END}
                    maxWidthChars={24}
                  />
                  <box spacing={6} visible={task((t) => !!(t?.project || t?.due))}>
                    <label class="task-meta" label={task((t) => t?.project ?? "")} visible={task((t) => !!t?.project)} />
                    <label class="task-meta" label="·" visible={task((t) => !!(t?.project && t?.due))} />
                    <label class={due((d) => `task-meta ${d?.cls ?? ""}`)} label={due((d) => d?.text ?? "")} visible={due((d) => d !== null)} />
                  </box>
                </box>
              </button>
            </box>
          )
        })}
      </box>
    </box>
  )
}
