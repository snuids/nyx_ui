// @vitest-environment jsdom
/**
 * `utils/passwordGenerator` — the password an administrator hands over.
 *
 * The two screens that generate one (the rules tester and the reset-password dialog) used
 * `Math.random()`, a predictable generator, and shuffled with `sort(() => 0.5 - Math.random())`.
 * A password that is read out loud, pasted into a message and typed by someone else has to come
 * from a CSPRNG, and the alphabets must not contain the characters people confuse — that is what
 * these cases pin.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'

import {
  DIGIT,
  LOWER,
  SPECIAL,
  UPPER,
  generatePassword,
  randomInt,
  shuffle,
} from '@/utils/passwordGenerator'

const RULES = { length: [12, 18], forceUpper: true, minUpper: 2, forceNumber: true, minNumber: 2,
  forceSpecial: true, minSpecial: 2 }

const count = (value, pattern) => (value.match(pattern) || []).length

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('generatePassword — les règles de l instance', () => {
  it('respecte les bornes de longueur', () => {
    for (let i = 0; i < 200; i++) {
      const length = generatePassword(RULES).length
      expect(length).toBeGreaterThanOrEqual(12)
      expect(length).toBeLessThanOrEqual(18)
    }
  })

  it('respecte le minimum de chaque classe exigée', () => {
    for (let i = 0; i < 200; i++) {
      const pwd = generatePassword(RULES)
      expect(count(pwd, /[A-Z]/g), pwd).toBeGreaterThanOrEqual(2)
      expect(count(pwd, /[0-9]/g), pwd).toBeGreaterThanOrEqual(2)
      expect(count(pwd, /[!#$%&*+\-=?@^_]/g), pwd).toBeGreaterThanOrEqual(2)
    }
  })

  it('ne compte pas une classe que la règle ne force pas', () => {
    // `minUpper: 4` with `forceUpper: false` must not push four capitals into the password
    const pwd = generatePassword({ length: [12, 12], forceUpper: false, minUpper: 4,
      forceNumber: false, minNumber: 4, forceSpecial: false, minSpecial: 4 })
    expect(pwd).toHaveLength(12)
    expect(count(pwd, /[!#$%&*+\-=?@^_]/g)).toBeLessThanOrEqual(4)
  })

  it('garde une longueur imposée même étroite', () => {
    const pwd = generatePassword({ length: [8, 10] })
    expect(pwd.length).toBeGreaterThanOrEqual(8)
    expect(pwd.length).toBeLessThanOrEqual(10)
  })

  it('ne descend pas sous le nombre de caractères imposés', () => {
    // 3 forced classes in a rule that allows 2 characters: 3 are written anyway, otherwise the
    // generated password would be refused by the very rule that produced it
    const pwd = generatePassword({ length: [2, 2], forceUpper: true, minUpper: 1,
      forceNumber: true, minNumber: 1, forceSpecial: true, minSpecial: 1 })
    expect(pwd.length).toBe(3)
  })

  it('produit un mot de passe différent à chaque appel', () => {
    const seen = new Set()
    for (let i = 0; i < 300; i++) seen.add(generatePassword(RULES))
    expect(seen.size).toBe(300)
  })

  it('fonctionne sur une instance sans règle', () => {
    // the privilege documents of the production instance carry `passwordRules: null`
    for (const empty of [null, undefined, {}, { length: null }]) {
      const pwd = generatePassword(empty)
      expect(typeof pwd).toBe('string')
      expect(pwd.length).toBeGreaterThanOrEqual(12)
      expect(pwd.length).toBeLessThanOrEqual(18)
    }
  })
})

describe('generatePassword — les alphabets', () => {
  it('aucun caractère ambigu dans les 300 générations', () => {
    // 0/O/o, 1/l/I/| are the pairs an operator mistypes when retyping from a screen or a message
    for (let i = 0; i < 300; i++) {
      expect(generatePassword(RULES), 'ambiguité').not.toMatch(/[0Oo1lI|]/)
    }
  })

  it('n utilise que des caractères des alphabets exposés', () => {
    const allowed = new Set((LOWER + UPPER + DIGIT + SPECIAL).split(''))
    for (let i = 0; i < 100; i++) {
      for (const char of generatePassword(RULES)) expect(allowed.has(char), char).toBe(true)
    }
  })
})

describe('le générateur est cryptographique', () => {
  it('ne touche jamais à Math.random', () => {
    const spy = vi.spyOn(Math, 'random')
    generatePassword(RULES)
    shuffle(['a', 'b', 'c', 'd'])
    expect(spy).not.toHaveBeenCalled()
  })

  it('tire ses octets de crypto.getRandomValues', () => {
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues')
    generatePassword(RULES)
    expect(spy).toHaveBeenCalled()
  })

  it('échoue franchement quand aucun CSPRNG n est disponible', () => {
    // a silent fallback to Math.random() would be the defect this module replaces
    vi.stubGlobal('crypto', undefined)
    expect(() => randomInt(10)).toThrow(/getRandomValues/)
  })

  it('tire un entier dans [0, max) sans dépasser', () => {
    const seen = new Set()
    for (let i = 0; i < 500; i++) {
      const value = randomInt(7)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(7)
      seen.add(value)
    }
    expect(seen.size).toBe(7)
  })

  it('refuse un intervalle absurde', () => {
    expect(() => randomInt(0)).toThrow(RangeError)
    expect(() => randomInt(-3)).toThrow(RangeError)
    expect(() => randomInt(2.5)).toThrow(RangeError)
  })
})

describe('shuffle', () => {
  it('conserve exactement les mêmes éléments', () => {
    const source = 'abcdefghij'.split('')
    const result = shuffle([...source])
    expect([...result].sort().join('')).toBe([...source].sort().join(''))
  })
})
