// @vitest-environment jsdom
/**
 * Table de routage.
 *
 * Trois routes et une route enfant : assez peu de code, mais une entree perdue ici rend un ecran
 * injoignable (la notice de confidentialite, notamment, qui doit rester publique et sans compte).
 * Le test verifie ce que le routeur resout reellement, pas la forme du fichier.
 */

import { describe, it, expect } from 'vitest'
import router from '@/router/router'
import Login from '@/views/Login.vue'
import Privacy from '@/views/Privacy.vue'
import Main from '@/views/Main.vue'
import GenericComponent from '@/components/GenericComponent.vue'

describe('router', () => {
  it('ouvre l\'ecran de connexion sur la racine', () => {
    const resolved = router.resolve('/')

    expect(resolved.name).toBe('Login')
    expect(resolved.matched[0].components.default).toBe(Login)
  })

  it('rend la notice de confidentialite joignable sans compte', () => {
    const resolved = router.resolve('/privacy')

    expect(resolved.name).toBe('Privacy')
    expect(resolved.matched[0].components.default).toBe(Privacy)
  })

  it('monte le cadre principal sur /main', () => {
    const resolved = router.resolve('/main')

    expect(resolved.name).toBe('Main')
    expect(resolved.matched[0].components.default).toBe(Main)
  })

  it('ouvre l\'application demandee comme enfant de /main', () => {
    // C'est le chemin que `Login.vue` pousse apres authentification (`/main/<rec_id>`).
    const resolved = router.resolve('/main/rec-1')

    expect(resolved.name).toBe('GenericComponent')
    expect(resolved.params.recid).toBe('rec-1')
    expect(resolved.matched).toHaveLength(2)
    expect(resolved.matched[1].components.default).toBe(GenericComponent)
  })

  it('conserve le mode hash des URL existantes', () => {
    // Vue Router 3 utilisait le hash ; les liens deja distribues (`/#/main/...`) doivent marcher.
    expect(router.options.history.base).toBeDefined()
    expect(router.options.history.createHref('/main/rec-1')).toContain('#/main/rec-1')
  })
})
