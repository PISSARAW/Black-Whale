import { describe, expect, it } from 'vitest'
import {
  createTeamFight,
  requestTeamAssist,
  tickTeamFight,
  nextTeamRound,
  startTeamFight,
} from './teamMatch'
import { teamRelayReady } from './teamRelayRules'
import { teamLiving } from './teamTypes'
import { FIGHTING_ROSTER } from './roster'
import { performAttack, performMove } from './engine'
import { fightReplayHash } from './fightReplayHash'
import { createReplayRecorder } from './fightReplayRecorder'
import { practiceReplay } from './fightReplayPractice'
import { createCareerTracker } from './career/runtime'
import { moonlightPartiesVisible } from './moonlightParties'
import {
  offerMoonlightContract,
  respondMoonlightContract,
  advanceMoonlightContract,
} from './moonlightContract'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'

const inputs = { player: EMPTY_INPUT, opponent: EMPTY_INPUT }
function team(ids: FighterId[] = ['hisoka', 'kurapika', 'theta']) {
  return startTeamFight(
    createTeamFight({ player: ids, opponent: ['theta', 'chrollo', 'franklin'] }),
  )
}
function gate(state = team()) {
  return { ...state, player: { ...state.player, x: 7 }, opponent: { ...state.opponent, x: 55 } }
}
function step(state: FightState, count: number) {
  for (let i = 0; i < count; i++) state = tickTeamFight(state, inputs, 1 / 60)
  return state
}

