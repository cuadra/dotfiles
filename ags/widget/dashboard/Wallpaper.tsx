import { Gtk } from "ags/gtk4"
import Gio from "gi://Gio"
import GLib from "gi://GLib"
import { wallpaper, wallpaperThumb, setWallpaper } from "../../lib/wallpaper"

const ICON = "\u{f0e09}" // nf-md-image_edit
const HEIGHT = 100 // preview height in px; the width follows the left column

// Opens a file picker on the current wallpaper. The dashboard is closed first:
// it's a full-screen overlay with exclusive keyboard, so it would cover the dialog.
function pick(onOpen: () => void) {
  onOpen()
  const images = new Gtk.FileFilter({ name: "Images" })
  images.add_pixbuf_formats()
  const filters = new Gio.ListStore({ itemType: Gtk.FileFilter.$gtype })
  filters.append(images)

  const dialog = new Gtk.FileDialog({ title: "Choose a wallpaper", modal: true, filters, defaultFilter: images })
  const current = wallpaper.get()
  if (current && GLib.file_test(current, GLib.FileTest.EXISTS)) dialog.initialFile = Gio.File.new_for_path(current)

  dialog.open(null, null, (_d, res) => {
    try {
      const file = dialog.open_finish(res)
      const p = file?.get_path()
      if (p && p !== current) setWallpaper(p)
    } catch {} // dialog dismissed
  })
}

// Bottom-left: preview of the current wallpaper; click to pick a new one
export default function Wallpaper({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      class="wallpaper"
      overflow={Gtk.Overflow.HIDDEN}
      tooltipText={wallpaper((p) => (p ? `${GLib.path_get_basename(p)} · click to change` : "Choose a wallpaper"))}
      onClicked={() => pick(onOpen)}
    >
      <overlay>
        {/* Sets the preview's size. The image sits on top as an overlay, and
            overlays don't count toward size, so a big image can't stretch the
            column. Change HEIGHT to resize the preview. */}
        <box hexpand heightRequest={HEIGHT} />
        <Gtk.Picture
          $type="overlay"
          class="wallpaper-img"
          paintable={wallpaperThumb}
          contentFit={Gtk.ContentFit.COVER}
          canShrink
          hexpand
          vexpand
        />
        <label
          $type="overlay"
          class="wallpaper-empty"
          label="No wallpaper found"
          visible={wallpaperThumb((t) => t === null)}
        />
        <box $type="overlay" class="wallpaper-hint" spacing={8} valign={Gtk.Align.END}>
          <label label={ICON} />
          <label label="Change wallpaper" hexpand xalign={0} />
        </box>
      </overlay>
    </button>
  )
}
