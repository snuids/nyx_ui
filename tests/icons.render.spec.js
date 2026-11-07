// @vitest-environment jsdom
/**
 * Verification de rendu : une icone Element Plus doit produire un <svg> dans le bouton. Sans ce
 * test, une table de correspondance fausse passerait inapercue — le bouton serait simplement vide.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import * as icons from '@element-plus/icons-vue'

const mountWith = (template) =>
  mount(
    { template },
    {
      global: {
        plugins: [ElementPlus],
        config: { globalProperties: { $icons: icons } },
      },
    }
  )

describe('rendu des icones', () => {
  it('un bouton avec :icon affiche un svg', () => {
    const wrapper = mountWith('<el-button :icon="$icons.Download">Telecharger</el-button>')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('un <el-icon><component :is="$icons.X"/></el-icon> affiche un svg', () => {
    const wrapper = mountWith(
      '<el-icon><component :is="$icons.CaretRight" /></el-icon>'
    )
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('un nom de configuration traduit affiche un svg', async () => {
    const { iconComponent } = await import('@/utils/icons')
    const wrapper = mount(
      {
        template: '<el-button :icon="icone(header)">x</el-button>',
        data: () => ({ header: 'el-icon-download' }),
        methods: { icone: (name) => iconComponent(name, icons) },
      },
      { global: { plugins: [ElementPlus] } }
    )
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
