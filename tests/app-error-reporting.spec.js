// @vitest-environment jsdom
/**
 * `App.reportApiError` — what the console says about a refused call.
 *
 * Every API answer carrying an `error` goes through here from the axios interceptor. Two codes are
 * handled apart: a lost token logs out, and `ACCOUNT_INACTIVE` stays silent because the sign-in route
 * already sent the user to the page that explains it — a red toast with the raw code on top of that
 * page is noise, not information.
 */

import { describe, it, expect, vi } from 'vitest'

import App from '@/App.vue'

/** The method taken on its own: the component only needs `$route` and `$notify`. */
function reporting() {
  const notify = vi.fn()
  const self = {
    $notify: notify,
    $route: { path: '/main/x' },
    logoutDebounce: vi.fn(),
  }
  const report = App.methods.reportApiError.bind(self)
  return { report, notify, self }
}

describe('reportApiError', () => {
  it('says nothing about an empty error', () => {
    const { report, notify } = reporting()

    report({ error: '' })
    report(null)

    expect(notify).not.toHaveBeenCalled()
  })

  it('stays silent on ACCOUNT_INACTIVE, the page says it', () => {
    const { report, notify, self } = reporting()

    report({ error: 'ACCOUNT_INACTIVE' })

    expect(notify).not.toHaveBeenCalled()
    expect(self.logoutDebounce).not.toHaveBeenCalled()
  })

  it('logs out on a lost token instead of shouting', () => {
    for (const error of ['UNKNOWN_TOKEN', 'NO_TOKEN']) {
      const { report, notify, self } = reporting()
      report({ error })
      expect(notify).not.toHaveBeenCalled()
      expect(self.logoutDebounce).toHaveBeenCalledWith(true)
    }
  })

  it('reports any other refusal', () => {
    const { report, notify } = reporting()

    report({ error: 'NO_PRIVILEGE' })

    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify.mock.calls[0][0]).toMatchObject({ type: 'error', message: 'NO_PRIVILEGE' })
  })
})
