import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { performBlackVoice } from './blackVoiceControl'
import { EMPTY_INPUT, type FightState } from './types'

// Projection safety of roster bodies: a guest death stays the guest's, and running the
// pair resolution inside a projection never steps the enemy's clocks a second time.

function puppet(): FightState {
  const s = beginFight(
    createFight('chrollo', 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { preparation: { mode: 'scenario', resources: [], cohorts: ['player'] } },
    }),
  )
  const ready = {
    ...s,
    player: {
      ...s.player,
      x: 30,
      aura: 100,
      chrolloBook: { pages: ['black-voice'], page: 0, open: true, bookmark: null },
    },
    opponent: { ...s.opponent, x: 60 },
  } as FightState
  return performBlackVoice({ state: ready, side: 'player', command: { action: 'black-roster' } })
}

/** The puppet stands acting in front of Hisoka while Chrollo stays far behind. */
function exposed(health: number): FightState {
  const s = puppet()
  const guest = s.rosterGuests![0]
  return {
    ...s,
    player: { ...s.player, x: 10, blackOrder: 'wait' },
    rosterGuests: [
      { ...guest, phase: 'acting', frames: 40, fighter: { ...guest.fighter, x: 55, health } },
    ],
  }
}

function frames(s: FightState, n: number) {
  for (let i = 0; i < n; i++)
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return s
}

describe('roster body projections', () => {
  it('kills a guest without killing, recording or deciding for its leader', () => {
    const struck = frames(performAttack(exposed(1), 'opponent', 'heavy'), 40)
    expect(struck.rosterGuests![0].phase).toBe('eliminated')
    expect(struck.player.health).toBe(struck.player.maxHealth)
    expect(struck.phase).toBe('fighting')
    expect(struck.winner).toBeNull()
    expect(struck.deaths ?? []).toEqual([])
  })

  it('advances the enemy clocks once per frame while a guest is acting', () => {
    const s = exposed(100)
    const effects = { ...s.opponent.hatsuEffects, forcedZetsuFrames: 50, contagionFrames: 50 }
    const timed = {
      ...s,
      opponent: { ...s.opponent, x: 90, hitStun: 50, guardFrames: 50, hatsuEffects: effects },
    }
    const ordinary = { ...timed, rosterGuests: [] }
    const withGuest = frames(timed, 10).opponent
    const without = frames(ordinary, 10).opponent
    expect(withGuest.hitStun).toBe(without.hitStun)
    expect(withGuest.guardFrames).toBe(without.guardFrames)
    expect(withGuest.hatsuEffects.forcedZetsuFrames).toBe(without.hatsuEffects.forcedZetsuFrames)
    expect(withGuest.hatsuEffects.contagionFrames).toBe(without.hatsuEffects.contagionFrames)
  })
})
