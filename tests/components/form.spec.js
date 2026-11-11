// @vitest-environment jsdom
/**
 * Form.vue — the runtime screens of a form-type application.
 *
 * Three things were wrong with the field sizes, all of them from Element UI 2 assumptions:
 *
 * - `formSize: "mini"` — Element Plus knows `large`/`default`/`small` only, so every field fell
 *   through to "no size" while the selects kept their own hardcoded `min-height: 32px`;
 * - the `datetime` branch hardcoded `size="small"` (28 px after the legacy override), so that one
 *   field stood 8 px shorter than its neighbours;
 * - `el-input-number` (150 px) and `el-date-picker` (220 px) kept their intrinsic width next to
 *   full-width text fields: the form read as a column of tiny boxes.
 *
 * The console height for a field is 36 px (`--el-component-size` in `styles/element-legacy.css`).
 */

import { beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

import Form from '@/components/Form.vue'
import { resetStore, mountView } from '../helpers/mount-view'

const creds = { token: 't', user: { id: 'alice@example.com', language: 'en', privileges: ['YUL'] } }
creds.hasPrivilege = () => false

const config = {
  formtitle: 'Test Parameters',
  index: 'nyx_test',
  headercolumns: [
    { field: 'name', title: 'Name', type: 'text', value: '' },
    { field: 'count', title: 'Count', type: 'number', value: 1 },
    { field: 'day', title: 'Day', type: 'date', value: null },
    { field: 'when', title: 'When', type: 'datetime', value: null },
    { field: 'mode', title: 'Mode', type: 'selecter', value: 'a', selectOptions: ['a', 'b'] },
  ],
}

async function mountForm() {
  resetStore({ creds, apiurl: 'https://api.test/api/v1/' })
  const { wrapper } = await mountView(Form, {
    at: '/main/rec-form',
    attachTo: document.body,
    props: { config: { config } },
    mocks: { $alert: vi.fn(), $notify: vi.fn(), $getLocation: () => Promise.reject('no') },
  })
  await flushPromises()
  return wrapper
}

describe('Form.vue — field sizes', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders every field at the console size, none at a deprecated one', async () => {
    const wrapper = await mountForm()
    const html = wrapper.html()

    expect(html).not.toContain('--mini')
    expect(html).not.toContain('el-date-editor--small')
    expect(html).not.toContain('el-input-number--small')
  })

  it('gives the number, the date, the datetime and the select the width of the text field', async () => {
    const wrapper = await mountForm()

    for (const selector of ['.el-input-number', '.el-date-editor', '.el-select']) {
      const widgets = wrapper.findAll(selector)
      expect(widgets.length, selector).toBeGreaterThan(0)
      for (const widget of widgets) {
        expect(widget.attributes('style'), selector + ' keeps its intrinsic width').toContain('width: 100%')
      }
    }
  })

  it('keeps one size for all of them, not one per branch', async () => {
    const wrapper = await mountForm()

    // the four widgets of the form must agree: same size class or none at all
    const sizeOf = element => (element.className.match(/--(large|small|default)/) || [])[1] || 'default'
    const sizes = new Set(
      wrapper.findAll('.el-input, .el-input-number, .el-date-editor, .el-select')
        .map(widget => sizeOf(widget.element)),
    )

    expect([...sizes]).toEqual(['default'])
  })
})
