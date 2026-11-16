import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performMove } from './engine'
import { cameraSnapshot, cinematicEvents } from './cinematicEvents'
import { createCinematicDirector } from './cinematicDirector'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { chainRuleDeath } from './kurapikaActions'
import { fightReplayHash } from './fightReplayHash'
import type { FightSide } from './types'

const duel = (side: FightSide) =>
  beginFight(
    createFight(
      side === 'player' ? 'kurapika' : 'hisoka',
      side === 'opponent' ? 'kurapika' : 'hisoka',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )

describe('Chain Jail fatal vow cinematic', () => {
  it.each(['player', 'opponent'] as const)(
    'frames the real vow verdict once for %s and resets next round',
    (side) => {
      const state = duel(side)
      const director = createCinematicDirector()
      director.update(state)
      const dead = performMove({ state, side, action: 'special' })
      expect(dead[side].health).toBe(0)
      expect(dead.finishReason).toBe('knockout')
      expect(dead.deaths).toBeUndefined()
      const hash = fightReplayHash(dead)
      const events = cinematicEvents(dead, cameraSnapshot(state))
      expect(events.filter((e) => e.detail?.eventId === 'kurapika.jail-vow')).toHaveLength(1)
      expect(director.update(dead).detail).toMatchObject({
        eventId: 'kurapika.jail-vow',
        side,
        anchors: [{ type: 'rig', side, part: 'chest' }],
      })
      expect(
        cinematicEvents(dead, cameraSnapshot(dead)).filter(
          (e) => e.detail?.eventId === 'kurapika.jail-vow',
        ),
      ).toHaveLength(0)
      expect(fightReplayHash(dead)).toBe(hash)
      const ready = nextRound(dead)
      expect(director.update(ready).detail).toBeNull()
      const fresh = beginFight(ready)
      expect(
        cinematicEvents(fresh, cameraSnapshot(ready)).filter(
          (e) => e.detail?.eventId === 'kurapika.jail-vow',
        ),
      ).toHaveLength(0)
      const secondDeath = performMove({ state: fresh, side, action: 'special' })
      expect(
        cinematicEvents(secondDeath, cameraSnapshot(fresh)).filter(
          (e) => e.detail?.eventId === 'kurapika.jail-vow',
        ),
      ).toHaveLength(1)
    },
  )

  it.each(['player', 'opponent'] as const)(
    'does not confuse an ordinary knockout or Judgment Chain with the vow for %s',
    (side) => {
      const state = duel(side)
      const other = side === 'player' ? 'opponent' : 'player'
      const knockedOut = resolveFightOutcome(
        recordFightDeath(
          { ...state, [side]: { ...state[side], health: 0 } },
          { victimSide: side, killerSide: other, cause: 'strike' },
        ),
      )
      const judged = chainRuleDeath(
        { ...state, [side]: { ...state[side], judgmentChain: { owner: other, rule: 'zetsu' } } },
        side,
      )
      for (const dead of [knockedOut, judged]) {
        expect(dead.finishReason).toBe('knockout')
        expect(
          cinematicEvents(dead, cameraSnapshot(state)).some(
            (e) => e.detail?.eventId === 'kurapika.jail-vow',
          ),
        ).toBe(false)
      }
    },
  )

  it.each(['player', 'opponent'] as const)(
    'does not trigger for unavailable input from %s',
    (side) => {
      const initial = duel(side)
      const state = { ...initial, [side]: { ...initial[side], hitStun: 30 } }
      const next = performMove({ state, side, action: 'special' })
      expect(next).toBe(state)
      expect(
        cinematicEvents(next, cameraSnapshot(state)).some(
          (e) => e.detail?.eventId === 'kurapika.jail-vow',
        ),
      ).toBe(false)
    },
  )

  it('does not announce a fatal vow when training restores the fighter', () => {
    const state = beginFight(createFight('kurapika', 'hisoka', { mode: 'training' }))
    const next = performMove({ state, side: 'player', action: 'special' })
    expect(next.player.health).toBe(next.player.maxHealth)
    expect(next.phase).toBe('fighting')
    expect(
      cinematicEvents(next, cameraSnapshot(state)).some(
        (e) => e.detail?.eventId === 'kurapika.jail-vow',
      ),
    ).toBe(false)
  })
})
