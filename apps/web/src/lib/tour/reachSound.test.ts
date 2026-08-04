import { beforeEach, describe, expect, it, vi } from 'vitest'
import { playTourReachSound } from './reachSound'
import type { Reach } from './cast'

// The voices themselves are the web-audio graph, and none of that belongs in a
// test of which of them is chosen: the module is stubbed to a list of names.
const { played } = vi.hoisted(() => ({ played: [] as string[] }))

vi.mock('$lib/audio/hatsuSounds', () => {
  const voice = (name: string) => () => void played.push(name)
  return {
    crackAWhip: voice('whip'),
    hissLikeASnake: voice('snake'),
    landAPunch: voice('punch'),
    loostAnArrow: voice('arrow'),
    playATune: (tune: string) => void played.push(`tune:${tune}`),
    stretchTheGum: voice('gum'),
    unspoolWire: voice('wire'),
  }
})

const held = (kind: Extract<Reach, { outcome: 'held' }>['kind']): Reach => ({
  outcome: 'held',
  kind,
  characterId: 'machi',
  hold: { characterId: 'machi', kind, mark: 'bound', since: 0, until: 1 },
})

beforeEach(() => void (played.length = 0))

describe('what a cast at a person sounds like', () => {
  // The gesture ch. 39 draws first, and the one the walk was performing in
  // silence: the filament goes out and takes hold of somebody walking past.
  it('gives Bungee Gum on a body the same voice it has on a cabinet', () => {
    playTourReachSound(held('elastic'))
    expect(played).toEqual(['gum'])
  })

  // A mark is what a hold looks like; a sound is whose aura it is. Both of
  // these leave a body bound, and they are not the same technique.
  it('does not give the chain the gum’s voice', () => {
    playTourReachSound(held('chain-bind'))
    expect(played).toEqual(['snake'])
  })

  it('is silent when nothing left the visitor', () => {
    playTourReachSound({ outcome: 'refused', kind: 'elastic', reason: 'no-target' })
    playTourReachSound({ outcome: 'told', kind: 'dowsing', characterId: 'machi', tells: [] })
    expect(played).toEqual([])
  })

  it('says nothing rather than borrowing for a technique with no voice of its own', () => {
    playTourReachSound(held('heart-vow'))
    expect(played).toEqual([])
  })
})
