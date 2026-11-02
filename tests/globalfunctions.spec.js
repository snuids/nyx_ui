/**
 * Les deux fonctions de `globalfunctions.js`.
 *
 * `computeTranslatedText` décode le format `@en=Hello;fr=Bonjour@` utilisé par les configurations
 * d'application (titres, libellés de colonnes) : c'est lui qui décide ce qu'un utilisateur lit à
 * l'écran, dans sa langue, pour chaque champ traduit du modèle. Il est appelé depuis les tableaux
 * génériques et les éditeurs, mais n'avait aucun test.
 */

import { describe, it, expect } from 'vitest'
import { computeTranslatedText, extractURLParts } from '@/globalfunctions.js'

describe('computeTranslatedText', () => {
  it('rend une chaine vide pour une valeur absente', () => {
    expect(computeTranslatedText(undefined, 'fr')).toBe('')
  })

  it('laisse passer un texte qui n est pas au format traduit', () => {
    expect(computeTranslatedText('Energy', 'fr')).toBe('Energy')
    expect(computeTranslatedText('', 'fr')).toBe('')
  })

  it('choisit la langue demandee', () => {
    const text = '@en=Energy;fr=Energie;nl=Energie;el=Ενέργεια@'
    expect(computeTranslatedText(text, 'fr')).toBe('Energie')
    expect(computeTranslatedText(text, 'en')).toBe('Energy')
    expect(computeTranslatedText(text, 'el')).toBe('Ενέργεια')
  })

  it('exige le arobase de fermeture', () => {
    expect(computeTranslatedText('@en=Energy', 'en')).toBe('@en=Energy')
    expect(computeTranslatedText('Energy@', 'en')).toBe('Energy@')
  })

  it('ne garde que la premiere valeur quand la traduction contient un egal', () => {
    // « @en=a=b@ » donne « a » : le decoupage se fait sur tous les « = ». A connaitre avant
    // d'ecrire un libelle du type « Minimum = 40 » dans le format traduit.
    expect(computeTranslatedText('@en=a=b@', 'en')).toBe('a')
  })

  it('rend les segments bruts quand la langue n est pas traduite', () => {
    // contrat actuel : la fonction rend un tableau, pas une chaine — un appelant qui l'insere
    // dans un gabarit affiche les segments separes par des virgules
    const result = computeTranslatedText('@en=Energy;fr=Energie@', 'nl')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual(['en=Energy', 'fr=Energie'])
  })

  it('traite une chaine vide de traductions sans lever', () => {
    expect(computeTranslatedText('@@', 'fr')).toEqual([''])
  })
})

describe('extractURLParts', () => {
  it('decoupe une URL complete', () => {
    const parts = extractURLParts('https://energy.marmar.ovh/api/v1/config?x=1#top')
    expect(parts.protocol).toBe('https:')
    expect(parts.host).toBe('energy.marmar.ovh')
    expect(parts.hostname).toBe('energy.marmar.ovh')
    expect(parts.pathname).toBe('/api/v1/config')
    expect(parts.search).toBe('?x=1')
    expect(parts.hash).toBe('#top')
  })

  it('separe le port de l hote', () => {
    const parts = extractURLParts('http://localhost:8280/api/v1/')
    expect(parts.host).toBe('localhost:8280')
    expect(parts.hostname).toBe('localhost')
    expect(parts.port).toBe('8280')
  })

  it('rend null sans protocole', () => {
    // utilise par le websocket : une URL sans schema doit etre detectee, pas devinee
    expect(extractURLParts('energy.marmar.ovh/api')).toBeFalsy()
    expect(extractURLParts('ws://energy.marmar.ovh/nyx_ui_websocket/')).toBeFalsy()
  })
})
