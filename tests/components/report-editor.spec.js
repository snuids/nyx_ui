// @vitest-environment jsdom
/**
 * ReportEditor — l'editeur de rapport (application `Reports`) et son pied de dialogue.
 *
 * Deux defauts signales y ont laisse une trace : les cartes d'aide n'etaient pas lisibles en mode
 * sombre (fond **en style inline** clair sous un texte clair, et trois des cinq lignes n'avaient pas
 * la classe commune `.desc-card`), et « Edit code » occupait sa propre ligne au-dessus
 * d'Annuler/Valider parce que deux colonnes `span="24"` ne peuvent pas cohabiter.
 *
 * La fenetre est montee `append-to-body` (elle se teleporte) : on interroge donc `document`, comme le
 * ferait l'utilisateur, plutot que le wrapper.
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import axios from 'axios'

import ReportEditor from '@/components/ReportEditor.vue'
import { resetStore, mountView } from '../helpers/mount-view'

vi.mock('axios')

// `ReportList` passe `row._source` : le document est **aplati**, les champs a la racine.
const record = (source = {}) => ({
  title: 'Energy',
  reportType: 'notebook',
  output: 'pdf',
  notebook: './report_energy',
  ...source,
})

async function mountEditor(source = {}) {
  axios.post.mockResolvedValue({ status: 200, data: { error: '', records: [] } })
  const mounted = await mountView(ReportEditor, {
    at: '/main/rec-report',
    attachTo: document.body,
    props: {
      record: record(source),
      id: 'report-1',
      index: 'nyx_report',
      title: 'Edit report',
      isAdd: false,
    },
  })
  await flushPromises()
  return mounted
}

const dialog = () => Array.from(document.querySelectorAll('.el-dialog')).pop()
const footerColumns = () => Array.from(dialog().querySelectorAll('.el-dialog__footer .el-col'))

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  resetStore({
    apiurl: 'api/v1/',
    menus: [],
    creds: { token: 'tok', user: { language: 'en', privileges: ['admin'], id: 'u-1' } },
  })
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ReportEditor — pied de dialogue', () => {
  it('met les deux colonnes cote a cote (12 + 12), pas empilees', async () => {
    await mountEditor()
    const columns = footerColumns()

    // Deux `span="24"` ne tiennent pas sur une ligne : Element Plus empile la seconde, et « Edit
    // code » se retrouvait seule au-dessus d'Annuler/Valider.
    expect(columns.length).toBe(2)
    expect(columns[0].className).toContain('el-col-12')
    expect(columns[1].className).toContain('el-col-12')
  })

  it('place « Edit code » a gauche et les sorties a droite', async () => {
    await mountEditor()
    const [left, right] = footerColumns()

    const leftButton = left.querySelector('button')
    expect(leftButton.textContent.trim()).toMatch(/edit/i)

    const rightButtons = Array.from(right.querySelectorAll('button')).map((b) => b.textContent.trim())
    expect(rightButtons.some((t) => /cancel/i.test(t))).toBe(true)
    expect(rightButtons.some((t) => /confirm/i.test(t))).toBe(true)
  })
})

describe('ReportEditor — aides de creation', () => {
  it('marque les cartes d\'aide de la classe commune attendue par le theme', async () => {
    // Le theme sombre reprend `.desc-card .el-card` (fond inline clair + texte clair = illisible).
    await mountEditor()
    const card = dialog().querySelector('.desc-card')

    expect(card).toBeTruthy()
    expect(card.querySelector('.el-card')).toBeTruthy()
  })

  it('suit le type de rapport choisi', async () => {
    const { wrapper } = await mountEditor({ reportType: 'jasper' })
    expect(dialog().querySelector('.desc-card')).toBeTruthy()

    wrapper.vm.newRec.reportType = 'python'
    await wrapper.vm.$nextTick()
    expect(dialog().querySelector('.desc-card')).toBeTruthy()
  })
})
