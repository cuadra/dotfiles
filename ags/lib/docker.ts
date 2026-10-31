// Start/stop tiles for the dashboard (Docker, Postgres), configured in config.ts.
import { createService } from "./service"
import { DOCKER, POSTGRES } from "../config"

export const docker = createService(DOCKER)
export const postgres = createService(POSTGRES)

// Shown after the regular shortcuts, in this order
export const services = [postgres, docker]
