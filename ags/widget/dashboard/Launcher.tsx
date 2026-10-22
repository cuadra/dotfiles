import { Gtk, Gdk } from "ags/gtk4"
import AstalApps from "gi://AstalApps"
import { createState, createComputed, For } from "ags"

const MAX_RESULTS = 6
const apps = new AstalApps.Apps()

const [query, setQuery] = createState("")
const [selected, setSelected] = createState(0)
const results = query((q) => (q.trim() ? apps.fuzzy_query(q.trim()).slice(0, MAX_RESULTS) : []))
const current = createComputed(() => results()[selected()] ?? null)

let entry: Gtk.Entry | null = null

// Called when the dashboard opens: clear the search and focus it
export function focusLauncher() {
  apps.reload() // pick up newly installed apps
  setQuery("")
  setSelected(0)
  entry?.set_text("")
  entry?.grab_focus()
}

// App search across the top of the dashboard.
// Type to search, Tab / Shift+Tab to cycle, Enter or click to launch.
export default function Launcher({ onLaunch }: { onLaunch: () => void }) {
  function launch(app: AstalApps.Application | null) {
    if (!app) return
    onLaunch()
    app.launch()
  }

  function cycle(step: number) {
    const n = results.get().length
    if (n) setSelected((s) => (s + step + n) % n)
  }

  return (
    <box class="dash-card launcher" spacing={14}>
      {/* Selected app's icon (or a search glyph) + the search field */}
      <box class="launcher-field" spacing={10} widthRequest={260}>
        <box class="launcher-icon" valign={Gtk.Align.CENTER}>
          <image iconName={current((a) => a?.iconName || "system-search-symbolic")} pixelSize={18} />
        </box>
        <entry
          class="launcher-entry"
          hexpand
          placeholderText="Search apps…"
          $={(self) => (entry = self)}
          onNotifyText={(self) => {
            setQuery(self.text)
            setSelected(0)
          }}
          onActivate={() => launch(current.get())}
        >
          <Gtk.EventControllerKey
            propagationPhase={Gtk.PropagationPhase.CAPTURE}
            onKeyPressed={(_, keyval) => {
              if (keyval === Gdk.KEY_Tab || keyval === Gdk.KEY_Down) {
                cycle(1)
                return true
              }
              if (keyval === Gdk.KEY_ISO_Left_Tab || keyval === Gdk.KEY_Up) {
                cycle(-1)
                return true
              }
              return false
            }}
          />
        </entry>
      </box>

      {/* Matching apps. The scrolled area takes only the width the dashboard
          already has (extra chips are clipped), so typing never resizes it. */}
      <Gtk.ScrolledWindow
        hexpand
        valign={Gtk.Align.CENTER}
        hscrollbarPolicy={Gtk.PolicyType.EXTERNAL}
        vscrollbarPolicy={Gtk.PolicyType.NEVER}
        propagateNaturalWidth={false}
        propagateNaturalHeight
      >
        <box spacing={8} valign={Gtk.Align.CENTER}>
          <label class="launcher-hint" label="Type to search apps" visible={query((q) => !q.trim())} />
          <label
            class="launcher-hint"
            label="No matches"
            visible={createComputed(() => !!query().trim() && results().length === 0)}
          />
          <For each={results}>
            {(app, index) => (
              <button
                class={createComputed(() => (selected() === index() ? "app-chip active" : "app-chip"))}
                tooltipText={app.description || app.name}
                onClicked={() => launch(app)}
              >
                <box spacing={8}>
                  <image iconName={app.iconName || "application-x-executable"} pixelSize={16} />
                  <label label={app.name} />
                </box>
              </button>
            )}
          </For>
        </box>
      </Gtk.ScrolledWindow>

      {/* Key hints */}
      <box spacing={6} valign={Gtk.Align.CENTER}>
        <label class="key" label="Tab" />
        <label class="launcher-hint" label="cycle" />
        <label class="key" label="Enter" />
        <label class="launcher-hint" label="open" />
      </box>
    </box>
  )
}
