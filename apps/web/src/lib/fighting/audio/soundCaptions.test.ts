import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from '../engine'
import { retainSoundCaptions, soundCaptions } from './soundCaptions'

describe('combat sound captions', () => {
  it('only exposes resource alerts for the selected viewer', () => {
    const ready = createFight('kurapika', 'chrollo', { mode: 'versus-local' })
    const before = beginFight(ready)
    const after = {
      ...before,
      frame: before.frame + 1,
      opponent: { ...before.opponent, aura: 0, auraExhausted: true },
    }
    expect(soundCaptions(before, after, { viewer: 'player', locale: 'fr' })).toEqual([])
    expect(soundCaptions(before, after, { viewer: 'opponent', locale: 'fr' })).toContainEqual({
      text: 'Nen épuisé',
      priority: 2,
    })
  })

  it('bounds caption rows, preserves their readability and expires repeated cues', () => {
    const hit = { text: 'Hit', priority: 1 } as const
    const parry = { text: 'Parry', priority: 2 } as const
    const finish = { text: 'Knockout', priority: 3 } as const
    const active = retainSoundCaptions([], [hit, parry], 0)
    const quieter = retainSoundCaptions(active, [parry, finish], 1000)
    expect(quieter).toEqual([
      { ...finish, expires: 4000 },
      { ...parry, expires: 2000 },
    ])
    expect(retainSoundCaptions(quieter, [hit], 2100)).toEqual([
      { ...finish, expires: 4000 },
      { ...hit, expires: 3300 },
    ])
    expect(retainSoundCaptions(quieter, [], 4000)).toEqual([])
  })
})
