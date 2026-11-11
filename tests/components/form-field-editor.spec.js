// @vitest-environment jsdom
/**
 * FormFieldEditor — the dialog that adds or edits one field of a form application.
 *
 * Every widget in it was `size="small"`: 28 px high, in a dialog 75 % wide, where the rest of the
 * console renders its fields at 36 px (`--el-component-size` in `styles/element-legacy.css`). Inside
 * an editor that is mostly empty space, the four or five fields of this dialog looked cramped —
 * reported as "the fields are too small" in the application editor.
 *
 * The dialog teleports (`append-to-body`), so the queries run on `document`, as the user sees it.
 */

import { beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

import FormFieldEditor from '@/components/appConfigEditor/FormFieldEditor.vue'
import { resetStore, mountView } from '../helpers/mount-view'

const creds = { token: 't', user: { id: 'alice@example.com', language: 'en', privileges: ['admin'] } }
creds.hasPrivilege = () => true

const field = {
  field: 'param1',
  title: 'Param 1',
  type: 'string',
  subType: 'text',
  default: '',
  clearable: true,
  color: '#409EFF',
  inverted: false,
}

async function mountDialog() {
  resetStore({ creds, apiurl: 'https://api.test/api/v1/' })
  const { wrapper } = await mountView(FormFieldEditor, {
    at: '/main/rec-app',
    attachTo: document.body,
    props: { currentField: { ...field }, title: 'Edit field' },
    mocks: { $notify: vi.fn(), $alert: vi.fn() },
  })
  await flushPromises()
  return wrapper
}

describe('FormFieldEditor — field sizes', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('opens with the fields of the form', async () => {
    await mountDialog()

    // the dialog rendered its inputs (it is `append-to-body`, so they are under document.body)
    expect(document.querySelectorAll('.el-dialog .el-input').length).toBeGreaterThan(2)
    expect(document.querySelectorAll('.el-dialog .el-select').length).toBeGreaterThan(1)
  })

  it('does not shrink them to the deprecated small size', async () => {
    await mountDialog()

    const html = document.querySelector('.el-dialog').outerHTML
    expect(html).not.toContain('--small')
    expect(html).not.toContain('el-input--mini')
  })

  it('keeps one size for every widget of the dialog', async () => {
    await mountDialog()

    const widgets = [...document.querySelectorAll('.el-dialog .el-input, .el-dialog .el-select')]
    const sizes = new Set(widgets.map(node => (node.className.match(/--(large|small|default)/) || [])[1] || 'default'))

    expect([...sizes]).toEqual(['default'])
  })

  it('gives the label column enough room for "Subtype" and "Clearable"', async () => {
    const wrapper = await mountDialog()

    expect(wrapper.vm.formLabelWidth).toBe('140px')
  })
})
