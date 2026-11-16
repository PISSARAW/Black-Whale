import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure } from '$lib/tour/humanFigure'
import type { HumanPose } from '$lib/tour/humanAnimation'
import { bodyPlan, fightBodyMotion } from './fightBodyMotion'
import { captureFootPlant, footHeight, fightRigOf } from './fightRig'
import { createFightState } from './fightState'
import { keyedMove } from './keyPoseMoves'
import { FIGHTING_ROSTER } from './roster'
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
    motion: fightBodyMotion({ fighter: who, seconds: at, progress: 0 }),
  })
}

const context = { seconds: 1, progress: 0 }

describe('fighting rig', () => {
  it('keeps the book strike on Chrollo’s actual right hand in both facings', () => {
    const right = attacking('chrollo', 'standingHeavy', 0)
    right.attack!.frame = attackData('heavy', right).startup
    const left = { ...right, facing: -1 as const }
    const first = bodyPlan(right, context)!.pose
    const mirrored = bodyPlan(left, context)!.pose
    expect(mirrored.rearElbow).toEqual(first.leadElbow)
    expect(mirrored.rearShoulder).toEqual(first.leadShoulder)
    expect(mirrored.leadElbow).toEqual(first.rearElbow)
  })

  it('draws every fighter, with a plain guard for one that has no stance yet', () => {
    const unstanced = { ...fighter('kurapika'), id: 'no-stance' as FighterId }
    expect(bodyPlan(unstanced, context)?.pose.leadElbow).toBeDefined()
    expect(bodyPlan(fighter('kurapika'), context)).not.toBeNull()
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
    const standing = poseAndMeasure(model, fighter('kurapika'), 1)
    const sunk = model.turns.position.y
    const crouched = poseAndMeasure(model, fighter('kurapika', { crouching: true }), 2)
    expect(crouched).toBeCloseTo(standing, 3)
    expect(model.turns.position.y).toBeLessThan(sunk - 0.2)
  })

  it('locks one support foot horizontally through a grounded pose', () => {
    const model = figureOf('kurapika')
    const standing = poseAndReadFeet(model, fighter('kurapika'), 1)
    const crouched = poseAndReadFeet(model, fighter('kurapika', { crouching: true }), 2)
    const drift = crouched.map((foot, index) =>
      Math.hypot(foot.x - standing[index].x, foot.z - standing[index].z),
    )
    expect(Math.min(...drift)).toBeLessThan(1e-5)
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

  it('cross-fades from the last drawn pose when the plan changes', () => {
    const model = figureOf('hisoka')
    pose(model, fighter('hisoka', { crouching: true }), 1)
    const chest = model.root.getObjectByName('fight-chest')!
    const crouched = chest.rotation.x
    pose(model, fighter('hisoka'), 1)
    expect(chest.rotation.x).toBeCloseTo(crouched, 5)
    pose(model, fighter('hisoka'), 1.5)
    expect(chest.rotation.x).not.toBeCloseTo(crouched, 2)
  })

  it('draws a struck fighter recoiling by where the blow landed', () => {
    const struck = fighter('chrollo', { pose: 'hit' })
    const head = bodyPlan(struck, { ...context, hitZone: 'head' })!.pose.head![0]
    const torso = bodyPlan(struck, { ...context, hitZone: 'torso' })!.pose.head![0]
    expect(head).toBeLessThan(torso)
  })

  it('leaves a knocked-down fighter on its back and stands it up on wake-up', () => {
    const lying = bodyPlan(fighter('franklin', { pose: 'down' }), { ...context, progress: 1 })!
    expect(lying.pose.body![0]).toBeLessThan(-1.2)
    const risen = bodyPlan(fighter('franklin', { pose: 'wakeup' }), { ...context, progress: 1 })!
    expect(Math.abs(risen.pose.body?.[0] ?? 0)).toBeLessThan(0.3)
  })

  it('hands a teched throw back to the scene and resets the extra joints', () => {
    const model = figureOf('hisoka')
    pose(model, fighter('hisoka'))
    const teched = { ...attacking('hisoka', 'throw', 2), throwTechFrames: 4 }
    pose(model, teched, 2)
    expect(model.root.getObjectByName('fight-chest')!.rotation.y).toBe(0)
  })
})

describe('keyed moves for the whole roster', () => {
  const slots: MoveSlot[] = [
    'standingLight',
    'standingHeavy',
    'lowLight',
    'lowHeavy',
    'airLight',
    'airHeavy',
    'forwardLight',
    'forwardHeavy',
    'backHeavy',
    'neutralSpecial',
    'forwardSpecial',
    'downSpecial',
    'backSpecial',
    'throw',
    'finisher',
  ]
  it('gives every move of every fighter a contact pose on its first active frame', () => {
    for (const definition of FIGHTING_ROSTER) {
      for (const slot of slots) {
        const { timeline } = keyedMove(definition.id, slot)
        expect(timeline.some((key) => key.phase === 'active' && key.at === 0)).toBe(true)
      }
    }
  })

  it("draws a family's gestures for moves without hand keys", () => {
    expect(keyedMove('kurapika', 'standingLight').authored).toBe(true)
    expect(keyedMove('kurapika', 'neutralSpecial').authored).toBe(false)
    expect(keyedMove('franklin', 'neutralSpecial').timeline).not.toBe(
      keyedMove('leorio', 'neutralSpecial').timeline,
    )
  })
})

/** Pose a figure, let any cross-fade finish, and read the height of its lower foot. */
function poseAndMeasure(
  model: ReturnType<typeof figureOf>,
  who: ArcadeFighter,
  at: number,
): number {
  let height = Number.NaN
  for (const seconds of [at, at + 1]) {
    model.animate(seconds, 'idle', {
      motion: (rig) => {
        fightBodyMotion({ fighter: who, seconds, progress: 0 })(rig)
        height = footHeight(fightRigOf(rig))
      },
    })
  }
  return height
}

function poseAndReadFeet(model: ReturnType<typeof figureOf>, who: ArcadeFighter, at: number) {
  let feet: Array<{ x: number; z: number }> = []
  for (const seconds of [at, at + 1]) {
    model.animate(seconds, 'idle', {
      motion: (human) => {
        fightBodyMotion({ fighter: who, seconds, progress: 0 })(human)
        feet = captureFootPlant(fightRigOf(human)).positions.map(({ x, z }) => ({ x, z }))
      },
    })
  }
  return feet
}
