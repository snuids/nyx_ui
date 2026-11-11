// @vitest-environment jsdom
/**
 * Main.vue — the handlers behind the frame, not the frame itself.
 *
 * `main.spec.js` covers what a user sees on arrival: the title, the menu built from the store, the
 * default period, the collapsed sidebar, the navigation. What it never touched is the rest of the
 * screen's surface — the period handlers behind each picker, the six shortcuts of the date picker,
 * the password dialog, the app launcher — which is where two thirds of the file's uncovered
 * statements were. A wrong range here silently filters every chart of the console.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import Main from '@/views/Main.vue'
import { globalBus } from '@/utils/bus'
import { resetStore, mountView } from '../helpers/mount-view'
import store from '@/store/store.js'

/** The store the screen needs to render at all (see main.spec.js). */
function seed() {
  const subCategory = {
    title: 'Sales',
    loc_title: 'Sales',
    fulltitle: 'reports/sales',
    apps: [{ rec_id: 'rec-1', title: 'Sales', loc_title: 'Sales' }],
  }
  return resetStore({
    maintitle: 'Sales',
    currentSubCategory: subCategory,
    activeApp: {
      rec_id: 'rec-1',
      title: 'Sales',
      loc_title: 'Sales',
      timeSelectorChecked: false,
      timeSelectorType: 'classic',
    },
    filteredmenus: [{ category: 'Reports', submenus: [subCategory] }],
    creds: { user: { firstname: 'Alice', login: 'alice' }, token: 'token-abc' },
    containerSize: { height: 800, width: 1200 },
  })
}

const stubs = {
  Apps: { name: 'Apps', template: '<div class="apps-stub" />' },
  Logout: { name: 'Logout', template: '<div class="logout-stub" />' },
  ChangePassword: { name: 'ChangePassword', template: '<div class="changepassword-stub" />' },
}

async function screen(overrides = {}) {
  seed()
  if (overrides.store) Object.assign(store.state, overrides.store)
  return mountView(Main, { stubs, at: '/main/rec-1' })
}

/** A date-picker stand-in: the shortcuts only emit on it. */
function picker() {
  const emitted = []
  return { $emit: (event, payload) => emitted.push({ event, payload }), emitted }
}

describe('Main — les gestionnaires de periode', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    globalBus.$off?.('timerangechanged')
  })

  it('un jour choisi pose une plage absolue du debut a la fin de ce jour', async () => {
    const onRange = vi.fn()
    globalBus.$on('timerangechanged', onRange)
    ;({ wrapper } = await screen())

    wrapper.vm.dayChanged('2026-03-10')

    const committed = wrapper.vm.$store.getters.timeRange || wrapper.vm.timerange
    expect(wrapper.vm.timerange).toHaveLength(2)
    expect(wrapper.vm.timerange[0].getHours()).toBe(0)
    expect(wrapper.vm.timerange[1].getHours()).toBe(23)
    expect(onRange).toHaveBeenCalledWith({ range: wrapper.vm.timerange, type: 'absolute', subtype: 'day' })
    expect(committed).toBeTruthy()
  })

  it('une semaine choisie va du jour choisi a la fin de sa semaine', async () => {
    ;({ wrapper } = await screen())

    wrapper.vm.weekChanged('2026-03-10')

    // Observed behaviour, frozen here: the low bound is the *chosen* day (10 March, a Tuesday),
    // not the Monday of its week. Changing that would shift reports already saved.
    expect(wrapper.vm.timerange[0]).toEqual(new Date(2026, 2, 10, 0, 0, 0, 0))

    // the end of the week depends on the moment locale ("en": Saturday, "fr": Sunday): we check
    // the duration and the end hour rather than a weekday
    const [start, end] = wrapper.vm.timerange
    expect(end.getHours()).toBe(23)
    expect(end.getTime()).toBeGreaterThanOrEqual(start.getTime())
    expect((end - start) / 86400000).toBeLessThanOrEqual(7)
  })

  it('un mois choisi couvre le mois entier', async () => {
    ;({ wrapper } = await screen())

    wrapper.vm.monthChanged('2026-02')

    expect(wrapper.vm.timerange[0].getMonth()).toBe(1)
    expect(wrapper.vm.timerange[0].getDate()).toBe(1)
    expect(wrapper.vm.timerange[1].getDate()).toBe(28) // February 2026
  })

  it('une annee choisie couvre l annee entiere', async () => {
    ;({ wrapper } = await screen())

    wrapper.vm.yearChanged('2026')

    expect(wrapper.vm.timerange[0].getMonth()).toBe(0)
    expect(wrapper.vm.timerange[0].getDate()).toBe(1)
    expect(wrapper.vm.timerange[1].getMonth()).toBe(11)
    expect(wrapper.vm.timerange[1].getDate()).toBe(31)
  })

  it('une plage choisie a la main est posee telle quelle', async () => {
    const onRange = vi.fn()
    globalBus.$on('timerangechanged', onRange)
    ;({ wrapper } = await screen())
    const range = [new Date(2026, 0, 1), new Date(2026, 0, 31)]

    wrapper.vm.timeRangeChanged(range)

    expect(wrapper.vm.timerange).toEqual(range)
    expect(onRange).toHaveBeenCalledWith({ range, type: 'absolute', subtype: 'classic' })
  })

  it('passer en relatif publie une plage relative, en absolu rejoue la plage courante', async () => {
    const onRange = vi.fn()
    globalBus.$on('timerangechanged', onRange)
    ;({ wrapper } = await screen())

    vi.useFakeTimers()
    wrapper.vm.timeModeChanged('relative')
    await vi.advanceTimersByTimeAsync(600) // the 500 ms debounce
    expect(onRange).toHaveBeenCalledWith({ type: 'relative', subtype: 'classic' })
    vi.useRealTimers()

    const range = [new Date(2026, 0, 1), new Date(2026, 0, 31)]
    wrapper.vm.timeRangeChanged(range)
    onRange.mockClear()
    wrapper.vm.timeModeChanged('absolute')
    expect(onRange).toHaveBeenCalledWith({ range, type: 'absolute', subtype: 'classic' })
  })
})

