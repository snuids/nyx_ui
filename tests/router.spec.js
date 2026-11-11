// @vitest-environment jsdom
/**
 * Routing table.
 *
 * Three routes and one child route: fairly little code, but an entry lost here makes a screen
 * unreachable (the privacy notice in particular, which must stay public and available without an
 * account). The test checks what the router really resolves, not the shape of the file.
 */

import { describe, it, expect } from 'vitest'
import router from '@/router/router'
import Login from '@/views/Login.vue'
import Privacy from '@/views/Privacy.vue'
import Main from '@/views/Main.vue'
import GenericComponent from '@/components/GenericComponent.vue'

/**
 * The screen a route mounts, resolved through its async wrapper.
 *
 * Routes are declared with `defineAsyncComponent` (the views, and the generic component behind them,
 * used to be in the initial bundle), so `components.default` is no longer the component itself but
 * the wrapper that loads it. Resolving the loader keeps the test on what matters: this path mounts
 * that screen.
 */
async function screenOf(record) {
  const component = record.components.default
  if (!component.__asyncLoader) return component
  const module = await component.__asyncLoader()
  return module && module.default ? module.default : module
}

describe('router', () => {
  it('ouvre l\'ecran de connexion sur la racine', async () => {
    const resolved = router.resolve('/')

    expect(resolved.name).toBe('Login')
    expect(await screenOf(resolved.matched[0])).toBe(Login)
  })

  it('rend la notice de confidentialite joignable sans compte', async () => {
    const resolved = router.resolve('/privacy')

    expect(resolved.name).toBe('Privacy')
    expect(await screenOf(resolved.matched[0])).toBe(Privacy)
  })

  it('monte le cadre principal sur /main', async () => {
    const resolved = router.resolve('/main')

    expect(resolved.name).toBe('Main')
    expect(await screenOf(resolved.matched[0])).toBe(Main)
  })

  it('ouvre l\'application demandee comme enfant de /main', async () => {
    // This is the path `Login.vue` pushes after authentication (`/main/<rec_id>`).
    const resolved = router.resolve('/main/rec-1')

    expect(resolved.name).toBe('GenericComponent')
    expect(resolved.params.recid).toBe('rec-1')
    expect(resolved.matched).toHaveLength(2)
    expect(await screenOf(resolved.matched[1])).toBe(GenericComponent)
  })

  it('conserve le mode hash des URL existantes', () => {
    // Vue Router 3 used the hash; links already handed out (`/#/main/...`) must work.
    expect(router.options.history.base).toBeDefined()
    expect(router.options.history.createHref('/main/rec-1')).toContain('#/main/rec-1')
  })
})
