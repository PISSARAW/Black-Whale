import { describe, it, expect } from 'vitest'
import { beginFight, createFight } from './engine'
import { startFutureField, fieldDeceives } from './futureIllusion'
import { guestProjection } from './rosterGuests'
import { advanceRosterGuestActors } from './rosterGuestActors'
import { multiCombatAi } from './multiCombatAi'
import { futureVisibleState } from './parallelFuturePresentation'
import { knownOpponentTarget, approximateTarget } from './opponentAwareness'
import { privatePvpState } from './pvp/view'
import type { FightState } from './types'
import type { RosterGuest } from './rosterGuests'

function ready(): FightState {
  const s = beginFight(
    createFight('tserriednich', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...s,
    player: {
      ...s.player,
      x: 30,
      futureIllusionMode: true,
      futureStoredFrames: 3000,
      nen: { ...s.player.nen, mode: 'zetsu' },
    },
    opponent: { ...s.opponent, x: 46 },
  }
}
function guest(id: string, x = 42): RosterGuest {
  return {
    id,
    owner: 'opponent',
    role: 'puppet',
    phase: 'acting',
    frames: 40,
    cooldown: 0,
    fighter: { ...createFight('illumi', 'hisoka').player, x },
  }
}
describe('the fixed illusion field captures actual bodies present at activation', () => {
  it('does not capture a person outside at activation who enters later', () => {
    const s = ready(),
      outside = startFutureField({ ...s, opponent: { ...s.opponent, x: 85 } }, 'player')
    expect(outside.futureIllusion!.participants).toEqual([])
    expect(
      fieldDeceives({ ...outside, opponent: { ...outside.opponent, x: 40 } }, 'opponent'),
    ).toBe(false)
  })
  it('distinguishes a newly arrived body with the same roster appearance from an earlier guest', () => {
    const first = guest('first'),
      s = startFutureField({ ...ready(), rosterGuests: [first] }, 'player')
    expect(fieldDeceives(guestProjection(s, first), 'opponent')).toBe(true)
    const newcomer = guest('new-body')
    expect(
      fieldDeceives(guestProjection({ ...s, rosterGuests: [newcomer] }, newcomer), 'opponent'),
    ).toBe(false)
  })
  it('does not deceive a previously absent guest even when it later walks into the radius', () => {
    const distant = guest('distant', 90)
    const s = startFutureField({ ...ready(), rosterGuests: [distant] }, 'player')
    expect(
      fieldDeceives(
        guestProjection(s, { ...distant, fighter: { ...distant.fighter, x: 40 } }),
        'opponent',
      ),
    ).toBe(false)
    expect(s.futureIllusion!.participantBodies).not.toContain('guest:distant')
  })
  it('never captures eliminated or structurally dead extra bodies', () => {
    const eliminated = { ...guest('gone'), phase: 'eliminated' as const }
    const dead = guest('dead')
    dead.fighter = { ...dead.fighter, health: 0 }
    const s = startFutureField({ ...ready(), rosterGuests: [eliminated, dead] }, 'player')
    expect(s.futureIllusion!.participants).toEqual(['hisoka'])
  })
  it('tracks a replacement host as a different body without changing the original anchor', () => {
    const s = startFutureField(ready(), 'player')
    const transfer = { ...s, opponent: { ...s.opponent, halkenburgTransferFrame: 20 } }
    expect(fieldDeceives(transfer, 'opponent')).toBe(false)
    expect(transfer.futureIllusion!.x).toBe(30)
  })
  it('bases ordinary AI location and aiming on its actual afterimage perception', () => {
    const s = startFutureField(ready(), 'player')
    const diverged = { ...s, player: { ...s.player, x: 55 } }
    expect(futureVisibleState(diverged, 'opponent').player.x).toBe(30)
    expect(knownOpponentTarget(diverged)?.x).toBe(30)
    expect(approximateTarget(diverged, diverged.opponent)?.x).toBe(30)
    expect(diverged.player.x).toBe(55)
  })
  it('keeps membership valid for the P2 local PvP perspective', () => {
    const s = startFutureField(ready(), 'player')
    const moved = { ...s, player: { ...s.player, x: 55 } }
    const p2 = privatePvpState(moved, 'opponent')
    expect(p2.opponent.x).toBe(30)
    expect(p2.player.id).toBe('hisoka')
  })
  it('steers a captured puppet toward the echo while a newcomer follows the real prince', () => {
    const base = ready(),
      first = guest('captured')
    first.fighter = { ...first.fighter, x: 42, facing: -1 }
    first.cooldown = 30
    const setup = {
      ...base,
      opponent: {
        ...createFight('chrollo', 'tserriednich').player,
        x: 60,
        chrolloBook: { pages: ['black-voice'], page: 0, open: true, bookmark: null },
      },
      rosterGuests: [first],
    } as FightState
    const s = startFutureField(setup, 'player')
    const moved = { ...s, player: { ...s.player, x: 55 } }
    const held = advanceRosterGuestActors(moved, ({ state }) => state)
    expect(held.rosterGuests![0].fighter.x).toBeLessThan(42)
    expect(held.rosterProjection).toBeUndefined()
    const arrival = { ...first, id: 'arrival' }
    const fresh = advanceRosterGuestActors(
      { ...moved, rosterGuests: [arrival] },
      ({ state }) => state,
    )
    expect(fresh.rosterGuests![0].fighter.x).toBeGreaterThan(42)
    expect(fresh.player.x).toBe(55)
  })
  it('lets Feitan time his physical feint from the echo rather than the hidden body', () => {
    const base = ready(),
      s = startFutureField(
        { ...base, opponent: { ...createFight('feitan', 'hisoka').player, x: 45 } },
        'player',
      )
    const hidden = { ...s, player: { ...s.player, x: 62 } }
    expect(multiCombatAi(hidden)?.opponent.umbrellaFeintFrames).toBe(32)
    const near = { ...s, opponent: { ...s.opponent, x: 33 }, player: { ...s.player, x: 48 } }
    expect(multiCombatAi(near)).toBeNull()
  })
})
