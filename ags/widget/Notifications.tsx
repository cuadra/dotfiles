import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createState, For } from "ags"
import Pango from "gi://Pango"
import AstalNotifd from "gi://AstalNotifd"
import AstalHyprland from "gi://AstalHyprland"
import { NOTIFY } from "../config"

// AGS is the notification server (replaces swaync). Popups appear top-right,
// level with the bar, and disappear after their timeout.

type Popup = {
  key: string // same key = replaces the existing popup instead of stacking
  summary: string
  body: string
  urgency: AstalNotifd.Urgency
  notification?: AstalNotifd.Notification
}

const [popups, setPopups] = createState<Popup[]>([])
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function remove(key: string) {
  clearTimeout(timers.get(key))
  timers.delete(key)
  const p = popups.get().find((x) => x.key === key)
  setPopups((list) => list.filter((x) => x.key !== key))
  // Hyprland's own popups (e.g. "Layout: …") don't belong in the history.
  // (Removed from the list first, so the "resolved" signal this fires is a no-op.)
  if (p?.notification && key.startsWith("hypr:")) p.notification.dismiss()
}

function show(popup: Popup, timeout: number) {
  setPopups((list) => {
    const i = list.findIndex((p) => p.key === popup.key)
    if (i < 0) return [popup, ...list] // newest on top
    const copy = [...list]
    copy[i] = popup
    return copy
  })
  clearTimeout(timers.get(popup.key))
  if (timeout > 0)
    timers.set(
      popup.key,
      setTimeout(() => remove(popup.key), timeout),
    )
}

// ── Notifications from apps (notify-send, browsers, …) ────────────────
const notifd = AstalNotifd.get_default()
// Keep notifications until they're dismissed, so the dashboard can show a
// history. Popups still disappear on their own timers (below).
notifd.ignoreTimeout = true
const { LOW, CRITICAL } = AstalNotifd.Urgency

notifd.connect("notified", (_, id: number) => {
  const n = notifd.get_notification(id)
  if (!n) return
  // Hyprland popups (e.g. "Layout: scrolling" from toggle.sh) replace each other
  const key =
    n.appName === "Hyprland" ? `hypr:${n.summary.split(/[: ]/)[0]}` : `n${id}`
  const timeout =
    n.urgency === CRITICAL
      ? 0
      : n.expireTimeout > 0
        ? n.expireTimeout
        : n.urgency === LOW
          ? NOTIFY.lowTimeout
          : NOTIFY.timeout
  show(
    {
      key,
      summary: n.summary,
      body: n.body,
      urgency: n.urgency,
      notification: n,
    },
    timeout,
  )
})

notifd.connect("resolved", (_, id: number) => {
  const p = popups.get().find((x) => x.notification?.id === id)
  if (p) remove(p.key)
})

// ── Workspace switches (replaces notify-events.sh) ────────────────────
const hypr = AstalHyprland.get_default()
let lastWorkspace = hypr.focusedWorkspace?.id
hypr.connect("notify::focused-workspace", () => {
  const ws = hypr.focusedWorkspace
  if (!ws || ws.id === lastWorkspace) return
  lastWorkspace = ws.id
  show(
    {
      key: "hypr:Workspace",
      summary: `Workspace ${ws.name}`,
      body: "",
      urgency: AstalNotifd.Urgency.NORMAL,
    },
    NOTIFY.hyprTimeout,
  )
})

// ── Popup widget ──────────────────────────────────────────────────────
function PopupView({ p }: { p: Popup }) {
  const close = () =>
    p.notification ? p.notification.dismiss() : remove(p.key)
  const urgency =
    p.urgency === CRITICAL ? "critical" : p.urgency === LOW ? "low" : "normal"

  return (
    <box
      class={`notification ${urgency}`}
      widthRequest={NOTIFY.width}
      spacing={12}
    >
      <box
        orientation={Gtk.Orientation.VERTICAL}
        valign={Gtk.Align.CENTER}
        hexpand
      >
        <label
          class="summary"
          label={p.summary}
          xalign={0}
          ellipsize={Pango.EllipsizeMode.END}
        />
        {p.body !== "" && (
          <label
            class="body"
            label={p.body}
            xalign={0}
            wrap
            maxWidthChars={50}
          />
        )}
      </box>
      <button
        class="close"
        valign={Gtk.Align.CENTER}
        tooltipText="Dismiss"
        onClicked={() => close()}
      >
        <label label={NOTIFY.closeIcon} />
      </button>
    </box>
  )
}

export default function Notifications(gdkmonitor: Gdk.Monitor) {
  const { TOP, RIGHT } = Astal.WindowAnchor
  return (
    <window
      name="notifications"
      namespace="ags-notifications"
      class="Notifications"
      gdkmonitor={gdkmonitor}
      anchor={TOP | RIGHT}
      layer={Astal.Layer.OVERLAY}
      // Ignore other windows' reserved space so the first popup sits level with the bar
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.NONE}
      application={app}
      visible={popups((list) => list.length > 0)}
    >
      <box orientation={Gtk.Orientation.VERTICAL} spacing={10}>
        <For each={popups}>{(p) => <PopupView p={p} />}</For>
      </box>
    </window>
  )
}
