import { describe, expect, it, vi } from 'vitest'
import { render } from 'svelte/server'
import Readout from '$lib/components/fighting/FightDecisionReadout.svelte'
import HanzoCall from '$lib/components/fighting/FightHanzoCall.svelte'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { performTrainingAction } from './trainingAction'
import { observeFightCommand, visibleCommandFeedback } from './commandFeedback'
import { commandFailure } from './commandFailure'
import { commandFeedbackText } from './commandFeedbackText'
import { fightCommitments } from './fightCommitments'
import { attackData, attackTotal } from './frameData'
import { projectHanzo } from './hanzoProjection'
import { FIXED_STEP } from './fightClock'
import { EMPTY_INPUT, type FighterId, type FightState } from './types'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ url: new URL('http://localhost/fr/fighting'), data: {} }) }
})
function fight(id: FighterId = 'hisoka', training = false): FightState {
  const state = beginFight(
    createFight(id, 'kurapika', {
      mode: training ? 'training' : 'versus-local',
      formatId: 'knockout',
    }),
  )
  return {
    ...state,
    player: { ...state.player, aura: 100 },
    opponent: { ...state.opponent, aura: 100 },
  }
}
const special = { side: 'player', action: 'special' } as const

describe('own-command refusal explanations use the actual execution result', () => {
  it('reports missing real equipment without paying aura or starting the Hatsu', () => {
    const state = fight('melody')
    state.player.equipment = []
    const result = performTrainingAction({ state, ...special })
    expect(result.commandFeedback?.player).toMatchObject({
      outcome: 'refused',
      reason: 'equipment',
    })
    expect(result.player).toBe(state.player)
    expect(result.opponent).toBe(state.opponent)
    expect(performMove({ state, ...special })).toBe(state)
  })
  it('explains copied equipment and hand constraints, then accepts the genuinely prepared copy', () => {
    const state = fight('chrollo')
    state.player.chrolloBook = { pages: ['melody'], page: 0, open: false, bookmark: 'melody' }
    const missing = performTrainingAction({ state, ...special })
    expect(missing.commandFeedback?.player?.reason).toBe('equipment')
    expect(missing.player.equipment).toEqual(['book'])
    state.player.equipment = ['book', 'flute']
    state.player.chrolloBook.open = true
    expect(performTrainingAction({ state, ...special }).commandFeedback?.player?.reason).toBe(
      'hands',
    )
    state.player.chrolloBook.open = false
    const ready = performTrainingAction({ state, ...special })
    expect(ready.commandFeedback?.player?.outcome).toBe('started')
    expect(ready.player.melodyPerformance).toBeDefined()
    expect(ready.player.aura).toBe(92)
  })
  it('does not change a nonlive combat body while reporting its phase', () => {
    const state = fight()
    state.phase = 'ready'
    const result = performTrainingAction({
      state,
      side: 'player',
      action: 'light',
      input: { ...EMPTY_INPUT, coverEars: true },
    })
    expect(result.commandFeedback?.player?.reason).toBe('phase')
    expect(result.player).toBe(state.player)
  })
  it.each([false, true])('reports the same refusal inside and outside the lab (%s)', (training) => {
    const state = fight('franklin', training)
    state.player.aura = 0
    const result = performTrainingAction({ state, ...special })
    expect(result.commandFeedback?.player).toMatchObject({ outcome: 'refused', reason: 'aura' })
    expect(result.player.aura).toBe(0)
    if (training) expect(result.training?.history.at(-1)?.outcome).toBe('refused')
  })
  it('explains voluntary Nen blocked by Zetsu without inventing an equipment requirement', () => {
    const state = fight('franklin')
    state.player.nen.mode = 'zetsu'
    const result = performTrainingAction({ state, ...special })
    expect(result.commandFeedback?.player?.reason).toBe('nen')
    expect(result.player).toBe(state.player)
  })
  it.each(['coveringEars', 'pluggingWounds'] as const)('explains occupied hands from %s', (key) => {
    const state = fight()
    state.player[key] = true
    const result = performTrainingAction({ state, side: 'player', action: 'light' })
    expect(result.commandFeedback?.player).toMatchObject({ outcome: 'refused', reason: 'hands' })
    expect(result.player.attack).toBeNull()
  })
  it.each(['coverEars', 'plugWounds'] as const)(
    'applies held %s before a simultaneous queued attack',
    (key) => {
      const state = fight()
      state.player.openWounds = 2
      const result = performTrainingAction({
        state,
        side: 'player',
        action: 'light',
        input: { ...EMPTY_INPUT, [key]: true },
      })
      expect(result.commandFeedback?.player).toMatchObject({ outcome: 'refused', reason: 'hands' })
      expect(result.player.attack).toBeNull()
      expect(result.player.aura).toBe(state.player.aura)
    },
  )
  it('does not occupy hands for nonexistent wounds and accepts releasing the ears before a command', () => {
    const state = fight()
    expect(
      performTrainingAction({
        state,
        side: 'player',
        action: 'light',
        input: { ...EMPTY_INPUT, plugWounds: true },
      }).commandFeedback?.player?.outcome,
    ).toBe('started')
    state.player.coveringEars = true
    const result = performTrainingAction({
      state,
      side: 'player',
      action: 'light',
      input: { ...EMPTY_INPUT, coverEars: false },
    })
    expect(result.commandFeedback?.player?.outcome).toBe('started')
    expect(result.player.coveringEars).toBe(false)
  })
  it('keeps a normal long-range whiff an executed command, not a fictional range refusal', () => {
    const state = fight()
    state.player.x = 10
    state.opponent.x = 90
    const result = performTrainingAction({ state, side: 'player', action: 'light' })
    expect(result.commandFeedback?.player?.outcome).toBe('started')
    expect(result.player.attack).not.toBeNull()
    expect(result.opponent.health).toBe(state.opponent.health)
  })
  it('distinguishes a buffered input from an immediate execution or refusal', () => {
    const state = fight('hisoka', true)
    state.player.hitStun = 4
    const result = performTrainingAction({ state, side: 'player', action: 'heavy' })
    expect(result.commandFeedback?.player?.outcome).toBe('buffered')
    expect(result.training?.history.at(-1)?.outcome).toBe('buffered')
    expect(result.player.attack).toBeNull()
  })
  it('reports recovery and long stun rather than promising an illegal cancel', () => {
    let state = fight()
    state = performMove({ state, side: 'player', action: 'heavy' })
    expect(
      performTrainingAction({ state, side: 'player', action: 'light' }).commandFeedback?.player
        ?.reason,
    ).toBe('recovery')
    state = fight()
    state.player.hitStun = 30
    expect(
      performTrainingAction({ state, side: 'player', action: 'light' }).commandFeedback?.player
        ?.reason,
    ).toBe('stun')
  })
  it('reports own preparation and own sleeping-body range without inspecting the opponent', () => {
    const state = fight('halkenburg')
    expect(performTrainingAction({ state, ...special }).commandFeedback?.player?.reason).toBe(
      'preparation',
    )
    const hanzo = fight('hanzo')
    hanzo.player = { ...projectHanzo(hanzo.player), x: 80 }
    hanzo.player.hanzoProjection!.startupFrames = 0
    expect(
      performTrainingAction({ state: hanzo, ...special }).commandFeedback?.player?.reason,
    ).toBe('range')
  })
  it('does not turn a passive post-mortem technique into a manually executed attack', () => {
    const state = fight('camilla')
    const result = performTrainingAction({ state, ...special })
    expect(result.commandFeedback?.player?.outcome).toBe('refused')
    expect(result.player).toBe(state.player)
    expect(result.catsName).toBeUndefined()
  })
  it('records a panel attempt only for its issuing side and preserves the other feedback', () => {
    const state = performTrainingAction({ state: fight(), side: 'player', action: 'light' })
    const result = observeFightCommand(
      state,
      { side: 'opponent', action: 'utility' },
      (current) => current,
    )
    expect(result.commandFeedback?.player).toBe(state.commandFeedback?.player)
    expect(result.commandFeedback?.opponent?.outcome).toBe('refused')
  })
  it('does not add feedback to private forecast simulations or mutate the input snapshot', () => {
    const state = { ...fight(), forecastSimulation: true }
    const before = JSON.stringify(state)
    const result = performTrainingAction({ state, side: 'player', action: 'light' })
    expect(result.commandFeedback).toBeUndefined()
    expect(JSON.stringify(state)).toBe(before)
  })
  it('expires feedback by simulated frames and clears it with a new fight', () => {
    const state = performTrainingAction({ state: fight(), side: 'player', action: 'light' })
    expect(visibleCommandFeedback({ ...state, frame: 149 }, 'player')).not.toBeNull()
    expect(visibleCommandFeedback({ ...state, frame: 150 }, 'player')).toBeNull()
    expect(visibleCommandFeedback(fight(), 'player')).toBeNull()
  })
})

