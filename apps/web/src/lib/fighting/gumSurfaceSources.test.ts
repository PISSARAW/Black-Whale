import { describe, expect, it } from 'vitest'
import { TEXTURE_SURPRISE_COST } from './textureSurpriseMask'
import { prosthesisScenario } from '../../../ui-tests/fighting-preparation/prostheses'
import { needleCommand, needleFrames } from './illumiNeedleFaceTestSetup'
import { createKurapika } from './kurapika'
import { captureDolphinAura } from './dolphinAura'
import { createFight } from './engine'
import { equippedDolphin } from './dolphinBorrowing'
import { advanceGumArsenal } from './hisokaArsenal'
import { maintainTextureSurprise } from './hisokaTextureOrigin'
import type { FightSide, FightState } from './types'

function setup(side: FightSide): FightState {
  const base = prosthesisScenario(side, 'face-and-neck')
  const other = side === 'player' ? 'opponent' : 'player'
  return {
    ...base,
    [side]: {
      ...base[side],
      id: 'chrollo',
      chrolloBook: { pages: ['hisoka:neutralSpecial'], page: 0, open: true, bookmark: null },
      dolphinLoan: {
        lender: { owner: other, member: 0 },
        held: {
          source: 'hisoka',
          moveId: 'hisoka:downSpecial',
          victim: other,
          theftId: 'facial-texture-loan',
          loaded: true,
          used: false,
          sustainedKeys: [],
          auraSupply: { ...captureDolphinAura(createFight('hisoka', 'theta').player), amount: 40 },
        },
      },
    },
    [other]: {
      ...base[other],
      id: 'kurapika',
      kurapika: {
        ...createKurapika(),
        emperorTime: true,
        dolphinLoans: [{ owner: side, member: 0 }],
      },
    },
  }
}
describe('facial reconstruction keeps the gum and its surface’s independent sources', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'skins real book gum using the finite Texture loan for %s',
    (side) => {
      let state = needleFrames(needleCommand(setup(side), { action: 'gum-prosthesis' }, side), 30)
      const gum = state[side].gumProstheses!
      expect(gum.source).toBe('book')
      state = needleCommand(
        state,
        { action: 'texture-target', target: 'gum-prostheses', loan: true },
        side,
      )
      state = needleCommand(state, { action: 'dolphin-move', target: 'hisoka:downSpecial' }, side)
      expect(equippedDolphin(state[side])?.auraSupply?.amount).toBe(40 - TEXTURE_SURPRISE_COST)
      state = needleFrames(state)
      expect(state[side].textureSurprise).toMatchObject({
        supportId: gum.id,
        source: 'dolphin',
        theftId: 'facial-texture-loan',
      })
      expect(state[side].health).toBe(37)
      expect(state[side].id).toBe('chrollo')
      const dismissed = needleCommand(state, { action: 'dolphin-use' }, side)
      expect(dismissed[side].textureSurprise).toBeUndefined()
      expect(dismissed[side].gumProstheses?.id).toBe(gum.id)
      const closed = {
        ...state,
        [side]: { ...state[side], chrolloBook: { ...state[side].chrolloBook!, open: false } },
      }
      const lost = maintainTextureSurprise(advanceGumArsenal(closed), side)
      expect(lost[side].gumProstheses).toBeUndefined()
      expect(lost[side].textureSurprise).toBeUndefined()
      expect(lost[side].bodyDamage?.parts).toEqual(['facial-surface', 'neck-surface'])
    },
  )
})