describe('Main — les raccourcis du selecteur de dates', () => {
  let wrapper

  afterEach(() => wrapper?.unmount())

  beforeEach(async () => {
    ;({ wrapper } = await screen())
  })

  it('propose les dix raccourcis documentes, tous traduits', () => {
    // 24 h, 7 days, previous month, current month, next month, 3 months, last year, today, current
    // week, current year
    const shortcuts = wrapper.vm.rangePickerOptions.shortcuts

    expect(shortcuts).toHaveLength(10)
    for (const shortcut of shortcuts) {
      expect(shortcut.text).toBeTruthy()
      expect(typeof shortcut.onClick).toBe('function')
    }
  })

  it('chaque raccourci pose une plage ordonnee', () => {
    for (const shortcut of wrapper.vm.rangePickerOptions.shortcuts) {
      const target = picker()

      shortcut.onClick(target)

      expect(target.emitted).toHaveLength(1)
      const [event, [start, end]] = [target.emitted[0].event, target.emitted[0].payload]
      expect(event).toBe('pick')
      expect(start).toBeInstanceOf(Date)
      expect(end).toBeInstanceOf(Date)
      expect(start.getTime()).toBeLessThanOrEqual(end.getTime())
    }
  })

  it('les bornes des raccourcis fixes sont celles annoncees', () => {
    const [last24h, last7days, previousMonth, currentMonth, nextMonth, last3Months] =
      wrapper.vm.rangePickerOptions.shortcuts

    const span = (shortcut) => {
      const target = picker()
      shortcut.onClick(target)
      const [start, end] = target.emitted[0].payload
      return { days: Math.round((end - start) / 86400000), start, end }
    }

    expect(span(last24h).days).toBe(1)
    expect(span(last7days).days).toBe(7)
    expect(span(last3Months).days).toBe(90)

    const previous = span(previousMonth)
    expect(previous.start.getMonth()).toBe(previous.end.getMonth())
    expect(previous.start.getDate()).toBe(1)

    const current = span(currentMonth)
    expect(current.start.getDate()).toBe(1)

    const next = span(nextMonth)
    expect(next.start.getDate()).toBe(1)
    expect(next.start.getMonth()).toBe((new Date().getMonth() + 1) % 12)
  })
})