describe('private feedback and perceptible commitments', () => {
  it('shows a visible sleeping body without exposing its private hearing state through a disabled button', () => {
    const state = fight()
    state.opponent = { ...projectHanzo(state.opponent), x: 80 }
    state.opponent.hanzoProjection!.bodyX = state.player.x + 5
    const props = { state, language: 'en' as const, onCall: () => {} }
    const visible = render(HanzoCall, { props }).body
    expect(visible).toContain('Call out')
    expect(visible).not.toContain('disabled')
    state.opponent.hatsuEffects.senseSeals = 2
    expect(render(HanzoCall, { props }).body).toBe(visible)
    state.player.hatsuEffects.senseSeals = 1
    expect(render(HanzoCall, { props }).body).not.toContain('Call out')
  })
  it('shows only the selected player’s own data, never the CPU’s private feedback or charge', () => {
    const state = fight()
    state.mode = 'versus-ai'
    state.opponent.hatsuChargeFrames = 9876
    state.commandFeedback = {
      opponent: { frame: 0, sequence: 1, outcome: 'refused', reason: 'equipment' },
    }
    const body = render(Readout, { props: { state, language: 'fr' } }).body
    expect(body).not.toContain('9876')
    expect(body).not.toContain('Équipement requis absent')
    expect(body).not.toContain('<option')
  })
  it('never reveals an In-concealed tether through the comfort readout', () => {
    const state = fight('kurapika')
    state.bungeeGum = { owner: 'opponent', target: 'player', hidden: true, retracting: false }
    expect(
      fightCommitments(state, 'player').some((row) => row.label[1] === 'Perceived tether'),
    ).toBe(false)
    state.player.nen.gyo = true
    expect(
      fightCommitments(state, 'player').some((row) => row.label[1] === 'Perceived tether'),
    ).toBe(true)
  })
  it('measures the real remaining action frames, including the active portion', () => {
    let state = performTrainingAction({ state: fight(), side: 'player', action: 'heavy' })
    const total = attackTotal(attackData('heavy', state.player))
    expect(
      fightCommitments(state, 'player').find((row) => row.label[1] === 'Action ends')?.frames,
    ).toBe(total)
    state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT, ai: false })
    expect(
      fightCommitments(state, 'player').find((row) => row.label[1] === 'Action ends')?.frames,
    ).toBe(total - 1)
  })
  it('keeps stored rotations distinct from time to complete the current turn', () => {
    const state = fight('phinks')
    state.player.cyclotronWindup = { frame: 12 }
    state.player.hatsuEffects.cyclotronTurns = 3
    expect(fightCommitments(state, 'player')).toContainEqual({
      label: ['Prochain tour', 'Next rotation'],
      frames: 24,
    })
    expect(fightCommitments(state, 'player')).toContainEqual({
      label: ['Tours conservés', 'Stored rotations'],
      count: 3,
    })
  })
  it.each(['fr', 'en'] as const)('renders useful localized refusal feedback in %s', (language) => {
    const state = fight('melody')
    state.player.equipment = []
    const result = performTrainingAction({ state, ...special })
    const body = render(Readout, { props: { state: result, language } }).body
    expect(body).toContain(
      language === 'fr' ? 'Équipement requis absent' : 'Required equipment missing',
    )
    expect(body).toContain('role="status"')
    expect(commandFeedbackText({ frame: 0, sequence: 1, outcome: 'buffered' }, language)).toContain(
      language === 'fr' ? 'revérifiés' : 'checked again',
    )
  })
  it('uses a generic action condition when no own prerequisite explains the refusal', () => {
    expect(commandFailure(fight(), { side: 'player', action: 'utility' })).toBe('condition')
  })
})
