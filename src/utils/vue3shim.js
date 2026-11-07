/**
 * `Vue.component(name, component)` was called from 53 places inside component modules, which Vue 3
 * no longer offers: registration needs the app instance, and those calls run at import time, before
 * `createApp()` returns. They queue here and are flushed once, before mount.
 */
const pending = []

export function registerComponent(name, component) {
  pending.push([name, component])
}

export function flushRegistrations(app) {
  pending.forEach(([name, component]) => app.component(name, component))
  pending.length = 0
}
