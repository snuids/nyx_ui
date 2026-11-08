/**
 * `appendQueryParam` — ajouter un parametre a l'URL d'une application externe.
 *
 * L'application recoit son contexte (token, API, langue, theme) dans l'URL. Un parametre oublie ne
 * produit aucune erreur : l'application s'ouvre simplement sans lui. C'est ainsi qu'un theme sombre
 * est reste clair sans que rien ne le signale.
 */
import { describe, it, expect } from 'vitest'

import { appendQueryParam } from '@/utils/url.js'

describe('appendQueryParam', () => {
  it('ajoute le premier parametre avec « ? »', () => {
    expect(appendQueryParam('./logs/', 'theme', 'dark')).toBe('./logs/?theme=dark')
  })

  it('ajoute les suivants avec « & »', () => {
    expect(appendQueryParam('./logs/?token=abc', 'theme', 'dark')).toBe('./logs/?token=abc&theme=dark')
  })

  it('place le parametre avant le fragment, qui reste intact', () => {
    expect(appendQueryParam('./cerebro/#!/overview?host=x', 'theme', 'dark')).toBe(
      './cerebro/?theme=dark#!/overview?host=x'
    )
  })

  it('ne touche pas une URL qui porte deja le parametre', () => {
    expect(appendQueryParam('./logs/?theme=light', 'theme', 'dark')).toBe('./logs/?theme=light')
    expect(appendQueryParam('./logs/?a=1&theme=light', 'theme', 'dark')).toBe('./logs/?a=1&theme=light')
  })

  it('supporte une URL vide', () => {
    expect(appendQueryParam('', 'theme', 'dark')).toBe('')
    expect(appendQueryParam(undefined, 'theme', 'dark')).toBeUndefined()
  })
})
