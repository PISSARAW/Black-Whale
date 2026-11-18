import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createFightState } from './fightState'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { createFightBodySeparation, coreBoxes, projectionBody } from './fightBodySeparation'
import { FIGHTING_ROSTER } from './roster'
import { fightReplayHash } from './fightReplayHash'
import type { FighterId } from './types'

const glow = (color: number) => new THREE.MeshBasicMaterial({ color })
function setup(id: FighterId) {
  const state = { ...createFightState(id, 'chrollo'), phase: 'fighting' as const }
  const models = {
    player: buildFightFigure({ THREE, glow, fighter: state.player }),
    opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
  }
  const scene = new THREE.Scene()
  for (const side of ['player', 'opponent'] as const) {
    scene.add(models[side].root)
    models[side].root.rotation.y = state[side].facing * 1.25
    models[side].animate(0, 'idle', {
      transitionSeconds: 0,
      motion: fightBodyMotion({ fighter: state[side], seconds: 0, progress: 0 }),
    })
  }
  return { state, models, separate: createFightBodySeparation((side) => models[side].turns) }
}
function assertClear(models: ReturnType<typeof setup>['models']) {
  const left = coreBoxes(models.player.turns),
    right = coreBoxes(models.opponent.turns)
  for (const a of left)
    for (const b of right) {
      if (Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y) > 0.01)
        expect(a.max.x + 0.024).toBeLessThanOrEqual(b.min.x)
    }
}

describe('material bodies cannot occupy the same space', () => {
  it.each(FIGHTING_ROSTER.map((f) => f.id))(
    '%s: separates head, torso and pelvis without changing the fight',
    (id) => {
      const { state, models, separate } = setup(id)
      const hash = fightReplayHash(state)
      separate(state)
      assertClear(models)
      expect(fightReplayHash(state)).toBe(hash)
    },
  )
  it('moves the available body at the arena wall and preserves the anchored one', () => {
    const { state, models, separate } = setup('franklin')
    state.player = { ...state.player, x: 7 }
    const x = models.player.root.position.x
    separate(state)
    assertClear(models)
    expect(models.player.root.position.x).toBe(x)
  })
  it('permits a real projected vessel, but no ghost body from In, Ken or ordinary invulnerability', () => {
    const { state, models, separate } = setup('hanzo')
    const ordinary = {
      ...state.player,
      nen: { ...state.player.nen, in: true, ken: true },
      wakeupInvulnerableFrames: 30,
    }
    expect(projectionBody(ordinary)).toBe(false)
    state.player = {
      ...ordinary,
      hanzoProjection: { bodyX: 22, bodyFacing: 1, bodyNen: ordinary.nen, startupFrames: 0 },
    }
    expect(projectionBody(state.player)).toBe(true)
    separate(state)
    expect(models.player.root.position.x).toBe(0)
    expect(models.opponent.root.position.x).toBe(0)
    state.player = {
      ...state.player,
      hanzoProjection: { ...state.player.hanzoProjection!, startupFrames: 5 },
    }
    separate({ ...state, frame: 1 })
    assertClear(models)
  })
  it('allows an actual jump over the rival when their body volumes no longer overlap vertically', () => {
    const { state, models, separate } = setup('hisoka')
    models.player.root.position.y = 4
    separate(state)
    expect(models.player.root.position.x).toBe(0)
    expect(models.opponent.root.position.x).toBe(0)
  })
})
