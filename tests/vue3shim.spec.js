/**
 * Les 53 `Vue.component(...)` du code d'origine s'executent a l'import, avant que `createApp()`
 * n'ait rendu l'instance : ils sont donc mis en file puis rejoues avant le montage. Sans ce
 * mecanisme, ces composants ne seraient tout simplement pas enregistres.
 */
import { describe, it, expect, vi } from 'vitest'
import { registerComponent, flushRegistrations } from '@/utils/vue3shim'

describe('vue3shim', () => {
  it('rejoue les enregistrements sur l application', () => {
    const app = { component: vi.fn() }
    const premier = { name: 'Premier' }
    const second = { name: 'Second' }

    registerComponent('Premier', premier)
    registerComponent('Second', second)
    expect(app.component).not.toHaveBeenCalled()

    flushRegistrations(app)

    expect(app.component).toHaveBeenCalledWith('Premier', premier)
    expect(app.component).toHaveBeenCalledWith('Second', second)
  })

  it('vide la file apres le montage', () => {
    const app = { component: vi.fn() }
    registerComponent('Unique', {})
    flushRegistrations(app)
    flushRegistrations(app)
    expect(app.component).toHaveBeenCalledTimes(1)
  })
})
