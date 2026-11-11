// @vitest-environment jsdom
/**
 * ReportGenerator — the parameter dialog of a report definition.
 *
 * What matters here is the **contract with the API**: the console used to build the whole job itself
 * (definition, privileges, credentials) and hand it to `/sendmessage`, which refused it to everyone
 * but administrators. It now sends an identifier and parameter values to `/report/generate` and lets
 * the server rebuild the rest — so these tests pin the body: no `creds`, no `privileges`, no
 * definition, only `report`, `parameters` and `task`.
 */

import { beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import axios from 'axios'

import ReportGenerator from '@/components/ReportGenerator.vue'
import { resetStore, mountView } from '../helpers/mount-view'

vi.mock('axios')

const record = {
  title: 'Monthly energy',
  reportType: 'jasper',
  output: ['pdf'],
  parameters: [
    { name: 'period', title: 'Period', type: 'interval', value: ['2026-11-01', '2026-11-08'] },
    { name: 'site', title: 'Site', type: 'text', value: 'all' },
  ],
}

const creds = {
  token: 'token-42',
  user: { login: 'alice@example.com', id: 'alice@example.com', language: 'en', privileges: ['YUL'] },
}
creds.hasPrivilege = () => false

async function mountGenerator() {
  resetStore({ creds, apiurl: 'https://api.test/api/v1/' })
  axios.post.mockResolvedValue({ status: 200, data: { error: '', id: 'id_1' } })
  const { wrapper } = await mountView(ReportGenerator, {
    at: '/main/rec-report',
    attachTo: document.body,
    props: { record, reportId: 'id_report1' },
  })
  await flushPromises()
  return wrapper
}

function generateCall() {
  // The dialog also fetches the user list on mount: pick the submission among the calls.
  return axios.post.mock.calls.find(([url]) => String(url).includes('report/generate')) || []
}

async function mountGeneratorWithNotify() {
  resetStore({ creds, apiurl: 'https://api.test/api/v1/' })
  const notify = vi.fn()
  const { wrapper } = await mountView(ReportGenerator, {
    at: '/main/rec-report',
    attachTo: document.body,
    props: { record, reportId: 'id_report1' },
    mocks: { $notify: notify },
  })
  await flushPromises()
  return { wrapper, notify }
}

describe('ReportGenerator — submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts the definition id and the parameter values to /report/generate', async () => {
    const wrapper = await mountGenerator()

    wrapper.vm.generateReport()
    await flushPromises()

    const [url, body] = generateCall()
    expect(url).toContain('report/generate')
    expect(body.report).toBe('id_report1')
    expect(body.parameters).toEqual([
      { name: 'period', value: ['2026-11-01', '2026-11-08'] },
      { name: 'site', value: 'all' },
    ])
  })

  it('sends no credentials and no definition of its own', async () => {
    const wrapper = await mountGenerator()

    wrapper.vm.generateReport()
    await flushPromises()

    const body = generateCall()[1]
    expect(body).not.toHaveProperty('creds')
    expect(body).not.toHaveProperty('privileges')
    expect(body).not.toHaveProperty('destination')
    expect(JSON.stringify(body)).not.toContain('jasperdef')
  })

  it('carries the mail settings under `task`', async () => {
    const wrapper = await mountGenerator()
    wrapper.vm.sendByEmail = true
    wrapper.vm.maillingListTo = ['boss@example.com']
    wrapper.vm.emailSubject = 'Monthly'
    wrapper.vm.emailBody = 'Here: $URL$'

    wrapper.vm.generateReport()
    await flushPromises()

    expect(generateCall()[1].task).toEqual({
      mailingList: ['boss@example.com'],
      mailingListCc: [],
      mailingListCci: [],
      mailSubject: 'Monthly',
      mailTemplate: 'Here: $URL$',
    })
  })

  it('announces the report on the bus and closes the dialog', async () => {
    const wrapper = await mountGenerator()
    const emitted = vi.fn()
    wrapper.vm.$globalbus.$on('reportgenerated', emitted)

    wrapper.vm.generateReport()
    await flushPromises()

    expect(emitted).toHaveBeenCalled()
    expect(wrapper.emitted('dialogclose')).toBeTruthy()
  })

  it('shows the server error instead of swallowing it', async () => {
    const { wrapper, notify } = await mountGeneratorWithNotify()
    axios.post.mockResolvedValue({ status: 403, data: { error: 'forbidden' } })

    wrapper.vm.generateReport()
    await flushPromises()

    expect(notify).toHaveBeenCalled()
    expect(notify.mock.calls[0][0].type).toBe('danger')
    expect(wrapper.emitted('dialogclose')).toBeFalsy()
  })
})
