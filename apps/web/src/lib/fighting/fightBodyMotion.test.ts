import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure } from '$lib/tour/humanFigure'
import type { HumanPose } from '$lib/tour/humanAnimation'
import { bodyPlan, fightBodyMotion } from './fightBodyMotion'
import { footHeight, fightRigOf } from './fightRig'
import { createFightState } from './fightState'
import { attackData } from './frameData'
import { moveForSlot } from './movesets'
import type { ArcadeFighter, FighterId, MoveSlot } from './types'

const glow = (colour: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color: colour, opacity, transparent: opacity < 1 })

function figureOf(identity: FighterId) {
  const root = new THREE.Group()
  const model = buildHumanFigure({
    THREE,
    glow,
    seen: {
      id: `fight-rig-test:${identity}`,
      kind: 'combatant',
      spaceId: 'black-whale-clash',
      tierId: 'arcade-stage',
      at: [0, 0],
      y: 0,
      size: 1,
      colour: 0xffffff,
      stage: 0,
      hidden: false,
      human: { role: 'fighter', identity, pose: 'idle', aura: 'none' },
    },
  })
  root.add(model.root)
  return model
}

function fighter(id: FighterId, patch: Partial<ArcadeFighter> = {}): ArcadeFighter {
  return { ...createFightState(id, 'hisoka').player, ...patch }
}

function attacking(id: FighterId, slot: MoveSlot, frame: number): ArcadeFighter {
  const move = moveForSlot(id, slot)!
  const base = fighter(id, { pose: move.kind })
  return {
    ...base,
    pose: move.kind,
    attack: {
      moveId: move.id,
      variant: move.variant,
      kind: move.kind,
      frame,
      impacted: false,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: false,
      reversal: false,
    },
  }
}

function pose(model: ReturnType<typeof figureOf>, who: ArcadeFighter, at = 1, base?: HumanPose) {
  model.animate(at, base ?? 'idle', {
    motion: fightBodyMotion({ fighter: who, seconds: at }),
  })
}

describe('fighting rig', () => {
  it('leaves fighters without a stance to the procedural gestures', () => {
    const unstanced = { ...fighter('kurapika'), id: 'no-stance' as FighterId }
    expect(bodyPlan(unstanced, 1)).toBeNull()
    expect(bodyPlan(fighter('kurapika'), 1)).not.toBeNull()
  })

  it('turns the chest about the waist and carries the arms with it', () => {
    const model = figureOf('kurapika')
    pose(model, fighter('kurapika'))
    const chest = model.root.getObjectByName('fight-chest')!
    expect(chest.rotation.y).not.toBe(0)
    expect(model.root.getObjectByName('shoulder-right')!.parent).toBe(chest)
    expect(model.root.getObjectByName('hip-right')!.parent).not.toBe(chest)
  })

  it('keeps the planted foot on the floor through a deep crouch', () => {
    const model = figureOf('kurapika')
    const standing = poseAndMeasure(model, fighter('kurapika'))
    const sunk = model.turns.position.y
    const crouched = poseAndMeasure(model, fighter('kurapika', { crouching: true }))
    expect(crouched).toBeCloseTo(standing, 3)
    expect(model.turns.position.y).toBeLessThan(sunk - 0.2)
  })

  it('reaches the jab contact on its first active frame', () => {
    const model = figureOf('kurapika')
    const first = attacking('kurapika', 'standingLight', 0)
    const startup = attackData(first.attack!.kind, first).startup
    pose(model, attacking('kurapika', 'standingLight', 0))
    const shoulder = model.root.getObjectByName('shoulder-right')!
    const atRest = shoulder.rotation.x
    pose(model, attacking('kurapika', 'standingLight', startup))
    expect(shoulder.rotation.x).toBeLessThan(atRest - 0.6)
  })

  it('resets the extra joints when the scene falls back to another motion', () => {
    const model = figureOf('hisoka')
    pose(model, fighter('hisoka'))
    pose(model, fighter('hisoka', { pose: 'hit' }))
    expect(model.root.getObjectByName('fight-chest')!.rotation.y).toBe(0)
  })
})

/** Pose a figure and read the height of its lower foot while still posed. */
function poseAndMeasure(model: ReturnType<typeof figureOf>, who: ArcadeFighter): number {
  let height = Number.NaN
  model.animate(1, 'idle', {
    motion: (rig) => {
      fightBodyMotion({ fighter: who, seconds: 1 })(rig)
      height = footHeight(fightRigOf(rig))
    },
  })
  return height
}
