/**
 * `Vue.component(name, component)` was called from 53 places inside component modules, which Vue 3
 * no longer offers: registration needs the app instance, and those calls run at import time, before
 * `createApp()` returns. They queue here and are flushed into the app.
 *
 * The flush used to happen once, before mount — which was right while every module was imported at
 * startup. The routes are loaded on demand now (`defineAsyncComponent`), so `Main.vue` and the
 * components it registers (`Apps`, `Logout`, `ChangePassword`, …) arrive *after* that first flush.
 * Their registrations queued up behind it and were never applied: the header rendered `<apps></apps>`
 * and `<logout></logout>` as unknown elements, so the app button and the avatar silently vanished.
 *
 * Hence `bindApp`: the instance is remembered, and every module that loads later can flush what it
 * registered (`router/router.js` does it for each route, right after the module is imported).
 */
const pending = []

let app = null

export function registerComponent(name, component) {
  // A late module may register after the app exists: apply it now rather than queueing forever.
  if (app) {
    app.component(name, component)
    return
  }
  pending.push([name, component])
}

/** Keep the app instance, and apply whatever was registered before it existed. */
export function bindApp(instance) {
  app = instance
  flushRegistrations()
}

/** Apply the pending registrations to `instance` (defaults to the bound app). */
export function flushRegistrations(instance) {
  const target = instance || app
  if (!target) return

  pending.forEach(([name, component]) => target.component(name, component))
  pending.length = 0
}
