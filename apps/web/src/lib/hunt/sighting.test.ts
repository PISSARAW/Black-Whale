import { describe, it, expect } from 'vitest'
import { poolOf } from './aura'
import { initialDuelState, type DuelState } from './duel/state'
import { initialHunterState, type HunterState } from './hunter/patrol'
import {
  AURA_MODE,
  FALLEN,
  HUNTER_COLOURS,
  hunterFigure,
  lookOf,
  sightings,
  stageOf,
  type Sighting,
} from './sighting'

function hunter(over: Partial<HunterState> = {}): HunterState {
  return { ...initialHunterState({ position: [4, 7], spaceId: 'salon' }), ...over }
}

const at = (over: Partial<HunterState> = {}, duel: DuelState | null = null): Sighting => ({
  hunter: hunter(over),
  tierId: 'interior-room-1004',
  floor: 12,
  duel,
})

function duelWith(over: Partial<DuelState['hunter']> = {}): DuelState {
  const duel = initialDuelState({ player: poolOf(100), hunter: poolOf(100) })
  return { ...duel, hunter: { ...duel.hunter, ...over } }
}

describe('what he looks like he is doing', () => {
  it('walks his round by default', () => {
    expect(lookOf(hunter())).toBe('walking')
  })

  it('stands and listens at a waypoint', () => {
    expect(lookOf(hunter({ mode: 'listen' }))).toBe('listening')
  })

  it('goes over a floor when he is searching', () => {
    expect(lookOf(hunter({ mode: 'search' }))).toBe('searching')
  })

  it('reads as held before anything else — it is the one the player caused', () => {
    expect(lookOf(hunter({ mode: 'search', held: 4 }))).toBe('held')
    expect(lookOf(hunter({ mode: 'listen', held: 0.1 }))).toBe('held')
  })

  it('gives each one its own colour', () => {
    expect(new Set(Object.values(HUNTER_COLOURS)).size).toBe(Object.keys(HUNTER_COLOURS).length)
  })
})

describe('the aura he is visibly holding — the tell T4.4 turns on', () => {
  it('is up while there is anything left in him', () => {
    expect(stageOf(at())).toBe(AURA_MODE.ten)
    expect(stageOf(at({ pool: poolOf(1) }))).toBe(AURA_MODE.ten)
  })

  it('goes out entirely once his Ten no longer holds', () => {
    expect(stageOf(at({ pool: poolOf(0) }))).toBe(AURA_MODE.zetsu)
  })

  it('spreads wide when he raises Ken in a duel', () => {
    expect(stageOf(at({}, duelWith({ ken: true })))).toBe(AURA_MODE.ren)
    expect(stageOf(at({}, duelWith({ ken: false })))).toBe(AURA_MODE.ten)
  })

  it('is out even under Ken, once he is spent — empty is empty', () => {
    expect(stageOf(at({ pool: poolOf(0) }, duelWith({ ken: true })))).toBe(AURA_MODE.zetsu)
  })

  it('never claims he has gone down: he is held where he stands, not floored', () => {
    for (const sighting of [at(), at({ held: 5 }), at({ pool: poolOf(0) })]) {
      expect(stageOf(sighting)).toBeLessThan(FALLEN)
    }
  })
})

describe('the figure handed to the scene', () => {
  it('stands where he stands, with his feet on the floor of the room', () => {
    const figure = hunterFigure(at())!
    expect(figure.at).toEqual([4, 7])
    expect(figure.y).toBe(12)
    expect(figure.spaceId).toBe('salon')
    expect(figure.tierId).toBe('interior-room-1004')
  })

  it('is a body rather than a technique laid on the room', () => {
    const figure = hunterFigure(at())!
    expect(figure.kind).toBe('combatant')
    expect(figure.hidden).toBe(false)
  })

  it('takes its colour from what he is doing', () => {
    expect(hunterFigure(at({ held: 3 }))!.colour).toBe(HUNTER_COLOURS.held)
    expect(hunterFigure(at({ mode: 'search' }))!.colour).toBe(HUNTER_COLOURS.searching)
  })

  it('keeps a stable id, so the scene moves one figure rather than building many', () => {
    expect(hunterFigure(at())!.id).toBe(hunterFigure(at({ mode: 'search' }))!.id)
  })

  it('is nothing at all when he is between rooms', () => {
    expect(hunterFigure(at({ spaceId: null }))).toBeNull()
    expect(sightings(at({ spaceId: null }))).toEqual([])
  })

  it('is the only thing in the list', () => {
    expect(sightings(at())).toHaveLength(1)
  })
})

describe('what it deliberately does not do', () => {
  it('says nothing about what he believes', () => {
    // Where he thinks the player is would be a marker on a plan by another
    // name, and the whole of step 1 is that you do not get one.
    const knowing = at({ belief: { ...hunter().belief, at: [99, 99], spaceId: 'chambre' } })
    const figure = hunterFigure(knowing)!
    expect(JSON.stringify(figure)).not.toContain('99')
    expect(figure.at).toEqual([4, 7])
  })

  it('does not hide him behind a wall itself — the scene’s depth test does that', () => {
    // Nothing here consults the player's position, so nothing here can decide
    // line of sight. The apparition is placed and the geometry occludes it.
    expect(Object.keys(at())).toEqual(['hunter', 'tierId', 'floor', 'duel'])
  })
})
