/**
 * The `Vue.component(...)` shim (`src/utils/vue3shim.js`).
 *
 * The console registers its components from inside component modules — `Main.vue` alone does thirty
 * of them. Two behaviours matter, and the second one was learned the hard way: a module that loads
 * *after* the app exists must still see its registrations applied. When the routes became
 * `defineAsyncComponent`, `Main.vue` arrived after the single pre-mount flush, the queue was never
 * applied, and the app button and the avatar vanished from the header as `<apps></apps>` and
 * `<logout></logout>`.
 *
 * The module keeps its state, so the "before the app exists" case reloads it (`vi.resetModules`)
 * instead of bending the shared instance.
 */

import { describe, expect, it, vi } from 'vitest'

import { bindApp, flushRegistrations, registerComponent } from '@/utils/vue3shim'

const fakeApp = () => ({ component: vi.fn() })

describe('vue3shim — before the app exists', () => {
  it('queues, then replays into the app at bind time', async () => {
    vi.resetModules()
    const shim = await import('@/utils/vue3shim')
    const app = fakeApp()

    shim.registerComponent('Apps', { name: 'Apps' })
    shim.registerComponent('Logout', { name: 'Logout' })
    expect(app.component).not.toHaveBeenCalled()

    shim.bindApp(app)

    expect(app.component).toHaveBeenCalledTimes(2)
    expect(app.component).toHaveBeenNthCalledWith(1, 'Apps', { name: 'Apps' })
    expect(app.component).toHaveBeenNthCalledWith(2, 'Logout', { name: 'Logout' })
  })
})

describe('vue3shim — after the app exists', () => {
  it('applies a late registration immediately, instead of queueing it forever', () => {
    const app = fakeApp()
    bindApp(app)

    registerComponent('ChangePassword', { name: 'ChangePassword' })

    expect(app.component).toHaveBeenCalledWith('ChangePassword', { name: 'ChangePassword' })
  })

  it('does not replay a registration twice', () => {
    const app = fakeApp()
    bindApp(app)

    registerComponent('Apps', { name: 'Apps' })
    flushRegistrations()

    expect(app.component).toHaveBeenCalledTimes(1)
  })

  it('does nothing when no app is bound yet, and does not throw', async () => {
    vi.resetModules()
    const shim = await import('@/utils/vue3shim')

    expect(() => shim.flushRegistrations()).not.toThrow()
  })
})
