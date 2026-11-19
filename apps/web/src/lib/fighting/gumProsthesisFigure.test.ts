import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { buildFightFigure, fightFigureKey } from './fighterFigure'
import { privatePvpState } from './pvp/view'
import { EMPTY_INPUT, type ArcadeFighter, type FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
function figure(fighter: ArcadeFighter, observer?: ArcadeFighter) {
  return buildFightFigure({ THREE, glow, fighter, observer })
}
function ready() {
  return beginFight(
    createFight('hisoka', 'theta', {
      mode: 'versus-local',
      environment: {
        preparation: {
          mode: 'scenario',
          resources: [],
          cohorts: [],
          injuries: { player: 'hand-and-lower-leg' },
        },
      },
    }),
  )
}
function command(state: FightState, command: ArsenalCommand) {
  return performArsenalAction({ state, side: 'player', command }, performAuraAttack)
}
function frames(state: FightState, count: number) {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function hand(model: ReturnType<typeof figure>) {
  return model.root.getObjectByName('hand-left') as THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshBasicMaterial
  >
}

describe('rubber replacements and their real surface disguise on the articulated model', () => {
  it('shows the actual damaged parts without erasing the rest of the rig', () => {
    const actor = ready().player
    const model = figure(actor)
    expect(hand(model).visible).toBe(false)
    expect(model.root.getObjectByName('knee-right')!.visible).toBe(false)
    expect(model.root.getObjectByName('hand-right')!.visible).toBe(true)
    expect(model.root.getObjectByName('knee-left')!.visible).toBe(true)
    expect(fightFigureKey(actor)).not.toBe(fightFigureKey(createFight('hisoka', 'theta').player))
  })
  it('uses Nen material on the same articulated shape without recoloring a healthy figure', () => {
    const healthy = figure(createFight('hisoka', 'theta').player)
    const color = hand(healthy).material.color.getHex()
    const state = command(ready(), { action: 'gum-prosthesis' })
    const rubber = figure(state.player)
    expect(hand(rubber).visible).toBe(true)
    expect(hand(rubber).userData.physicalMatter).toBe('nen-rubber')
    expect(hand(rubber).geometry).toBe(hand(healthy).geometry)
    expect(hand(rubber).material.color.getHex()).toBe(0xf09ec7)
    expect(hand(healthy).material.color.getHex()).toBe(color)
    expect(hand(rubber).parent?.name).toBe(hand(healthy).parent?.name)
    expect(rubber.root.getObjectByName('knee-right')!.visible).toBe(true)
  })
  it('changes appearance on the actual rubber while preserving its Nen matter and physical injury', () => {
    const initial = ready()
    let state = frames(command(initial, { action: 'gum-prosthesis' }), 30)
    const bareKey = fightFigureKey(state.player)
    state = command(state, { action: 'texture-target', target: 'gum-prostheses' })
    state = frames(command(state, { action: 'texture-apply' }), 45)
    expect(state.player.textureSurprise?.surface).toBe('gum-prostheses')
    const skinned = figure(state.player)
    const healthy = figure(createFight('hisoka', 'theta').player)
    expect(hand(skinned).material.color.getHex()).toBe(hand(healthy).material.color.getHex())
    expect(hand(skinned).userData.physicalMatter).toBe('nen-rubber')
    expect(state.player.bodyDamage).toEqual(initial.player.bodyDamage)
    expect(state.player.health).toBe(initial.player.health)
    expect(fightFigureKey(state.player)).not.toBe(bareKey)
    const concealed = privatePvpState(state, 'opponent').opponent
    expect(concealed.gumProstheses).toBeUndefined()
    expect(concealed.bodyDamage).toBeUndefined()
    expect(concealed.textureSurprise).toBeUndefined()
    expect(concealed.textureTarget).toBeUndefined()
    expect(hand(figure(concealed)).visible).toBe(true)
    expect(privatePvpState(state, 'player').player.bodyDamage?.parts).toHaveLength(2)
  })
  it('lets the owner and Gyo see rubber hidden with In without exposing it to ordinary sight', () => {
    const state = ready()
    const hidden = command(
      { ...state, player: { ...state.player, nen: { ...state.player.nen, in: true } } },
      { action: 'gum-prosthesis' },
    )
    expect(hidden.player.gumProstheses?.hidden).toBe(true)
    expect(hand(figure(hidden.player)).visible).toBe(true)
    expect(hand(figure(hidden.player, hidden.opponent)).visible).toBe(false)
    expect(privatePvpState(hidden, 'opponent').opponent.gumProstheses).toBeUndefined()
    const gyo = { ...hidden.opponent, nen: { ...hidden.opponent.nen, gyo: true } }
    expect(hand(figure(hidden.player, gyo)).visible).toBe(true)
    const revealed = privatePvpState({ ...hidden, opponent: gyo }, 'opponent').opponent
    expect(revealed.gumProstheses?.id).toBe(hidden.player.gumProstheses?.id)
    expect(revealed.gumProstheses?.theftId).toBeUndefined()
  })
})
