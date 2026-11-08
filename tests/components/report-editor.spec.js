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

describe('ReportEditor — carte de description', () => {
  it('laisse la carte grandir avec le texte, sans hauteur fixe', async () => {
    await mountEditor({ reportType: 'jasper_jdbc' })
    const card = dialog().querySelector('.desc-card .el-card')

    // Les 70/90 px inline coupaient la description longue : une barre de defilement apparaissait
    // dans la carte et la derniere ligne etait invisible.
    expect(card.getAttribute('style') || '').not.toMatch(/height/)
  })

  it('aligne l\'icone et le texte dans une ligne flex', async () => {
    await mountEditor({ reportType: 'python' })
    const inner = dialog().querySelector('.desc-card__inner')

    // Les `el-col` etaient poses directement dans la carte, sans `el-row` : hors conteneur flex,
    // l'icone et le texte ne partageaient pas la ligne.
    expect(inner).toBeTruthy()
    expect(inner.querySelector('.desc-card__icon')).toBeTruthy()
    expect(inner.querySelector('.desc-card__text').textContent.trim().length).toBeGreaterThan(20)
  })

  it('donne une description a chacun des cinq types', async () => {
    const { wrapper } = await mountEditor()

    for (const type of ['notebook_doc', 'notebook', 'python', 'jasper', 'jasper_jdbc']) {
      wrapper.vm.newRec.reportType = type
      await wrapper.vm.$nextTick()

      const text = dialog().querySelector('.desc-card__text')
      expect(text, `description du type ${type}`).toBeTruthy()
      expect(text.textContent.trim().length, `description du type ${type}`).toBeGreaterThan(20)
    }
  })
})

describe('ReportEditor — depot du fichier JRXML', () => {
  it('ne fixe plus la hauteur de la zone de depot', async () => {
    await mountEditor({ reportType: 'jasper_jdbc' })
    const upload = dialog().querySelector('.upload-box')

    // `style="height:30px"` sur `el-upload` avec un `dragger` de 40 px pour deux lignes de texte :
    // le contenu debordait de 50 px sous sa ligne et passait par-dessus le champ suivant.
    expect(upload.getAttribute('style') || '').not.toMatch(/height/)
    expect(upload.querySelector('.el-upload-dragger')).toBeTruthy()
  })

  it('s\'aligne sur les champs de sa colonne', async () => {
    await mountEditor({ reportType: 'jasper' })
    const upload = dialog().querySelector('.upload-box')

    // Enveloppe dans un `el-form-item` sans libelle, la zone reprend le retrait des champs voisins
    // au lieu de partir du bord de la colonne.
    expect(upload.closest('.el-form-item')).toBeTruthy()
  })
})
