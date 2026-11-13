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

/** The methods taken on their own: the component only needs `$route`, `$notify` and `$store`. */
function reporting(at = '/main/x') {
  const notify = vi.fn()
  const commit = vi.fn()
  const push = vi.fn()
  const self = {
    $notify: notify,
    $route: { path: at },
    $store: { commit },
    $router: { push },
    logoutDebounce: vi.fn(),
  }
  // bound after the object exists: `self` inside the literal would be read before its own init
  self.endInactiveSession = App.methods.endInactiveSession.bind(self)
  const report = App.methods.reportApiError.bind(self)
  return { report, notify, commit, push, self }
}

describe('reportApiError', () => {
  it('says nothing about an empty error', () => {
    const { report, notify } = reporting()

    report({ error: '' })
    report(null)

    expect(notify).not.toHaveBeenCalled()
  })

  it('stays silent on the sign-in screen: the login route already left for /inactive', () => {
    const { report, notify, push } = reporting('/')

    report({ error: 'ACCOUNT_INACTIVE' })

    expect(notify).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })

  it('ends a live session instead of showing the raw code', () => {
    // an administrator disabled the account while it was open: the store goes, the page explains
    const { report, notify, commit, push } = reporting('/main/rec-users')

    report({ error: 'ACCOUNT_INACTIVE' })

    expect(notify).not.toHaveBeenCalled()
    expect(commit).toHaveBeenCalledWith({ type: 'logout', data: {} })
    expect(push).toHaveBeenCalledWith('/inactive')
  })

  it('does not push twice when the console is already on the page', () => {
    const { report, commit, push } = reporting('/inactive')

    report({ error: 'ACCOUNT_INACTIVE' })

    expect(commit).toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
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
