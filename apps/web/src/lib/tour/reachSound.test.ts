import { beforeEach, describe, expect, it, vi } from 'vitest'
import { playTourReachSound } from './reachSound'
import type { Reach } from './cast'

// The voices themselves are the web-audio graph, and none of that belongs in a
// test of which of them is chosen: the module is stubbed to a list of names.
const { played } = vi.hoisted(() => ({ played: [] as string[] }))

vi.mock('$lib/audio/hatsuSounds', () => {
  const voice = (name: string) => () => void played.push(name)
  return {
    chirpTheFlock: voice('birds'),
    crackAWhip: voice('whip'),
    foldPaper: voice('paper'),
    hissLikeASnake: voice('snake'),
    landAPunch: voice('punch'),
    loostAnArrow: voice('arrow'),
    playATune: (tune: string) => void played.push(`tune:${tune}`),
    stretchTheGum: voice('gum'),
    unspoolWire: voice('wire'),
    wakeTheMachine: voice('machine'),
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

  // The delivery is the one outcome that holds nobody, and it still sounds:
  // something arrived, and the visitor watched it arrive.
  it('sounds the birds when one of them puts a note in a hand', () => {
    playTourReachSound({ outcome: 'delivered', kind: 'flock', characterId: 'cheadle-yorkshire' })
    expect(played).toEqual(['birds'])
  })

  // The console coming out and finding its subject. Nothing is laid on them —
  // the outcome holds nobody — and it still sounds, because something happened.
  it('wakes the console when it is pointed at somebody', () => {
    playTourReachSound({ outcome: 'reading', kind: 'decipher', characterId: 'benjamin', days: 10 })
    expect(played).toEqual(['machine'])
  })

  // The mask is the one cast here whose effect is entirely on the caster, and
  // it still sounds: the gesture happened, and the visitor made it.
  it('lays the mask down audibly, on the face it was copied from', () => {
    playTourReachSound({ outcome: 'worn', kind: 'disguise', characterId: 'machi' })
    expect(played).toEqual(['paper'])
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
