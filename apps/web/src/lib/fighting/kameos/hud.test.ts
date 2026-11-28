import { get } from 'svelte/store'
import { afterEach, describe, expect, it } from 'vitest'
import { beginFight, createFight } from '../engine'
import { defaultBindings, bindingError } from '../fightInputBindings'
import { sampleGamepad, type FightPad } from '../fightGamepad'
import { fighterDefinition } from '../roster'
import type { FightState } from '../types'
import { kameoAppearance } from './catalogue'
import { kameoBadge } from './hud'
import { kameoFigure, kameoPresence } from './scene'
import { chosenKameos, kameoPick, withChosenKameos } from './selection'
import { withKameos } from './state'
import type { KameoSlot } from './types'

const base = () => beginFight(withKameos(createFight('kurapika', 'hisoka'), { player: 'tubeppa' }))
const slotOf = (state: FightState) => state.kameos?.player as KameoSlot
const withSlot = (state: FightState, slot: Partial<KameoSlot>): FightState => ({
  ...state,
  kameos: { player: { ...slotOf(state), ...slot } },
})

describe('kameo presentation (lot 6)', () => {
  afterEach(() => chosenKameos.set({}))

  it('shows each kameo state in the HUD, in both languages', () => {
    const state = base()
    expect(kameoBadge(state, 'opponent', 'fr')).toBeNull()
    expect(kameoBadge(state, 'player', 'fr')).toMatchObject({
      name: 'Tubeppa',
      role: 'Soin',
      status: 'Prêt',
      ready: true,
    })
    expect(kameoBadge(withSlot(state, { cooldownFrames: 300 }), 'player', 'en')).toMatchObject({
      status: 'Cooldown 5s',
      ready: false,
      cooldown: 0.5,
    })
    expect(kameoBadge(withSlot(state, { phase: 'acting' }), 'player', 'fr')?.status).toBe(
      'En scène',
    )
    expect(kameoBadge(withSlot(state, { phase: 'eliminated' }), 'player', 'fr')?.status).toBe(
      'Mort',
    )
    const tired = withSlot(state, { fighter: { ...slotOf(state).fighter, aura: 5 } })
    expect(kameoBadge(tired, 'player', 'en')).toMatchObject({ status: 'Out of aura', ready: false })
  })

  it('draws the kameo only on stage, growing in and fading out', () => {
    const state = base()
    expect(kameoFigure(state, slotOf(state))).toBeNull()
    expect(kameoPresence({ ...slotOf(state), phase: 'entering', phaseFrames: 0 })).toBeCloseTo(0.4)
    expect(kameoPresence({ ...slotOf(state), phase: 'entering', phaseFrames: 18 })).toBe(1)
    expect(kameoPresence({ ...slotOf(state), phase: 'leaving', phaseFrames: 9 })).toBeCloseTo(0.5)
    const acting = withSlot(state, { phase: 'acting' })
    expect(kameoFigure(acting, slotOf(acting))).toEqual({ scale: 1, pose: 'special' })
  })

  it('leaves a dead kameo on the floor only during the round it died', () => {
    const state = base()
    const dead = withSlot(state, { phase: 'eliminated', eliminatedRound: state.roundNumber })
    expect(kameoFigure(dead, slotOf(dead))).toEqual({ scale: 1, pose: 'fallen' })
    const later = { ...dead, roundNumber: dead.roundNumber + 1 }
    expect(kameoFigure(later, slotOf(later))).toBeNull()
  })

  it('wears its visit likeness, not a roster fighter', () => {
    expect(kameoAppearance('tubeppa')).toEqual({ modelId: 'prince-tubeppa', modelRole: 'fighter' })
    expect(kameoAppearance('morena')).toEqual({ modelId: 'morena-prudo', modelRole: 'morena' })
    expect(kameoAppearance('kurapika')).toBeUndefined()
    expect(fighterDefinition('kurapika').modelId).toBe('kurapika')
  })

  it('attaches the kameos chosen on the setup screen to a new match', () => {
    expect(kameoPick('luzurus')).toBe('luzurus')
    expect(kameoPick('')).toBeUndefined()
    expect(kameoPick('illumi')).toBeUndefined()
    chosenKameos.set({ opponent: 'marayam' })
    const state = withChosenKameos(createFight('kurapika', 'hisoka'))
    expect(state.kameos?.opponent?.fighter.id).toBe('marayam')
    expect(state.kameos?.player).toBeUndefined()
    chosenKameos.set({})
    expect(withChosenKameos(createFight('kurapika', 'hisoka'))).not.toHaveProperty('kameos')
    expect(get(chosenKameos)).toEqual({})
  })

  it('binds the call on the keyboard without clashing, and on the gamepad Y button', () => {
    const bindings = defaultBindings()
    expect(bindings.playerKameo).toBe('u')
    expect(bindings.opponentKameo).toBe('e')
    expect(bindingError(bindings)).toBeNull()
    const buttons = Array.from({ length: 17 }, (_, index) => ({ pressed: index === 3, value: 0 }))
    const pad: FightPad = {
      index: 0,
      id: 'pad',
      connected: true,
      mapping: 'standard',
      axes: [0, 0],
      buttons,
    }
    expect(sampleGamepad(pad, null).input.kameo).toBe(true)
  })
})
