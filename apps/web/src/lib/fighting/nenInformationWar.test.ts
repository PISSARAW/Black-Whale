import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove } from './engine'
import { auraInformationKnown, CONCEALED_AURA } from './nenInformationWar'
import { privatePvpState } from './pvp/view'

function concealed() {
  let state = beginFight(
    createFight('franklin', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  state = performMove({ state, side: 'player', action: 'special' })
  state.player = {
    ...state.player,
    aura: 37,
    hatsuChargeFrames: 48,
    nen: {
      ...state.player.nen,
      in: true,
      ryu: { head: 0.08, torso: 0.08, hands: 0.76, feet: 0.08 },
    },
    hatsuEffects: {
      ...state.player.hatsuEffects,
      cyclotronTurns: 4,
      arrowNocked: 120,
    },
    attack: state.player.attack ? { ...state.player.attack, concealed: true } : null,
  }
  return state
}

describe('In/Gyo information war', () => {
  it('conceals aura expenditure, Ryu and prepared conditions from an uncommitted observer', () => {
    const state = concealed()
    const view = privatePvpState(state, 'opponent')
    expect(view.opponent.aura).toBe(CONCEALED_AURA)
    expect(view.opponent.nen.ryu).toEqual({})
    expect(view.opponent.hatsuChargeFrames).toBe(0)
    expect(view.opponent.hatsuEffects).toMatchObject({ cyclotronTurns: 0, arrowNocked: 0 })
    expect(view.opponent.attack).toBeNull()
    expect(auraInformationKnown(view, 'player', 'opponent')).toBe(false)
    expect(state.player).toMatchObject({ aura: 37, hatsuChargeFrames: 48 })
  })

  it('reveals the exact same information while the observer commits full Gyo', () => {
    const state = concealed()
    state.opponent.nen = { ...state.opponent.nen, gyo: true, mode: 'ren' }
    const view = privatePvpState(state, 'opponent')
    expect(view.opponent.aura).toBe(37)
    expect(view.opponent.nen.ryu.hands).toBe(0.76)
    expect(view.opponent.hatsuChargeFrames).toBe(48)
    expect(view.opponent.hatsuEffects.cyclotronTurns).toBe(4)
    expect(view.opponent.attack).not.toBeNull()
    expect(auraInformationKnown(view, 'player', 'opponent')).toBe(true)
  })

  it('does not let low-output Gyo or the mere absence of evidence reveal In', () => {
    const state = concealed()
    state.opponent.nen = { ...state.opponent.nen, gyo: true, mode: 'ten' }
    state.opponent.gyoLow = true
    expect(privatePvpState(state, 'opponent').opponent.aura).toBe(CONCEALED_AURA)

    state.player.nen = { ...state.player.nen, in: false }
    expect(privatePvpState(state, 'opponent').opponent.aura).toBe(37)
  })
})
