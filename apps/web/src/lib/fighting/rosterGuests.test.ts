import { captureDolphinAura } from './dolphinAura'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight, performAuraAttack } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { performBlackVoice, implantBlackVoice } from './blackVoiceControl'
import { advanceRosterGuestActors } from './rosterGuestActors'
import { performHalkenburgTransfer } from './halkenburgTransfer'
import { performDolphinLoan } from './dolphinLoan'
import { COHORT_WILL_FRAMES } from './preparationTuning'
import { createKurapika } from './kurapika'
import { fightReplayHash } from './fightReplayHash'
import { resolveFightOutcome } from './fightOutcome'
import { resolveRosterProjectileHits } from './rosterGuestContacts'
import { advanceCatsName } from './camillaCat'
import { hatsuFor } from './hatsu/registry'
import { privatePvpState } from './pvp/view'
import { encodeFightSnapshot, decodeFightSnapshot } from './fightReplaySnapshot'
import { EMPTY_INPUT, type FightState } from './types'

function ready(id: 'chrollo' | 'halkenburg' | 'kurapika' = 'chrollo', rosterVariant = false) {
  const s = beginFight(
    createFight(id, 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        halkenburgRosterVariant: rosterVariant,
        preparation: { mode: 'scenario', resources: [], cohorts: ['player'] },
      },
    }),
  )
  return {
    ...s,
    player: {
      ...s.player,
      x: 30,
      aura: 100,
      chrolloBook:
        id === 'chrollo'
          ? { pages: ['black-voice'], page: 0, open: true, bookmark: null }
          : undefined,
    },
    opponent: { ...s.opponent, x: 60 },
  } as FightState
}
function call(s = ready()) {
  return performBlackVoice({ state: s, side: 'player', command: { action: 'black-roster' } })
}
function frames(s: FightState, n: number) {
  for (let i = 0; i < n; i++)
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return s
}
describe('roster bodies operate in the real combat world', () => {
  it('draws a deterministic physical puppet and consumes one of two antennae', () => {
    const s = ready(),
      a = call(s),
      b = call(s)
    expect(fightReplayHash(a)).toBe(fightReplayHash(b))
    expect(a.rosterGuests).toHaveLength(1)
    expect(a.rosterGuests![0].fighter.id).not.toBe('chrollo')
    expect(a.player.blackAntennas!.filter((item) => item.guestId)).toHaveLength(1)
    expect(
      implantBlackVoice(a, 'player', 'opponent').player.blackAntennas!.every(
        (item) => item.target || item.guestId,
      ),
    ).toBe(true)
    expect(call(a)).toBe(a)
  })
  it('runs the puppet AI beside the leader and lands real attacks without stepping the enemy twice', () => {
    const s = call()
    const timed = { ...s, opponent: { ...s.opponent, hitStun: 80 } }
    const step = frames(timed, 10)
    expect(step.opponent.hitStun).toBe(70)
    expect(step.frame).toBe(10)
    const fighting = frames(s, 360)
    expect(fighting.player.id).toBe('chrollo')
    expect(fighting.opponent.health).toBeLessThan(s.opponent.health)
    expect(fighting.rosterGuests![0].fighter.x).not.toBe(s.rosterGuests![0].fighter.x)
  })
  it('interrupts implantation, pauses control when the page is lost, and allows physical antenna removal', () => {
    const s = call()
    const interrupted = advanceRosterGuestActors(
      { ...s, player: { ...s.player, hitStun: 10 } },
      performAuraAttack,
    )
    expect(interrupted.rosterGuests![0].phase).toBe('leaving')
    const active = frames(s, 20)
    const closed = advanceRosterGuestActors(
      {
        ...active,
        player: { ...active.player, chrolloBook: { ...active.player.chrolloBook!, open: false } },
      },
      performAuraAttack,
    )
    expect(closed.rosterGuests![0].phase).toBe('leaving')
    const recovered = performBlackVoice({
      state: s,
      side: 'player',
      command: { action: 'black-remove', target: '0' },
    })
    expect(recovered.player.blackAntennas![0]).toEqual({ id: 0 })
  })
  it('replaces Halkenburg with the drawn body, changes the real moveset and preserves the health ratio', () => {
    const initial = ready('halkenburg', true)
    const s = {
      ...initial,
      player: {
        ...initial.player,
        health: initial.player.maxHealth / 2,
        hatsuEffects: { ...initial.player.hatsuEffects, cohortWillFrames: COHORT_WILL_FRAMES },
      },
    }
    const transfer = performHalkenburgTransfer({
      state: s,
      side: 'player',
      command: { action: 'halkenburg-transfer' },
    })
    expect(transfer.player.id).not.toBe('halkenburg')
    expect(transfer.player.halkenburgOrigin).toBe('halkenburg')
    expect(transfer.player.health / transfer.player.maxHealth).toBeCloseTo(0.5, 1)
    const setup = {
      player: 'halkenburg' as const,
      opponent: 'hisoka' as const,
      mode: 'versus-local' as const,
      formatId: 'knockout' as const,
      environment: s.environment,
    }
    expect(decodeFightSnapshot(encodeFightSnapshot(transfer), setup).player.id).toBe(
      transfer.player.id,
    )
  })
  it('credits the leader’s round when the puppet lands the fatal projectile', () => {
    const s = call(),
      guest = s.rosterGuests![0]
    const struck = { ...s, opponent: { ...s.opponent, health: 1 } }
    const ended = resolveRosterProjectileHits(struck, [
      {
        defenderSide: 'opponent',
        position: { x: 60, y: 6 },
        projectile: {
          id: 99,
          owner: 'player',
          sourceBody: guest.id,
          fighterId: guest.fighter.id,
          x: 60,
          y: 6,
          velocityX: 100,
          width: 1,
          height: 1,
          damage: 50,
          hitstun: 10,
          blockstun: 5,
          hitstop: 0,
          knockback: 1,
          targetZone: 'torso',
          shape: 'bullet',
          colour: '#fff',
          matter: 'object',
          age: 0,
          lifetime: 60,
        },
      },
    ])
    expect(ended.phase).toBe('finished')
    expect(ended.winner).toBe('player')
    expect(ended.roundsWon.player).toBe(1)
    expect(ended.player.id).toBe('chrollo')
  })
  it('lets Camilla consume the actual puppet killer without killing Chrollo', () => {
    const called = call()
    const camilla = createFight('camilla', 'hisoka', {
      formatId: 'knockout',
      mode: 'versus-local',
    }).player
    const s = { ...called, opponent: { ...camilla, x: 60, health: 1 } }
    const guest = s.rosterGuests![0]
    let next = resolveRosterProjectileHits(s, [
      {
        defenderSide: 'opponent',
        position: { x: 60, y: 6 },
        projectile: {
          id: 99,
          owner: 'player',
          sourceBody: guest.id,
          fighterId: guest.fighter.id,
          x: 60,
          y: 6,
          velocityX: 100,
          width: 1,
          height: 1,
          damage: 50,
          hitstun: 10,
          blockstun: 5,
          hitstop: 0,
          knockback: 1,
          targetZone: 'torso',
          shape: 'bullet',
          colour: '#fff',
          matter: 'object',
          age: 0,
          lifetime: 60,
        },
      },
    ])
    next = resolveFightOutcome(next)
    expect(next.catsName?.killerBody).toBe(guest.id)
    for (let frame = 0; frame < 120; frame++) next = advanceCatsName(next)
    expect(next.player.health).toBe(s.player.health)
    expect(next.opponent.health).toBe(camilla.maxHealth)
    expect(next.rosterGuests![0].fighter.health).toBe(0)
    expect(next.phase).toBe('fighting')
  })
  it('replaces native Halkenburg after a real arrow impact as well as the explicit transfer command', () => {
    const s = ready('halkenburg', true)
    const supporter = s.battlefield!.entities.find(
      (entry) => entry.owner === 'player' && entry.kind === 'supporter',
    )!
    const nocked = {
      ...s,
      player: {
        ...s.player,
        halkenburgSupporter: supporter.id,
        hatsuEffects: { ...s.player.hatsuEffects, arrowNocked: 1 },
      },
    }
    const struck = hatsuFor('halkenburg').onImpact({
      state: nocked,
      side: 'player',
      defenderSide: 'opponent',
      source: 'halkenburg',
      moveId: 'halkenburg:neutralSpecial',
      blocked: true,
      concealed: false,
    })
    expect(struck.player.halkenburgOrigin).toBe('halkenburg')
    expect(struck.player.id).not.toBe('halkenburg')
    expect(struck.opponent.hatsuEffects.possessedFrames).toBe(0)
  })
  it('refuses Halkenburg transfer without the marked consenting cohort and gathered will', () => {
    const s = ready('halkenburg', true)
    expect(
      performHalkenburgTransfer({
        state: s,
        side: 'player',
        command: { action: 'halkenburg-transfer' },
      }),
    ).toBe(s)
  })
  it('releases the loan when its temporary borrower dies instead of locking Emperor Time forever', () => {
    const initial = ready('kurapika')
    const loaded: FightState = {
      ...initial,
      player: {
        ...initial.player,
        kurapika: {
          ...createKurapika(),
          emperorTime: true,
          held: {
            victim: 'opponent',
            source: 'franklin',
            auraSupply: {
              ...captureDolphinAura(createFight('franklin', 'hisoka').player),
              amount: 80,
            },
            moveId: 'franklin:neutralSpecial',
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    const called = performDolphinLoan({
      state: loaded,
      side: 'player',
      command: { action: 'dolphin-loan' },
    })
    const guest = called.rosterGuests![0]
    const dead = {
      ...called,
      rosterGuests: [{ ...guest, fighter: { ...guest.fighter, health: 0 } }],
    }
    const ended = advanceRosterGuestActors(dead, performAuraAttack)
    expect(ended.rosterGuests![0].phase).toBe('eliminated')
    expect(ended.player.kurapika!.held).toMatchObject({
      used: false,
      loaded: true,
      lentTo: undefined,
    })
    expect(() => advanceRosterGuestActors(ended, performAuraAttack)).not.toThrow()
  })
  it('lends one loaded ability to an actual random ally and leaves the life cost on Kurapika', () => {
    const initial = ready('kurapika')
    const s: FightState = {
      ...initial,
      player: {
        ...initial.player,
        kurapika: {
          ...createKurapika(),
          emperorTime: true,
          held: {
            victim: 'opponent',
            source: 'franklin',
            auraSupply: {
              ...captureDolphinAura(createFight('franklin', 'hisoka').player),
              amount: 80,
            },
            moveId: 'franklin:neutralSpecial',
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    const called = performArsenalAction(
      { state: s, side: 'player', command: { action: 'dolphin-loan' } },
      performAuraAttack,
    )
    expect(called.rosterGuests![0].role).toBe('loan')
    expect(called.player.kurapika!.held!.lentTo).toBe(called.rosterGuests![0].id)
    const launched = frames(called, 24)
    expect(launched.player.dolphinLoanResult).toBe('cast')
    expect(launched.player.id).toBe('kurapika')
    expect(launched.player.kurapika!.lifespanFrames).toBeGreaterThan(0)
    expect(launched.player.kurapika!.held?.lentTo).toBe(called.rosterGuests![0].id)
    expect(launched.rosterGuests![0].fighter.id).not.toBe('franklin')
    expect(
      performDolphinLoan({ state: called, side: 'player', command: { action: 'dolphin-loan' } }),
    ).toBe(called)
    expect(privatePvpState(launched, 'opponent').opponent.id).toBe('kurapika')
  })
})