describe('local three-fighter teams', () => {
  it('requires three distinct known characters on each side', () => {
    for (const roster of [['hisoka', 'hisoka', 'theta'], ['hisoka'], ['nobody', 'hisoka', 'theta']])
      expect(() =>
        createTeamFight({
          player: roster as FighterId[],
          opponent: ['theta', 'chrollo', 'franklin'],
        }),
      ).toThrow('INVALID_TEAM')
  })
  it.each(FIGHTING_ROSTER.map((fighter) => fighter.id))(
    'lets %s call its own ally without copying a body or equipment',
    (id) => {
      const ids = [
        id,
        ...FIGHTING_ROSTER.map((fighter) => fighter.id)
          .filter((fighter) => fighter !== id)
          .slice(0, 2),
      ]
      const state = gate(team(ids)),
        before = fightReplayHash(state)
      const next = requestTeamAssist(state, 'player', 1)
      expect(next).not.toBe(state)
      expect(next.player.id).toBe(ids[1])
      expect(next.player.equipment).toEqual(next.teamMatch!.seats.player.members[1].equipment)
      expect(next.teamMatch!.seats.player.members[0].id).toBe(id)
      expect(fightReplayHash(state)).toBe(before)
      expect(requestTeamAssist(next, 'player', 2)).toBe(next)
    },
  )
  it('does not grant an escape, interrupt a cost or freeze Nen commitments off stage', () => {
    const initial = gate()
    const cases: FightState[] = [
      { ...initial, player: { ...initial.player, x: 44 } },
      { ...initial, player: { ...initial.player, coveringEars: true } },
      { ...initial, player: { ...initial.player, hitStun: 2 } },
      { ...initial, player: { ...initial.player, wakeupInvulnerableFrames: 2 } },
      { ...initial, player: { ...initial.player, nen: { ...initial.player.nen, mode: 'zetsu' } } },
      {
        ...initial,
        player: {
          ...initial.player,
          hatsuEffects: { ...initial.player.hatsuEffects, forcedZetsuFrames: 30 },
        },
      },
      { ...initial, player: { ...initial.player, chainJail: { owner: 'opponent', x: 7, y: 0 } } },
      {
        ...initial,
        bungeeGum: { owner: 'opponent', target: 'player', hidden: true, retracting: false },
      },
      performMove({ state: initial, side: 'player', action: 'light' }),
    ]
    for (const state of cases) expect(requestTeamAssist(state, 'player', 1)).toBe(state)
    const chrollo = gate(team(['chrollo', 'hisoka', 'theta']))
    chrollo.player.chrolloBook = { pages: ['melody'], page: 0, open: false, bookmark: 'melody' }
    expect(requestTeamAssist(chrollo, 'player', 1)).toBe(chrollo)
  })
  it('walks an ally into a real light strike and back, preserving each body’s resources', () => {
    let state = gate(team(['theta', 'hisoka', 'kurapika']))
    state.player.health = 73
    state.player.aura = 27
    state.opponent.x = 23
    state = requestTeamAssist(state, 'player', 1)
    expect(state.player.id).toBe('hisoka')
    const called = state,
      calledHash = fightReplayHash(state)
    state = step(state, 1)
    expect(fightReplayHash(called)).toBe(calledHash)
    let landed = false
    for (let i = 0; i < 600 && state.teamMatch!.seats.player.relay; i++) {
      state = step(state, 1)
      landed ||= state.opponent.health < state.opponent.maxHealth
    }
    expect(landed).toBe(true)
    expect(state.teamMatch!.seats.player.relay).toBeNull()
    expect(state.player.id).toBe('theta')
    expect(state.player.health).toBe(73)
    expect(state.player.aura).toBeCloseTo(27, 1) // normal regeneration on the first frame back
    expect(state.teamMatch!.seats.player.assistUsed).toBe(true)
  })
  it('lets the opponent hit an arriving ally and eliminates that actual reserve, not its leader', () => {
    let state = gate(team(['hisoka', 'kurapika', 'theta']))
    state.teamMatch!.seats.player.members[1].health = 1
    state.opponent.x = 23
    state = requestTeamAssist(state, 'player', 1)
    state = performAttack(state, 'opponent', 'ranged')
    for (let i = 0; i < 180 && state.phase === 'fighting'; i++) state = step(state, 1)
    expect(state.phase).toBe('finished')
    expect(state.teamMatch!.seats.player.members[1].health).toBe(0)
    expect(teamLiving(state.teamMatch!.seats.player)).toBe(2)
    expect(state.teamMatch!.seats.player.members[0].health).toBe(state.player.maxHealth)
    state = nextTeamRound(state)
    expect(state.player.id).toBe('hisoka')
    expect(state.phase).toBe('ready')
  })
  it('waits for Cat’s Name on a killed assist before counting a stock or returning a body', () => {
    let state = gate(team(['hisoka', 'camilla', 'kurapika']))
    state.teamMatch!.seats.player.members[1].health = 1
    state.opponent.x = 23
    state = requestTeamAssist(state, 'player', 1)
    state = performAttack(state, 'opponent', 'ranged')
    for (let i = 0; i < 90 && !state.catsName; i++) state = step(state, 1)
    expect(state.catsName?.killerSide).toBe('opponent')
    expect(state.phase).toBe('fighting')
    expect(state.player.id).toBe('camilla')
    state = step(state, 260)
    expect(state.winner).toBe('player')
    expect(teamLiving(state.teamMatch!.seats.player)).toBe(3)
    expect(teamLiving(state.teamMatch!.seats.opponent)).toBe(2)
  })
  it('finishes a team only after three actual KO verdicts and carries survivor HP and aura', () => {
    let state = team(['theta', 'hisoka', 'kurapika'])
    state.player.x = 44
    state.player.health = 71
    state.opponent.x = 50
    state.opponent.health = 1
    for (const actor of state.teamMatch!.seats.opponent.members) actor.health = 1
    for (let stock = 0; stock < 3; stock++) {
      state = performAttack(state, 'player', 'ranged')
      for (let i = 0; i < 100 && state.phase === 'fighting'; i++) state = step(state, 1)
      expect(state.phase).toBe('finished')
      expect(teamLiving(state.teamMatch!.seats.opponent)).toBe(2 - stock)
      expect(state.player.health).toBe(71)
      if (stock < 2) {
        const aura = state.player.aura
        state = nextTeamRound(state)
        expect(state.player.health).toBe(71)
        expect(state.player.aura).toBe(aura)
        state = startTeamFight(state)
        state.player.x = 44
        state.opponent.x = 50
      }
    }
    expect(state.teamMatch!.winner).toBe('player')
    expect(nextTeamRound(state)).toBe(state)
  })
  it('keeps ordinary duels unchanged and excludes teams from career and two-body replay tools', () => {
    const initial = team(),
      results: unknown[] = [],
      tracker = createCareerTracker((match) => results.push(match))
    tracker.begin(initial)
    const finished = {
      ...initial,
      phase: 'finished' as const,
      matchWinner: 'player' as const,
      roundsWon: { player: 2, opponent: 0 },
    }
    tracker.observe(initial, finished)
    expect(results).toEqual([])
    expect(createReplayRecorder(initial)).toBeNull()
    expect(practiceReplay(initial, 'team', 0)).toBeNull()
    const { teamMatch: _, ...ordinary } = initial
    expect(tickTeamFight(ordinary, inputs, 1 / 60)).toBe(ordinary)
    expect(teamRelayReady(gate(), 'player')).toBe(true)
  })
  it('keeps a signed contract bound to its people after a replacement enters', () => {
    let state = team(['longhi', 'hisoka', 'kurapika'])
    state.player.x = 44
    state.opponent.x = 50
    state = offerMoonlightContract({ state, side: 'player' })
    state = respondMoonlightContract({ state, side: 'opponent', accept: true })
    expect(state.moonlight?.active?.signers).toEqual({ player: 'longhi', opponent: 'theta' })
    state = { ...state, opponent: { ...state.opponent, health: 0 } }
    state = step(state, 1)
    expect(state.phase).toBe('finished')
    state = startTeamFight(nextTeamRound(state))
    expect(state.opponent.id).toBe('chrollo')
    expect(state.moonlight?.active).toBeDefined()
    expect(moonlightPartiesVisible(state, state.moonlight!.active!)).toBe(false)
    const thirdParty = performMove({ state, side: 'opponent', action: 'light' })
    expect(thirdParty.opponent.moonlightZetsu).not.toBe(true)
    const signer = performMove({ state, side: 'player', action: 'light' })
    expect(signer.player.moonlightZetsu).toBe(true)
    for (let i = 0; i < 300; i++) state = advanceMoonlightContract(state)
    expect(state.opponent.moonlightLoan ?? 0).toBe(0)
    expect(state.teamMatch!.seats.opponent.members[0].moonlightLoan).toBe(1)
  })
  it('returns a draw when the last two real bodies trade fatal light strikes', () => {
    let state = startTeamFight(
      createTeamFight({
        player: ['hisoka', 'kurapika', 'theta'],
        opponent: ['hisoka', 'chrollo', 'franklin'],
      }),
    )
    for (const side of ['player', 'opponent'] as const) {
      state[side].health = 1
      state.teamMatch!.seats[side].members[1].health = 0
      state.teamMatch!.seats[side].members[2].health = 0
    }
    state.player.x = 44
    state.opponent.x = 50
    state = performMove({ state, side: 'player', action: 'light' })
    state = performMove({ state, side: 'opponent', action: 'light' })
    state = step(state, 60)
    expect(state.winner).toBe('draw')
    expect(state.teamMatch!.winner).toBe('draw')
    expect(nextTeamRound(state)).toBe(state)
  })
})
