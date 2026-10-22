import app from "ags/gtk4/app"
import style from "./style.scss"
import Bar from "./widget/Bar"
import Dashboard from "./widget/Dashboard"
import Notifications from "./widget/Notifications"

app.start({
  css: style,
  main() {
    const monitor = app.get_monitors()[0] // DP-1
    Bar(monitor)
    Dashboard(monitor) // hidden until "ags toggle dashboard" (Super+D)
    Notifications(monitor) // notification server + popups (replaces swaync)
  },
})
