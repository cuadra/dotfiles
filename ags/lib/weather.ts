// 7-day forecast for the dashboard's bottom row, from Open-Meteo (free, no
// API key). Fetched through the dashboard job queue (lib/scheduler.ts) when
// the dashboard opens, only if the last fetch is older than refreshMinutes.
// Nothing runs while the dashboard is closed.
import { createState, createComputed } from "ags"
import { execAsync } from "ags/process"
import { createJob } from "./scheduler"
import { WEATHER } from "../config"

export type Kind = "sun" | "partly" | "cloud" | "fog" | "drizzle" | "rain" | "pour" | "sleet" | "snow" | "storm"

export type Day = {
  label: string // "Today", "Fri", ...
  date: string // "Nov 6"
  kind: Kind
  icon: string
  text: string // "Light rain"
  high: number
  low: number
  rain: number // max precipitation chance, %
}

// Nerd Font (Material Design) weather glyphs
const ICON: Record<Kind, string> = {
  sun: "\u{f0599}", // weather-sunny
  partly: "\u{f0595}", // weather-partly-cloudy
  cloud: "\u{f0590}", // weather-cloudy
  fog: "\u{f0591}", // weather-fog
  drizzle: "\u{f0597}", // weather-rainy
  rain: "\u{f0597}", // weather-rainy
  pour: "\u{f0596}", // weather-pouring
  sleet: "\u{f067f}", // weather-snowy-rainy
  snow: "\u{f0598}", // weather-snowy
  storm: "\u{f067e}", // weather-lightning-rainy
}

// WMO weather codes (what Open-Meteo returns) -> icon kind + description
function describe(code: number): { kind: Kind; text: string } {
  if (code === 0) return { kind: "sun", text: "Clear" }
  if (code === 1) return { kind: "sun", text: "Mostly sunny" }
  if (code === 2) return { kind: "partly", text: "Partly cloudy" }
  if (code === 3) return { kind: "cloud", text: "Overcast" }
  if (code === 45 || code === 48) return { kind: "fog", text: "Fog" }
  if (code >= 51 && code <= 55) return { kind: "drizzle", text: "Drizzle" }
  if (code === 56 || code === 57) return { kind: "sleet", text: "Freezing drizzle" }
  if (code === 61 || code === 80) return { kind: "rain", text: "Light rain" }
  if (code === 63 || code === 81) return { kind: "rain", text: "Rain" }
  if (code === 65 || code === 82) return { kind: "pour", text: "Heavy rain" }
  if (code === 66 || code === 67) return { kind: "sleet", text: "Freezing rain" }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { kind: "snow", text: "Snow" }
  if (code >= 95) return { kind: "storm", text: "Thunderstorms" }
  return { kind: "cloud", text: "Cloudy" }
}

const URL =
  "https://api.open-meteo.com/v1/forecast" +
  `?latitude=${WEATHER.latitude}&longitude=${WEATHER.longitude}` +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
  `&temperature_unit=${WEATHER.unit === "C" ? "celsius" : "fahrenheit"}` +
  "&timezone=auto&forecast_days=7"

const [days, setDays] = createState<Day[]>([])
const [failed, setFailed] = createState(false)
export { days, failed }
export const loaded = createComputed(() => days().length > 0)

let fetchedAt = 0

async function fetchForecast() {
  // curl with a hard timeout so a bad connection can't stall the job queue
  const out = await execAsync(["curl", "-sf", "--max-time", "10", URL])
  const d = JSON.parse(out).daily
  const list: Day[] = d.time.map((iso: string, i: number) => {
    const [y, m, dd] = iso.split("-").map(Number)
    const when = new Date(y, m - 1, dd) // local date, no UTC shift
    const { kind, text } = describe(d.weather_code[i])
    return {
      label: i === 0 ? "Today" : when.toLocaleDateString("en-US", { weekday: "short" }),
      date: when.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      kind,
      icon: ICON[kind],
      text,
      high: Math.round(d.temperature_2m_max[i]),
      low: Math.round(d.temperature_2m_min[i]),
      rain: d.precipitation_probability_max?.[i] ?? 0,
    }
  })
  setDays(list)
  setFailed(false)
  fetchedAt = Date.now()
}

export const weatherJob = createJob(() =>
  fetchForecast().catch(() => setFailed(true)), // keep the last forecast on failure
)

export function refreshWeather(force = false) {
  // A new day also counts as stale, so "Today" is never yesterday's forecast
  const sameDay = new Date(fetchedAt).toDateString() === new Date().toDateString()
  const stale = !sameDay || Date.now() - fetchedAt > WEATHER.refreshMinutes * 60_000
  if (force || stale) weatherJob.schedule({ manual: force })
}
