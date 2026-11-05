import { Gtk } from "ags/gtk4"
import { createComputed } from "ags"
import { days, failed, loaded, weatherJob, refreshWeather } from "../../lib/weather"
import { WEATHER } from "../../config"

const V = Gtk.Orientation.VERTICAL
const REFRESH = "\u{f0450}"
const DAYS = 7

// Full-width row along the bottom of the dashboard: one column per day with
// an icon for the day's overall weather, plus its high and low.
export default function Weather() {
  const status = createComputed(() => (failed() ? "Forecast unavailable · check your connection" : "Loading forecast…"))
  return (
    <box class="dash-card weather-card" orientation={V} spacing={12} hexpand>
      <box spacing={8}>
        <label class="dash-title" label="FORECAST" hexpand xalign={0} />
        <label class="dash-meta" label={WEATHER.place} />
        <button class="dash-refresh" tooltipText="Refresh forecast" valign={Gtk.Align.CENTER} onClicked={() => refreshWeather(true)}>
          <label class={weatherJob.busy((b) => (b ? "busy" : ""))} label={REFRESH} />
        </button>
      </box>
      <label
        class={failed((f) => (f ? "info-name" : "info-name loading-text"))}
        label={status}
        xalign={0}
        visible={loaded((l) => !l)}
      />
      <box class="weather-days" homogeneous spacing={8} visible={loaded}>
        {Array.from({ length: DAYS }, (_, i) => {
          const day = days((list) => list[i])
          return (
            <box
              class={day((d) => (i === 0 ? `weather-day today ${d?.kind ?? ""}` : `weather-day ${d?.kind ?? ""}`))}
              orientation={V}
              spacing={4}
              tooltipText={day((d) => (d ? `${d.date} · ${d.text}${d.rain ? ` · ${d.rain}% rain` : ""}` : ""))}
            >
              <label class="weather-label" label={day((d) => d?.label ?? "")} />
              <label class="weather-icon" label={day((d) => d?.icon ?? "")} />
              <box spacing={6} halign={Gtk.Align.CENTER}>
                <label class="weather-high" label={day((d) => (d ? `${d.high}°` : ""))} />
                <label class="weather-low" label={day((d) => (d ? `${d.low}°` : ""))} />
              </box>
            </box>
          )
        })}
      </box>
    </box>
  )
}
