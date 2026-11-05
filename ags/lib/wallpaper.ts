// Current wallpaper (read from hyprpaper.conf) + switching it.
// Nothing runs in the background: the config is read when the dashboard
// opens, and the thumbnail is only decoded when the path actually changed.
import GLib from "gi://GLib"
import GdkPixbuf from "gi://GdkPixbuf"
import { Gdk } from "ags/gtk4"
import { createState } from "ags"
import { readFile, writeFile } from "ags/file"
import { execAsync } from "ags/process"

const HOME = GLib.get_home_dir()
const HYPRPAPER = `${HOME}/.config/hypr/hyprpaper.conf`
const HYPRLOCK = `${HOME}/.config/hypr/hyprlock.conf` // lock screen uses the same image
const THUMB_WIDTH = 640 // ~2x the preview's width, so it stays sharp

const expand = (p: string) => p.replace(/^~(?=\/)/, HOME)
const tilde = (p: string) => (p.startsWith(HOME + "/") ? "~" + p.slice(HOME.length) : p)

const [path, setPath] = createState("")
const [thumb, setThumb] = createState<Gdk.Texture | null>(null)
export const wallpaper = path
export const wallpaperThumb = thumb

// Supports the block syntax (wallpaper { monitor = … path = … }) and the old
// one-liner (wallpaper = DP-1,/path)
function readConfig(): { monitor: string; path: string } {
  try {
    const conf = readFile(HYPRPAPER)
    const block = conf.match(/^\s*path\s*=\s*(.+?)\s*$/m)
    const line = conf.match(/^\s*wallpaper\s*=\s*([^,]*),\s*(.+?)\s*$/m)
    const monitor = conf.match(/^\s*monitor\s*=\s*(.+?)\s*$/m)?.[1] ?? line?.[1]?.trim() ?? ""
    return { monitor, path: expand(block?.[1] ?? line?.[2] ?? "") }
  } catch {
    return { monitor: "", path: "" }
  }
}

function show(p: string) {
  if (p === path.get()) return
  setPath(p)
  // Decode after the dashboard has drawn, so opening it stays smooth
  GLib.idle_add(GLib.PRIORITY_LOW, () => {
    try {
      const pb = GdkPixbuf.Pixbuf.new_from_file_at_scale(p, THUMB_WIDTH, -1, true)
      setThumb(Gdk.Texture.new_for_pixbuf(pb))
    } catch {
      setThumb(null) // missing / unreadable file
    }
    return GLib.SOURCE_REMOVE
  })
}

// Called when the dashboard opens (a small file read, no process)
export function refreshWallpaper() {
  show(readConfig().path)
}

function rewrite(file: string, fn: (s: string) => string) {
  try {
    const before = readFile(file)
    const after = fn(before)
    if (after !== before) writeFile(file, after)
  } catch {}
}

export async function setWallpaper(newPath: string) {
  const { monitor } = readConfig()
  const value = tilde(newPath)

  // Save it so it survives a restart/login
  rewrite(HYPRPAPER, (s) =>
    s
      .replace(/^(\s*path\s*=\s*).*$/m, (_m, pre) => pre + value)
      .replace(/^(\s*preload\s*=\s*).*$/gm, (_m, pre) => pre + value)
      .replace(/^(\s*wallpaper\s*=\s*[^,]*,\s*).*$/gm, (_m, pre) => pre + value),
  )
  rewrite(HYPRLOCK, (s) => s.replace(/(background\s*\{[^}]*?\n\s*path\s*=\s*)[^\n]*/, (_m, pre) => pre + value))

  // Apply now: try hyprpaper's IPC first (no flicker); if this hyprpaper
  // doesn't accept it, restart hyprpaper so it reloads the saved config.
  let applied = false
  try {
    const out = await execAsync(["hyprctl", "hyprpaper", "wallpaper", `${monitor},${newPath}`])
    applied = out.trim() === "ok"
  } catch {}
  if (!applied) {
    await execAsync([
      "bash",
      "-c",
      "pkill -x hyprpaper; for i in $(seq 30); do pgrep -x hyprpaper >/dev/null || break; sleep 0.1; done; setsid -f hyprpaper >/dev/null 2>&1",
    ]).catch(() => {})
  }

  show(newPath)
  execAsync(["notify-send", "-a", "Wallpaper", "Wallpaper updated", GLib.path_get_basename(newPath)]).catch(() => {})
}
