import { Gtk, Gdk } from "ags/gtk4"
import Pango from "gi://Pango"
import GLib from "gi://GLib"
import AstalNotifd from "gi://AstalNotifd"
import { createBinding, For } from "ags"
import { createPoll } from "ags/time"

const notifd = AstalNotifd.get_default()
const notifications = createBinding(notifd, "notifications")
const sorted = notifications((list) => [...list].sort((a, b) => b.time - a.time)) // newest first
const now = createPoll(Math.floor(Date.now() / 1000), 30_000, () => Math.floor(Date.now() / 1000))

function ago(time: number, nowSecs: number) {
  const s = Math.max(0, nowSecs - time)
  if (s < 60) return "now"
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

// App icon if the theme has one, else the notification's image, else a letter tile
function NotifIcon({ n }: { n: AstalNotifd.Notification }) {
  const theme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default()!)
  const names = [n.appIcon, n.desktopEntry, n.appName?.toLowerCase()].filter((x): x is string => !!x)
  const iconName = names.find((name) => theme.has_icon(name))
  const image = n.image?.replace(/^file:\/\//, "")

  if (iconName) return <image class="notif-icon" iconName={iconName} pixelSize={22} />
  if (image && GLib.file_test(image, GLib.FileTest.EXISTS)) return <image class="notif-icon" file={image} pixelSize={22} />
  return <label class="notif-icon letter" label={(n.appName || "?").charAt(0).toUpperCase()} />
}

function NotificationItem({ n }: { n: AstalNotifd.Notification }) {
  return (
    <box class="notif-item" spacing={12}>
      <box valign={Gtk.Align.START}>
        <NotifIcon n={n} />
      </box>
      <box orientation={Gtk.Orientation.VERTICAL} hexpand spacing={2}>
        <box>
          <label class="notif-app" label={n.appName || "Notification"} hexpand xalign={0} ellipsize={Pango.EllipsizeMode.END} maxWidthChars={20} />
          <label class="notif-time" label={now((t) => ago(n.time, t))} />
          <button class="notif-dismiss" tooltipText="Dismiss" onClicked={() => n.dismiss()}>
            <label label={""} />
          </button>
        </box>
        <label class="notif-summary" label={n.summary} xalign={0} wrap wrapMode={Pango.WrapMode.WORD_CHAR} maxWidthChars={28} />
        <label class="notif-body" label={n.body} xalign={0} wrap wrapMode={Pango.WrapMode.WORD_CHAR} maxWidthChars={32} visible={n.body !== ""} lines={3} ellipsize={Pango.EllipsizeMode.END} />
      </box>
    </box>
  )
}

// Scrollable notification history (right side of the dashboard)
export default function NotificationList() {
  return (
    <box class="dash-card notif-panel" orientation={Gtk.Orientation.VERTICAL} spacing={12} widthRequest={320} hexpand={false} vexpand>
      <box spacing={8}>
        <label class="dash-title" label="NOTIFICATIONS" />
        <label class="notif-count" label={notifications((l) => String(l.length))} visible={notifications((l) => l.length > 0)} />
        <box hexpand />
        <button
          class="notif-clear"
          visible={notifications((l) => l.length > 0)}
          onClicked={() => notifd.notifications.forEach((n) => n.dismiss())}
        >
          <label label="Clear all" />
        </button>
      </box>
      <label class="launcher-hint" label="No notifications" visible={notifications((l) => l.length === 0)} vexpand valign={Gtk.Align.CENTER} />
      <Gtk.ScrolledWindow vexpand hscrollbarPolicy={Gtk.PolicyType.NEVER} propagateNaturalHeight={false} visible={notifications((l) => l.length > 0)}>
        <box orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <For each={sorted}>{(n) => <NotificationItem n={n} />}</For>
        </box>
      </Gtk.ScrolledWindow>
    </box>
  )
}
