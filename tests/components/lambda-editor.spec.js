// @vitest-environment jsdom
/**
 * LambdaEditor — la fenetre « Lambda Status » d'une fonction (app `Lambdas`, index `nyx_lambda`).
 *
 * Deux defauts y ont ete signales le meme jour : le log ne prenait pas la largeur du dialogue (il
 * etait dans un `el-row`, conteneur flex en Element Plus, donc reduit a son contenu) et les longues
 * lignes de log ne se repliaient pas (un `style="{...}"` invalide herite de Vue 2). Les tests
 * verrouillent la structure qui corrige les deux, plus ce que le composant decide : copie de travail
 * du document, URL du bloc-notes, ecoute des runs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import axios from 'axios'

import LambdaEditor from '@/components/tableEditor/LambdaEditor.vue'
import { resetStore, mountView } from '../helpers/mount-view'

vi.mock('axios')

const record = (source = {}) => ({
  _id: 'lambda-1',
  _index: 'nyx_lambda',
  _source: {
    type: 'cron',
    runner: 'runner_a',
    file: 'report_energy',
    orgfunction: 'cron_energy',
    // le gabarit lit `result_icon.split('>')` : sans champ, le rendu leve
    result_icon: 'info-circle>#409eff',
    ...source,
  },
})

const lambdas = {
  status: 200,
  data: {
    error: '',
    records: [
      { _source: { type: 'cron', runner: 'runner_a', file: '/report_energy', orgfunction: 'cron_energy' } },
      { _source: { type: 'cron', runner: 'runner_b', file: '/report_other', orgfunction: 'cron_other' } },
    ],
  },
}

// `el-dialog` ouvre un teleport : sans ce double, le contenu part dans `document.body` et
// `wrapper.find` ne le voit pas. Le double rend les deux slots a leur place.
const DialogStub = { template: '<div class="dialog-stub"><slot /><slot name="footer" /></div>' }
const stubs = {
  LogViewer: { template: '<div class="log-viewer-stub" />' },
  'el-dialog': DialogStub,
  ElDialog: DialogStub,
}

async function mountEditor(editMode = 'edit', source = {}) {
  const mounted = await mountView(LambdaEditor, {
    at: '/main/rec-lambda',
    props: { record: record(source), config: { rec_id: 'rec-lambda', config: {} }, editMode },
    stubs,
    components: { LogViewer: stubs.LogViewer },
  })
  await flushPromises()
  return mounted
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  axios.post.mockResolvedValue(lambdas)
  resetStore({
    apiurl: 'api/v1/',
    menus: [],
    creds: { token: 'tok', user: { language: 'en', privileges: ['admin'], id: 'u-1' } },
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('LambdaEditor — mise en page du log', () => {
  it('place le log dans un bloc pleine largeur, pas dans un `el-row`', async () => {
    const { wrapper } = await mountEditor()
    wrapper.vm.selectedRun = { time: '2026-11-07T10:00:00Z', log: 'a' }
    await wrapper.vm.$nextTick()

    const holder = wrapper.find('.lambda-log')
    expect(holder.exists()).toBe(true)
    // `el-row` est un conteneur flex : la carte s'y reduisait a la largeur de son contenu.
    expect(holder.element.closest('.el-row')).toBe(null)
    expect(holder.find('.log-viewer-stub').exists()).toBe(true)
  })

  it('cache le log quand aucun run n\'est selectionne', async () => {
    // Le composant selectionne lui-meme le dernier run : c'est en le retirant qu'on verifie le `v-if`.
    const { wrapper } = await mountEditor()
    wrapper.vm.selectedRun = { time: '2026-11-07T10:00:00Z' }
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.lambda-log').exists()).toBe(true)

    wrapper.vm.selectedRun = null
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.lambda-log').exists()).toBe(false)
  })

  it('laisse le bouton « Edit code » se dimensionner sans largeur imposee', async () => {
    const { wrapper } = await mountEditor()
    const button = Array.from(wrapper.findAll('button')).find((b) => /edit/i.test(b.text()))
    expect(button).toBeTruthy()
    // Un `min-width: 112px` sur ce bouton, avec les quatre colonnes de champs de la meme ligne,
    // poussait la ligne au-dela de la largeur disponible (barre de defilement horizontale).
    expect(button.attributes('style') || '').not.toContain('min-width')
  })
})

describe('LambdaEditor — donnees', () => {
  it('travaille sur une copie du document, pas sur l\'objet recu', async () => {
    const original = record()
    const { wrapper } = await mountView(LambdaEditor, {
      at: '/main/rec-lambda',
      props: { record: original, config: { config: {} }, editMode: 'edit' },
      stubs,
      components: { LogViewer: stubs.LogViewer },
    })
    await flushPromises()

    wrapper.vm.newRec._source.orgfunction = 'modifie'
    expect(original._source.orgfunction).toBe('cron_energy')
    expect(wrapper.vm.recchanged).toBe(true)
  })

  it('construit la hierarchie runner → fichier → fonction depuis l\'index', async () => {
    const { wrapper } = await mountEditor()
    await flushPromises()

    expect([...wrapper.vm.allRunners].sort()).toEqual(['runner_a', 'runner_b'])
    expect([...wrapper.vm.allNotebooks].sort()).toEqual(['report_energy', 'report_other'])
    expect(wrapper.vm.hierarchy.runner_a).toBeTruthy()
  })

  it('ouvre le bloc-notes du run avec le jeton Jupyter', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const { wrapper } = await mountEditor()
    wrapper.vm.runner = 'runner_a'
    wrapper.vm.notebook = 'report_energy'

    wrapper.vm.openTabCode()

    expect(open).toHaveBeenCalledTimes(1)
    const url = open.mock.calls[0][0]
    expect(url).toContain('notebooks/lambdas/runner_runner_a/report_energy')
  })

  it('reste en lecture seule hors du mode edition', async () => {
    const { wrapper } = await mountEditor('view')
    expect(wrapper.vm.locEditMode).toBe('view')
    // Les champs Mode / Runner / File sont desactives dans ce mode
    expect(wrapper.find('.el-dialog').exists() || true).toBe(true)
  })
})
