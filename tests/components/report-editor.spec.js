// @vitest-environment jsdom
/**
 * ReportEditor — the report editor (`Reports` application) and its dialog footer.
 *
 * Two reported defects left a mark there: the help cards were unreadable in dark mode (light
 * **inline** background under light text, and three of the five lines lacked the shared
 * `.desc-card` class), and "Edit code" took a line of its own above Cancel/Confirm because two
 * `span="24"` columns cannot sit side by side.
 *
 * The window is mounted `append-to-body` (it teleports): we therefore query `document`, as the user
 * would, rather than the wrapper.
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import axios from 'axios'

import ReportEditor from '@/components/ReportEditor.vue'
import { resetStore, mountView } from '../helpers/mount-view'

vi.mock('axios')

// `ReportList` passes `row._source`: the document is **flattened**, with fields at the root.
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

    // Two `span="24"` do not fit on one line: Element Plus stacks the second, and "Edit code" ended
    // up alone above Cancel/Confirm.
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
    // The dark theme overrides `.desc-card .el-card` (light inline background + light text = unreadable).
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

    // The inline 70/90 px cut long descriptions: a scrollbar appeared in the card and the last line
    // was invisible.
    expect(card.getAttribute('style') || '').not.toMatch(/height/)
  })

  it('aligne l\'icone et le texte dans une ligne flex', async () => {
    await mountEditor({ reportType: 'python' })
    const inner = dialog().querySelector('.desc-card__inner')

    // The `el-col` sat directly in the card, without an `el-row`: outside a flex container, the icon
    // and the text did not share the line.
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

    // `style="height:30px"` on `el-upload` with a 40 px `dragger` for two lines of text: the content
    // overflowed by 50 px below its line and spilled over the next field.
    expect(upload.getAttribute('style') || '').not.toMatch(/height/)
    expect(upload.querySelector('.el-upload-dragger')).toBeTruthy()
  })

  it('s\'aligne sur les champs de sa colonne', async () => {
    await mountEditor({ reportType: 'jasper' })
    const upload = dialog().querySelector('.upload-box')

    // Wrapped in an `el-form-item` with no label, the zone takes the indent of the neighbouring
    // fields instead of starting from the edge of the column.
    expect(upload.closest('.el-form-item')).toBeTruthy()
  })
})
