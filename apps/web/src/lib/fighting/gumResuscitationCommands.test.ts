import { openFrame } from './duelStep/frame'
import { createTeamFight, startTeamFight, requestTeamAssist, tickTeamFight } from './teamMatch'
import { teamLivingForView } from './teams/status'
import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  performAuraAttack,
  performMove,
  performThrow,
  tickFight,
} from './engine'
import { performArenaAction } from './arenaActions'
import { performArsenalCommand } from './retrospectiveArsenal'
import { canAct, canGuard } from './fightActorState'
import { toggleEmperorTime } from './kurapikaActions'
import { EMPTY_INPUT, type FighterId, type FightState } from './types'

function scene(opponent: FighterId = 'chrollo'): FightState {
  const state = createFight('hisoka', opponent, {
    mode: 'versus-local',
    formatId: 'knockout',
    environment: {
      arenaInteractions: true,
      preparation: { mode: 'scenario', resources: ['hisoka-asphyxia', 'objects'], cohorts: [] },
    },
  })
  return beginFight({ ...state, opponent: { ...state.opponent, x: 62 } })
}
function advance(state: FightState): FightState {
  for (let i = 0; i < 120; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
describe('the post-mortem prelude blocks actual combat inputs without cleansing the other body', () => {
  it('blocks contextual scenery actions, direct attacks, moves, throws and arsenal commands', () => {
    const state = scene()
    expect(state.gumResuscitation).toBeDefined()
    expect(canAct(state.opponent)).toBe(false)
    expect(canGuard(state.opponent)).toBe(false)
    expect(performArenaAction(state, 'opponent', performAuraAttack)).toBe(state)
    expect(performMove({ state, side: 'opponent', action: 'special' })).toBe(state)
    expect(performThrow(state, 'opponent')).toBe(state)
    expect(
      performAuraAttack({ state, side: 'opponent', kind: 'special', auraCharged: false }),
    ).toBe(state)
    expect(
      performArsenalCommand(state, 'opponent', { action: 'history-page', target: 'black-voice' }),
    ).toBe(state)
  })
  it('also blocks a new Emperor Time activation in the local control path', () => {
    const state = scene('kurapika')
    expect(toggleEmperorTime(state, 'opponent')).toBe(state)
  })
  it('releases the same opponent with its earlier damage and recovery still present', () => {
    const start = scene()
    const injured = {
      ...start,
      opponent: { ...start.opponent, health: 21, hitStun: 27, blockStun: 9 },
    }
    const done = advance(injured)
    expect(done.gumResuscitation).toBeUndefined()
    expect(done.opponent.gumResuscitationPaused).toBeUndefined()
    expect(done.player.gumResuscitationPaused).toBeUndefined()
    expect(done.opponent.health).toBe(21)
    expect(done.opponent.hitStun).toBe(27)
    expect(done.opponent.blockStun).toBe(9)
  })
  it('allows normal actions again after the actual sequence finishes', () => {
    const done = advance(scene())
    expect(canAct(done.opponent)).toBe(true)
    expect(
      performArsenalCommand(done, 'opponent', { action: 'history-page', target: 'black-voice' }),
    ).not.toBe(done)
  })
  it('keeps additional declared amputations when preparing the historical asphyxia', () => {
    const state = beginFight(
      createFight('hisoka', 'theta', {
        mode: 'versus-local',
        environment: {
          preparation: {
            mode: 'scenario',
            resources: ['hisoka-asphyxia'],
            cohorts: [],
            injuries: { player: 'severed-forearms' },
          },
        },
      }),
    )
    expect(state.player.bodyDamage?.parts).toContain('left-forearm')
    expect(state.player.bodyDamage?.parts).toContain('right-forearm')
    const done = advance(state)
    expect(done.player.bodyDamage).toEqual(state.player.bodyDamage)
  })
  it('keeps the same active team stock pending, prevents a relay and resumes after pumping', () => {
    const created = createTeamFight(
      { player: ['hisoka', 'theta', 'chrollo'], opponent: ['kurapika', 'machi', 'franklin'] },
      {
        preparation: { mode: 'scenario', resources: ['hisoka-asphyxia'], cohorts: [] },
      },
    )
    let state = startTeamFight({ ...created, opponent: { ...created.opponent, x: 93 } })
    expect(teamLivingForView(state, 'player')).toBe(3)
    expect(requestTeamAssist(state, 'opponent', 1)).toBe(state)
    for (let i = 0; i < 120; i++)
      state = tickTeamFight(state, { player: EMPTY_INPUT, opponent: EMPTY_INPUT }, 1 / 60)
    expect(state.teamMatch?.seats.player.active).toBe(0)
    expect(state.teamMatch?.seats.opponent.active).toBe(0)
    expect(state.player.gumResuscitationCompleted).toBe(true)
    expect(teamLivingForView(state, 'player')).toBe(3)
    expect(state.phase).toBe('fighting')
  })
  it('advances the same sequence through a direct frame simulation without starting combat contacts', () => {
    const state = scene()
    const direct = openFrame(
      state,
      { player: EMPTY_INPUT, opponent: EMPTY_INPUT },
      performAuraAttack,
    )
    expect(direct.pending).toBe(true)
    expect(direct.state.gumResuscitation?.frame).toBe(1)
    const ordinary = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(direct.state.frame).toBe(ordinary.frame)
    expect(direct.state.player).toEqual(ordinary.player)
    expect(direct.state.opponent).toEqual(ordinary.opponent)
    expect(direct.state.score).toEqual(ordinary.score)
  })
})
