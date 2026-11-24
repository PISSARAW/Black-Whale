import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, nextRound, performMove, tickFight } from './engine'
import { buildFightFigure, fightFigureKey } from './fighterFigure'
import { activeHitbox, attackData, FIXED_STEP, hurtboxes } from './frameData'
import { hatsuDamageFactor, hatsuDefenceFactor } from './hatsu'
import { bungeeVisible } from './hisokaTechnique'
import { keyPoseTimeline } from './keyPoseMoves'
import { TEXTURE_SURPRISE_COST } from './textureSurpriseMask'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

const ready = () => {
  const state = beginFight(
    createFight('hisoka', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 54, aura: 100 },
  }
}

function frames(state: FightState, count: number, guard = false): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, {
      dt: FIXED_STEP,
      opponentInput: { ...EMPTY_INPUT, guard },
    })
  return state
}

const disguise = (state: FightState, side: FightSide = 'player') =>
  performMove({ state, side, action: 'special', input: { ...EMPTY_INPUT, down: true } })

describe('Texture Surprise and Hisoka presentation', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'disguises existing cloth after startup without attaching, striking or protecting (%s)',
    (side) => {
      const state = ready()
      const armed = disguise(state, side)
      const startup = attackData('special', armed[side]).startup
      expect(armed[side].x).toBe(state[side].x)
      expect(armed[side].textureSurprise).toBeUndefined()
      expect(frames(armed, startup - 1)[side].textureSurprise).toBeUndefined()
      const masked = frames(armed, startup)
      expect(masked[side].textureSurprise).toMatchObject({
        surface: 'cloth',
        source: 'personal',
      })
      expect(masked.bungeeGum).toBeNull()
      expect(masked.impact).toBeNull()
      expect(masked.score).toEqual(state.score)
      expect(masked[side].health).toBe(state[side].health)
      expect(activeHitbox(masked[side])).toBeNull()
      expect(hurtboxes(masked[side])).toEqual(hurtboxes(state[side]))
      expect(hatsuDamageFactor(masked[side])).toBe(hatsuDamageFactor(state[side]))
      expect(hatsuDefenceFactor(masked[side])).toBe(hatsuDefenceFactor(state[side]))
      expect(frames(masked, 300)[side].textureSurprise).toMatchObject({
        surface: 'cloth',
        source: 'personal',
      })
    },
  )

  it('requires grounded preparation, usable Nen, aura and an unmasked surface', () => {
    const state = ready()
    for (const fighter of [
      { ...state.player, y: 3 },
      { ...state.player, aura: TEXTURE_SURPRISE_COST - 1 },
      { ...state.player, nen: { ...state.player.nen, mode: 'zetsu' as const } },
      { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 } },
      { ...state.player, on: { grudge: 0, sealFrames: 60 } },
      { ...state.player, textureSurprise: { surface: 'cloth' as const } },
    ]) {
      const invalid = { ...state, player: fighter }
      expect(disguise(invalid)).toBe(invalid)
    }
  })

  it('cannot be completed after its preparation is interrupted', () => {
    const state = disguise(ready())
    const hit = { ...state, player: { ...state.player, attack: null, hitStun: 15 } }
    expect(frames(hit, 30).player.textureSurprise).toBeUndefined()
  })

  it('leaves an existing gum link intact instead of recalling or replacing it', () => {
    const state = ready()
    state.bungeeGum = { owner: 'player', target: 'opponent', hidden: true, retracting: false }
    const masked = frames(disguise(state), 30)
    expect(masked.bungeeGum).toEqual(state.bungeeGum)
    expect(masked.opponent.x).toBe(state.opponent.x)
  })

  it('contact exposes the mask and deals exactly the normal damage', () => {
    const state = ready()
    const covered = {
      ...state,
      opponent: { ...state.opponent, textureSurprise: { surface: 'cloth' as const } },
    }
    const attack = (fight: FightState) =>
      frames(performMove({ state: fight, side: 'player', action: 'heavy' }), 30)
    const plain = attack(state)
    const hit = attack(covered)
    expect(hit.impact?.damage).toBeGreaterThan(0)
    expect(hit.impact?.damage).toBe(plain.impact?.damage)
    expect(hit.opponent.textureSurprise).toBeUndefined()
    expect(hit.opponent.health).toBe(plain.opponent.health)
  })

  it('does not attach on a guarded strike or a miss and does not consume a blocked finisher link', () => {
    const state = ready()
    const attach = (fight: FightState) =>
      performMove({ state: fight, side: 'player', action: 'special' })
    expect(frames(attach(state), 35, true).bungeeGum).toBeNull()
    const far = { ...state, opponent: { ...state.opponent, x: 90 } }
    expect(frames(attach(far), 35).bungeeGum).toBeNull()
    state.bungeeGum = { owner: 'player', target: 'opponent', hidden: false, retracting: false }
    const blocked = frames(performMove({ state, side: 'player', action: 'finisher' }), 45, true)
    expect(blocked.impact?.blocked).toBe(true)
    expect(blocked.bungeeGum?.owner).toBe('player')
  })

  it('resets the disguise and attachment at the next round', () => {
    const state = frames(disguise(ready()), 30)
    const reset = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(reset.player.textureSurprise).toBeUndefined()
    expect(reset.bungeeGum).toBeNull()
  })

  it('conceals enemy In from the observer until Gyo, while the owner sees their own link', () => {
    const state = ready()
    state.bungeeGum = { owner: 'opponent', target: 'player', hidden: true, retracting: false }
    expect(bungeeVisible(state)).toBe(false)
    expect(bungeeVisible(state, 'opponent')).toBe(true)
    expect(
      bungeeVisible({
        ...state,
        player: { ...state.player, nen: { ...state.player.nen, gyo: true } },
      }),
    ).toBe(true)
  })

  it('changes the cloth material without changing the body geometry, and authors four different gestures', () => {
    const fighter = ready().player
    const covered = { ...fighter, textureSurprise: { surface: 'cloth' as const } }
    const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
    const plain = buildFightFigure({ THREE, glow, fighter })
    const mask = buildFightFigure({ THREE, glow, fighter: covered })
    const materials = (root: THREE.Object3D) => {
      const colours: number[] = []
      root.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshBasicMaterial)
          colours.push(object.material.color.getHex())
      })
      return colours
    }
    expect(fightFigureKey(covered)).not.toBe(fightFigureKey(fighter))
    expect(new THREE.Box3().setFromObject(mask.root)).toEqual(
      new THREE.Box3().setFromObject(plain.root),
    )
    expect(materials(mask.root)).not.toEqual(materials(plain.root))
    const poses = ['neutralSpecial', 'forwardSpecial', 'backSpecial', 'downSpecial'] as const
    expect(new Set(poses.map((slot) => JSON.stringify(keyPoseTimeline('hisoka', slot)))).size).toBe(
      4,
    )
  })
})
