import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, nextRound } from './engine'
import { needleCommand, needleFrames } from './illumiNeedleFaceTestSetup'
import { bodyLegFactor, bodyPartFunctional } from './bodyDamage'
import { buildFightFigure } from './fighterFigure'
import { applyAuraContext } from './nen'
import { privatePvpState } from './pvp/view'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import { selectInjury } from './injurySelection'
import { validInjuryPreparation, type InjuryPreset } from './injuryPreparation'
import { advanceGumProstheses } from './gumProstheses'

function setup(side: FightSide = 'player', preset: InjuryPreset = 'face-and-neck'): FightState {
  const state = beginFight(
    createFight(side === 'player' ? 'hisoka' : 'theta', side === 'opponent' ? 'hisoka' : 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: {
          mode: 'scenario',
          resources: [],
          cohorts: [],
          injuries: { [side]: preset },
        },
      },
    }),
  )
  return { ...state, [side]: { ...state[side], aura: 100, health: 37 } }
}
function skin(state: FightState, side: FightSide): FightState {
  state = needleFrames(state, 30)
  state = needleCommand(state, { action: 'texture-target', target: 'gum-prostheses' }, side)
  return needleFrames(needleCommand(state, { action: 'texture-apply' }, side))
}
const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
const figure = (fighter: FightState['player']) => buildFightFigure({ THREE, glow, fighter })

describe('Hisoka’s face and neck surfaces require real injuries and real Nen support', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'rebuilds only the damaged surfaces and skins the same support for %s',
    (side) => {
      const base = setup(side)
      expect(base[side].bodyDamage?.parts).toEqual(['facial-surface', 'neck-surface'])
      expect(bodyLegFactor(base[side])).toBe(1)
      expect(bodyPartFunctional(base[side], 'left-hand')).toBe(true)
      let state = needleCommand(base, { action: 'gum-prosthesis' }, side)
      expect(state[side].aura).toBe(84)
      expect(state[side].gumProstheses?.parts).toEqual(base[side].bodyDamage!.parts)
      state = skin(state, side)
      expect(state[side].textureSurprise?.supportId).toBe(state[side].gumProstheses?.id)
      expect(state[side].bodyDamage).toEqual(base[side].bodyDamage)
      expect(state[side].health).toBe(37)
      const next = nextRound({ ...state, phase: 'finished', winner: side })
      expect(next[side].bodyDamage).toEqual(state[side].bodyDamage)
      expect(next[side].gumProstheses?.id).toBe(state[side].gumProstheses?.id)
    },
  )
  it('keeps the existing limb premise unchanged and makes the combined premise explicit', () => {
    expect(setup('player', 'hand-and-lower-leg').player.bodyDamage?.parts).toEqual([
      'left-hand',
      'right-lower-leg',
    ])
    expect(setup('player', 'post-explosion').player.bodyDamage?.parts).toEqual([
      'left-hand',
      'right-lower-leg',
      'facial-surface',
      'neck-surface',
    ])
    let injuries = selectInjury({ injuries: {}, side: 'player', group: 'surfaces', checked: true })
    expect(injuries).toEqual({ player: 'face-and-neck' })
    injuries = selectInjury({ injuries, side: 'player', group: 'limbs', checked: true })
    expect(injuries).toEqual({ player: 'post-explosion' })
    expect(validInjuryPreparation(injuries, 'scenario')).toBe(true)
    expect(validInjuryPreparation(injuries, 'duel')).toBe(false)
    expect(validInjuryPreparation({ player: 'brain-regeneration' }, 'scenario')).toBe(false)
  })
  it('shows damaged tissue, Nen rubber and skin appearance on the original rig without changing eyes or joints', () => {
    const base = setup()
    const damaged = figure(base.player)
    const formed = needleCommand(base, { action: 'gum-prosthesis' })
    const rubber = figure(formed.player)
    const masked = skin(formed, 'player')
    const skinned = figure(masked.player)
    expect(damaged.root.getObjectByName('face-relief')!.visible).toBe(false)
    expect(rubber.root.getObjectByName('face-relief')!.visible).toBe(true)
    expect(rubber.root.getObjectByName('face-relief')!.userData.physicalMatter).toBe('nen-rubber')
    expect(
      (
        rubber.root.getObjectByName('face-relief') as THREE.Mesh<
          THREE.BufferGeometry,
          THREE.MeshBasicMaterial
        >
      ).material.color.getHex(),
    ).toBe(0xf09ec7)
    expect(skinned.root.getObjectByName('gum-surface:facial-surface')!.visible).toBe(false)
    for (const name of ['face-eye-left', 'face-eye-right', 'hand-left', 'knee-right'])
      expect(skinned.root.getObjectByName(name)!.position).toEqual(
        damaged.root.getObjectByName(name)!.position,
      )
    const hidden = privatePvpState(masked, 'opponent').opponent
    expect(hidden.bodyDamage).toBeUndefined()
    expect(hidden.gumProstheses).toBeUndefined()
    expect(hidden.textureSurprise).toBeUndefined()
  })
  it('keeps On, does not heal on support loss, and cannot make Texture Surprise create missing support', () => {
    const base = setup()
    expect(needleCommand(base, { action: 'texture-target', target: 'gum-prostheses' })).toBe(base)
    const formed = needleCommand(base, { action: 'gum-prosthesis' })
    const on = {
      ...formed,
      player: applyAuraContext(
        { ...formed.player, on: { grudge: 100, sealFrames: 0 } },
        { ...EMPTY_INPUT, aura: true, hatsu: true },
      ),
    }
    const cut = advanceGumProstheses(on)
    expect(cut.player.nen.on).toBe(true)
    expect(cut.player.gumProstheses).toBeUndefined()
    expect(cut.player.bodyDamage).toEqual(base.player.bodyDamage)
    expect(cut.player.health).toBe(37)
  })
})