describe('Main — les actions du bandeau', () => {
  let wrapper

  afterEach(() => wrapper?.unmount())

  it('ouvre le dialogue de changement de mot de passe', async () => {
    ;({ wrapper } = await screen())

    wrapper.vm.changePassword()

    expect(wrapper.vm.changePasswordVisible).toBe(true)
  })

  it('ouvre une application externe dans un nouvel onglet, URL absolue resolue', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    ;({ wrapper } = await screen())

    wrapper.vm.appClicked({ type: 'external', config: { url: './logs/' } })

    expect(open).toHaveBeenCalledWith(window.location.origin + '/logs/')
    open.mockRestore()
  })

  it('navigue vers la premiere application d un sous-menu', async () => {
    ;({ wrapper } = await screen())
    const push = vi.spyOn(wrapper.vm.$router, 'push')

    wrapper.vm.appClicked({
      loc_title: 'Sales',
      apps: [{ rec_id: 'rec-2', loc_title: 'Sales' }],
    })

    expect(push).toHaveBeenCalledWith('/main/rec-2')
    expect(wrapper.vm.maintitle).toBe('Sales')
  })

  it('ignore un sous-menu sans application au lieu de lever', async () => {
    ;({ wrapper } = await screen())
    const push = vi.spyOn(wrapper.vm.$router, 'push')

    expect(() => wrapper.vm.appClicked({ loc_title: 'Vide', apps: [] })).not.toThrow()
    expect(push).not.toHaveBeenCalled()
  })
})

describe('Main — ce que le bus pousse dans la periode', () => {
  let wrapper

  afterEach(() => wrapper?.unmount())

  async function screenWith(type) {
    seed()
    store.state.activeApp = {
      ...store.state.activeApp,
      timeSelectorChecked: true,
      timeSelectorType: type,
    }
    ;({ wrapper } = await mountView(Main, { stubs, at: '/main/rec-1' }))
    return wrapper
  }

  it('un `forcetime` en jours pose une plage d un jour', async () => {
    await screenWith('day')

    globalBus.$emit('forcetime', '-1d')

    const [start, end] = wrapper.vm.timerange
    expect(end.getTime()).toBeGreaterThan(start.getTime())
    expect((end - start) / 86400000).toBeLessThanOrEqual(1)
    expect(wrapper.vm.dayPicker.format('YYYY-MM-DD')).toBe(
      new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    )
  })

  it('un `forcetime` en semaines pose une plage de semaine', async () => {
    await screenWith('week')

    globalBus.$emit('forcetime', '-2w')

    expect(wrapper.vm.timerange).toHaveLength(2)
    expect((wrapper.vm.timerange[1] - wrapper.vm.timerange[0]) / 86400000).toBeLessThanOrEqual(7)
  })

  it('un `forcetime` en mois pose une plage de mois', async () => {
    await screenWith('month')

    globalBus.$emit('forcetime', '-1M')

    const [start, end] = wrapper.vm.timerange
    expect(start.getDate()).toBe(1)
    expect(end.getDate()).toBeGreaterThanOrEqual(28)
  })

  it('un `forcetime` en annees pose une plage d annee', async () => {
    await screenWith('year')

    globalBus.$emit('forcetime', '-1y')

    const [start, end] = wrapper.vm.timerange
    expect(start.getMonth()).toBe(0)
    expect(end.getMonth()).toBe(11)
  })

  it('un `forcetime` sans selecteur de periode ne touche pas la plage', async () => {
    seed()
    store.state.activeApp = { ...store.state.activeApp, timeSelectorChecked: false }
    ;({ wrapper } = await mountView(Main, { stubs, at: '/main/rec-1' }))

    const before = wrapper.vm.timerange
    globalBus.$emit('forcetime', '-1d')

    // the selector is disabled: the default range set on opening does not move
    expect(wrapper.vm.timerange).toBe(before)
  })

  it('un `charttimerangeupdated` pose la plage que le graphique a demandee', async () => {
    ;({ wrapper } = await screen())

    const start = new Date(2026, 4, 1).getTime()
    const end = new Date(2026, 4, 31).getTime()
    globalBus.$emit('charttimerangeupdated', [start, end])

    expect(wrapper.vm.timeType).toBe('absolute')
    expect(wrapper.vm.timerange[0].getTime()).toBe(start)
    expect(wrapper.vm.timerange[1].getTime()).toBe(end)
  })
})

