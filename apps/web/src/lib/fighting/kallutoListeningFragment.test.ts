import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { paperCommandReady, selectPaperTarget } from './kallutoPaper'
import { bindListeningFragment, paperFragmentRoles } from './kallutoListeningFragment'
import { paperListening, speakPaperWords } from './kallutoListening'
import { paperDolls } from './kallutoSurveillance'
import { EMPTY_INPUT, type FightState } from './types'
import type { PlantedPaper } from './kallutoPaperTypes'

function setup(): FightState {
  const base = beginFight(
    createFight('kalluto', 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { preparation: { mode: 'scenario', resources: ['paper'], cohorts: [] } },
    }),
  )
  return {
    ...base,
    player: { ...base.player, x: 30, aura: 100 },
    opponent: { ...base.opponent, x: 48 },
  }
}
function advance(state: FightState, count = 80): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function cast(state: FightState, moveId = 'kalluto:neutralSpecial'): FightState {
  return performAuraAttack({ state, side: 'player', kind: 'special', moveId, auraCharged: false })
}
const mark = (zone: PlantedPaper['zone'], extra: Partial<PlantedPaper> = {}): PlantedPaper => ({
  owner: 'player',
  ownerMember: 0,
  zone,
  ...extra,
})
function marked(marks: PlantedPaper[], zone: PlantedPaper['zone'] = 'torso'): FightState {
  const state = selectPaperTarget(setup(), 'player', zone)
  return { ...state, opponent: { ...state.opponent, plantedPaper: marks } }
}

describe('Kalluto separates listening fragments from attack paper', () => {
  it('commits the fragment in the selected zone, not every fixed fragment', () => {
    const bound = bindListeningFragment(marked([mark('head'), mark('feet')], 'feet'), 'player')
    expect(paperFragmentRoles(bound, 'player')).toEqual({ guide: ['head'], listening: ['feet'] })
  })

  it('falls back to the most recent fragment and binds only one per subject', () => {
    const once = bindListeningFragment(marked([mark('head'), mark('hands')], 'torso'), 'player')
    expect(paperFragmentRoles(once, 'player').listening).toEqual(['hands'])
    expect(bindListeningFragment(once, 'player')).toBe(once)
  })

  it('ignores the opponent’s own paper and binds nothing without a fixed fragment', () => {
    const foreign = marked([{ owner: 'opponent', ownerMember: 0, zone: 'torso' }])
    expect(bindListeningFragment(foreign, 'player')).toBe(foreign)
    const bare = marked([])
    expect(bindListeningFragment(bare, 'player')).toBe(bare)
  })

  it('a listening fragment no longer guides the serpent; a guide mark does not feed dolls', () => {
    const listening = marked([mark('torso', { listening: true })])
    expect(paperCommandReady(listening, 'player', 'serpent')).toBe(false)
    const guide = marked([mark('torso')])
    expect(paperCommandReady(guide, 'player', 'serpent')).toBe(true)
    const doll = { target: 'opponent' as const, targetMember: 0, createdAt: 0, active: true }
    const withDoll = (state: FightState) => ({
      ...state,
      player: { ...state.player, kallutoPaper: { zone: 'torso' as const, doll, dolls: [doll] } },
    })
    expect(paperListening(withDoll(guide), 'player')).toBe(false)
    expect(paperListening(withDoll(listening), 'player')).toBe(true)
  })

  it('folding a real doll commits the planted fragment and relays real words through it', () => {
    const planted = advance(cast(setup()))
    expect(paperFragmentRoles(planted, 'player').guide).toHaveLength(1)
    const bound = advance(cast(planted, 'kalluto:backSpecial'))
    expect(paperDolls(bound.player)).toHaveLength(1)
    expect(paperFragmentRoles(bound, 'player')).toMatchObject({ guide: [], listening: ['torso'] })
    const heard = speakPaperWords(bound, 'opponent', 'Paroles près du fragment.')
    expect(paperDolls(heard.player)[0].heard?.text).toBe('Paroles près du fragment.')
  })

  it('never turns loose confetti into a sensor, even when gathered and reused', () => {
    const planted = advance(cast(setup()))
    const confetti = planted.battlefield!.entities.filter((entry) => entry.paperScatter)
    expect(confetti.length).toBeGreaterThan(0)
    for (const entry of confetti) expect(entry).not.toHaveProperty('listening')
    expect(planted.player.plantedPaper ?? []).toHaveLength(0)
  })
})
