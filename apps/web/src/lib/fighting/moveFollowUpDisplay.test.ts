import { describe, expect, it } from 'vitest'
import { movesetFor } from './movesets'
import { formatFollowUpRow } from './moveFollowUpDisplay'

describe('moveFollowUpDisplay', () => {
  it('formats Feitan follow-ups with inputs, conditions and physics tags in FR and EN', () => {
    const followUps = movesetFor('feitan')!.followUps!
    const frRows = followUps.map((entry) => formatFollowUpRow(entry, 'fr'))
    expect(frRows).toEqual([
      {
        id: 'feitan:pain-stairway',
        name: 'Escalier de la douleur',
        sourceName: 'Croisement funèbre',
        input: 'K',
        condition: 'Sur touche',
        tags: ['Projection aérienne'],
      },
      {
        id: 'feitan:execution-rain',
        name: 'Pluie du bourreau',
        sourceName: 'Escalier de la douleur',
        input: 'K',
        condition: 'Cible / corps en l’air',
        tags: ['Overhead'],
      },
      {
        id: 'feitan:shadowless-blade',
        name: 'Lame sans ombre',
        sourceName: 'Croisement funèbre',
        input: '← + K',
        condition: 'Après traversée',
        tags: ['Traversant', 'Bas'],
      },
      {
        id: 'feitan:scabbard-reversal-transition',
        name: 'Taille sous la garde',
        sourceName: 'Pointe du fourreau',
        input: '→ + J',
        condition: 'Sur touche',
        tags: [],
      },
      {
        id: 'feitan:scabbard-reversal',
        name: 'Retour du fourreau',
        sourceName: 'Taille sous la garde',
        input: '↓ + → + K',
        condition: 'Sur touche',
        tags: [],
      },
    ])

    const enRow = formatFollowUpRow(followUps[2], 'en')
    expect(enRow.name).toBe('Shadowless Blade')
    expect(enRow.sourceName).toBe('Crossing Funeral')
    expect(enRow.condition).toBe('After crossing')
    expect(enRow.tags).toEqual(['Cross-up', 'Low'])
  })
})
