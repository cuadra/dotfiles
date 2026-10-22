import { Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
import { createState, createComputed } from "ags"
import { date } from "../../lib/system"

type Cell = { day: number; other: boolean; today: boolean; weekend: boolean }

// Month grid, Monday first. Arrows move between months; reopening resets to today.
const [offset, setOffset] = createState(0)
const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY",
  "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]

const view = createComputed(() => {
  date() // recompute when the day changes
  const now = GLib.DateTime.new_now_local()
  const shown = now.add_months(offset())!
  const y = shown.get_year()
  const m = shown.get_month() // 1..12
  const first = GLib.DateTime.new_local(y, m, 1, 0, 0, 0)!
  const lead = first.get_day_of_week() - 1 // Mon=1 -> 0 leading days
  const start = first.add_days(-lead)!
  const cells: Cell[] = []
  for (let i = 0; i < 42; i++) {
    const d = start.add_days(i)!
    cells.push({
      day: d.get_day_of_month(),
      other: d.get_month() !== m,
      today: d.get_year() === now.get_year() && d.get_day_of_year() === now.get_day_of_year(),
      weekend: d.get_day_of_week() >= 6,
    })
  }
  return { title: `${MONTHS[m - 1]} ${y}`, cells }
})

function cellClass(c: Cell) {
  return ["cal-day", c.other && "other", c.today && "today", c.weekend && "weekend"].filter(Boolean).join(" ")
}

export function resetCalendar() {
  setOffset(0)
}

export default function Calendar() {
  const rows = [0, 1, 2, 3, 4, 5]
  const cols = [0, 1, 2, 3, 4, 5, 6]
  return (
    <box class="dash-card calendar" orientation={Gtk.Orientation.VERTICAL} spacing={10}>
      <box>
        <label class="cal-title" label={view((v) => v.title)} hexpand xalign={0} />
        <button class="cal-nav" tooltipText="Previous month" onClicked={() => setOffset((o) => o - 1)}>
          <label label={""} />
        </button>
        <button class="cal-nav" tooltipText="Next month" onClicked={() => setOffset((o) => o + 1)}>
          <label label={""} />
        </button>
      </box>
      <box homogeneous>
        {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((d) => (
          <label class="cal-weekday" label={d} />
        ))}
      </box>
      {rows.map((r) => (
        <box homogeneous>
          {cols.map((c) => {
            const cell = view((v) => v.cells[r * 7 + c])
            return (
              <box halign={Gtk.Align.CENTER}>
                <label class={cell(cellClass)} label={cell((x) => String(x.day))} />
              </box>
            )
          })}
        </box>
      ))}
    </box>
  )
}
