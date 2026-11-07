import { describe, expect, it } from 'vitest'
import { grafanaTheme, hasThemeParameter, withGrafanaTheme } from '../src/utils/grafanaTheme'

const DASH = './grafananyx/d/8521d0f4-5531-4454-b433-2a53c96e3002/van-volsem?kiosk=true&hideLogo=true'

describe('Grafana theme in the URL', () => {
  it('maps the console theme to a Grafana theme', () => {
    expect(grafanaTheme('dark')).toBe('dark')
    expect(grafanaTheme('light')).toBe('light')
    expect(grafanaTheme(undefined)).toBe('light')
  })

  it('appends the parameter to a dashboard URL', () => {
    expect(withGrafanaTheme(DASH, 'dark')).toBe(DASH + '&theme=dark')
    expect(withGrafanaTheme(DASH, 'light')).toBe(DASH + '&theme=light')
  })

  it('opens a query string when there is none', () => {
    expect(withGrafanaTheme('./grafananyx/d/abc/panel', 'dark')).toBe('./grafananyx/d/abc/panel?theme=dark')
  })

  it('leaves an application that pins its own theme alone', () => {
    const pinned = './grafananyx/d/abc/panel?kiosk=true'
    expect(withGrafanaTheme(pinned, 'dark', 'theme=light')).toBe(pinned)
    expect(withGrafanaTheme(pinned + '&theme=light', 'dark')).toBe(pinned + '&theme=light')
  })

  it('does not mistake another parameter for the theme', () => {
    expect(hasThemeParameter(DASH, 'refresh=1m')).toBe(false)
    expect(hasThemeParameter(DASH, 'xtheme=dark')).toBe(false)
    expect(withGrafanaTheme(DASH, 'dark', 'refresh=1m')).toBe(DASH + '&theme=dark')
    expect(hasThemeParameter(DASH + '&theme=dark')).toBe(true)
  })

  it('tolerates a missing URL or missing extra parameters', () => {
    expect(hasThemeParameter(undefined, 'theme=dark')).toBe(true)
    expect(hasThemeParameter(undefined, undefined)).toBe(false)
    expect(hasThemeParameter(undefined, 'refresh=1m')).toBe(false)
  })

  it('returns an empty URL untouched', () => {
    expect(withGrafanaTheme('', 'dark')).toBe('')
    expect(withGrafanaTheme(undefined, 'dark')).toBe(undefined)
  })
})
