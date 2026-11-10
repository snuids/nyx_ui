/**
 * The icon loading strategy (`src/utils/fontAwesome.js`).
 *
 * The three FontAwesome sets used to be registered whole at startup. They are now imported when a
 * style is first needed, which is what keeps ~2 000 icons out of the initial bundle — and what makes
 * the behaviour worth pinning: a name that stops resolving renders nothing at all, silently.
 */

import { describe, it, expect, vi } from 'vitest'

import {
  hasIcon,
  loadAllIconSets,
  loadIcon,
  loadStyle,
  moduleName,
  resolveIconAsync,
} from '@/utils/fontAwesome'
import { PREFIXES } from '@/utils/iconMap'

describe('moduleName', () => {
  it('follows the FontAwesome 6 export naming', () => {
    expect(moduleName('code')).toBe('faCode')
    expect(moduleName('ellipsis-h')).toBe('faEllipsisH')
    expect(moduleName('canadian-maple-leaf')).toBe('faCanadianMapleLeaf')
    expect(moduleName('4')).toBe('fa4')
  })

  it('does not crash on an empty name', () => {
    expect(moduleName('')).toBe('fa')
    expect(moduleName(null)).toBe('fa')
  })
})

describe('hasIcon', () => {
  const definitions = { fas: { code: {} }, fab: { docker: {} } }

  it('tells whether a pair is in the library', () => {
    expect(hasIcon(definitions, ['fas', 'code'])).toBe(true)
    expect(hasIcon(definitions, ['fab', 'docker'])).toBe(true)
    expect(hasIcon(definitions, ['fas', 'docker'])).toBe(false)
  })

  it('is false for anything incomplete', () => {
    expect(hasIcon(definitions, null)).toBe(false)
    expect(hasIcon(definitions, [])).toBe(false)
    expect(hasIcon(definitions, ['fas'])).toBe(false)
    expect(hasIcon(null, ['fas', 'code'])).toBe(false)
  })
})

describe('loadStyle', () => {
  it('loads the solid set and resolves to its definitions', async () => {
    const set = await loadStyle('fas')

    expect(set).toBeTruthy()
    expect(set.faCode).toBeTruthy()
    expect(set.faCode.iconName).toBe('code')
  })

  it('loads each style only once', async () => {
    const first = loadStyle('fas')
    const second = loadStyle('fas')

    expect(second).toBe(first) // the promise itself is cached, not just its result
  })

  it('falls back to solid for a prefix it does not know', async () => {
    const set = await loadStyle('inconnu')

    expect(set.faCode).toBeTruthy()
  })
})

describe('loadIcon', () => {
  it('returns the definition of a name that exists', async () => {
    const definition = await loadIcon('fas', 'code')

    expect(definition.iconName).toBe('code')
  })

  it('returns null for a name no set carries', async () => {
    expect(await loadIcon('fas', 'pas-une-icone')).toBeNull()
  })

  it('finds a brand icon in its own set', async () => {
    // `docker` only exists in `fab`: the menu lost its icon when that set was not searched
    const definition = await loadIcon('fab', 'docker')

    expect(definition.iconName).toBe('docker')
  })
})

describe('loadAllIconSets', () => {
  it('registers the three sets', async () => {
    await loadAllIconSets()

    expect((await loadStyle('fas')).faCode).toBeTruthy()
    expect((await loadStyle('fab')).faDocker).toBeTruthy()
  })
})

describe('resolveIconAsync', () => {
  const empty = { fas: {}, far: {}, fab: {} }

  it('does not touch the loader when the icon is already registered', async () => {
    const load = vi.fn()
    const definitions = { ...empty, fas: { code: {} } }

    expect(await resolveIconAsync('code', definitions, load)).toEqual(['fas', 'code'])
    expect(load).not.toHaveBeenCalled()
  })

  it('loads the icon and returns the pair it found', async () => {
    const load = vi.fn(async (prefix, name) => (prefix === 'fas' ? { iconName: name } : null))

    expect(await resolveIconAsync('code', empty, load)).toEqual(['fas', 'code'])
    expect(load).toHaveBeenCalledWith('fas', 'code')
  })

  it('falls back across the three sets, brands last', async () => {
    const load = vi.fn(async prefix => (prefix === 'fab' ? { iconName: 'docker' } : null))

    expect(await resolveIconAsync('brands/docker', empty, load)).toEqual(['fab', 'docker'])
    expect(load.mock.calls.map(call => call[0])).toEqual(['fab'])
  })

  it('honours the prefix of the stored name before the others', async () => {
    const load = vi.fn(async (prefix, name) => ({ iconName: prefix + '/' + name }))

    expect(await resolveIconAsync('regular/file-word', empty, load)).toEqual(['far', 'file-word'])
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('returns the wanted pair when no set carries the name', async () => {
    const load = vi.fn(async () => null)

    expect(await resolveIconAsync('pas-une-icone', empty, load)).toEqual(['fas', 'pas-une-icone'])
    expect(load).toHaveBeenCalledTimes(3)
  })

  it('exports the same prefixes the resolver knows', () => {
    expect(Object.keys(PREFIXES)).toEqual(['solid', 'regular', 'brands'])
  })
})
