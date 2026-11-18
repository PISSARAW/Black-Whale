import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure } from '$lib/tour/humanFigure'
import type { HumanPose } from '$lib/tour/humanAnimation'
import { bodyPlan, fightBodyMotion } from './fightBodyMotion'
import { duelBridge, flowThroughBridge } from './duelAttackBridges'
import { createAttackTravel } from './fightAttackTravel'
import { FIXED_STEP } from './fightClock'
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

it('chambers the heel between Hisoka’s card slash and kick without changing the contact pose', () => {
  const load = duelBridge('hisoka:standingLight', 'hisoka:standingHeavy', -1)!
  const from = { leadKnee: [0, 0, 0] as const }
  const contact = { leadKnee: [-0.2, 0, 0] as const }
  const pose = (progress: number) => flowThroughBridge({ from, contact, load, progress })
  expect(pose(0).leadKnee).toEqual(from.leadKnee)
  expect(pose(0.5).leadKnee![0]).toBeGreaterThan(0.4)
  expect(pose(1).leadKnee).toEqual(contact.leadKnee)
})

it('keeps the chain-arm preparation on Kurapika’s right hand even when facing left', () => {
  const load = duelBridge('kurapika:standingLight', 'kurapika:standingHeavy', -1)!
  expect(load.rearElbow).toEqual([-0.8, 0, 0])
  expect(load.leadElbow).toBeUndefined()
})

it.each([1, -1] as const)('renders an attack step continuously facing %s', (facing) => {
  const travel = createAttackTravel()
  const base = { frame: 10, roundNumber: 1, frameAccumulator: 0, hitstop: 0 }
  const idle = fighter('hisoka', { x: 50, facing })
  const strike = { ...attacking('hisoka', 'forwardHeavy', 0), x: 50, facing }
  const frames = attackData('heavy', strike)
  strike.x += facing * frames.lunge
  const at = (attackFrame: number, accumulator = 0, hitstop = 0) => {
    strike.attack!.frame = attackFrame
    return travel(strike, strike, {
      ...base,
      frame: 11 + attackFrame,
      frameAccumulator: accumulator,
      hitstop,
    }).x
  }
  travel(idle, idle, base)
  expect(at(0)).toBeCloseTo(50)
  expect(at(0, FIXED_STEP / 2, 1)).toBeCloseTo(50)
  expect((at(1) - 50) * facing).toBeGreaterThan(0)
  expect(at(frames.startup)).toBe(strike.x)
})

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

  it('keeps Kurapika’s chain-hand thrust on the actual right hand after a side switch', () => {
    const right = attacking('kurapika', 'forwardLight', 0)
    right.attack!.frame = attackData('light', right).startup
    const first = bodyPlan(right, context)!.pose
    const mirrored = bodyPlan({ ...right, facing: -1 }, context)!.pose
    expect(mirrored.rearElbow).toEqual(first.leadElbow)
    expect(mirrored.rearShoulder).toEqual(first.leadShoulder)
  })

  it.each(['kurapika', 'hisoka', 'chrollo', 'benjamin'] as const)(
    'keeps %s grounded through the seven ground contacts in both directions',
    (id) => {
      for (const facing of [1, -1] as const) {
        const model = figureOf(id)
        const standing = poseAndMeasure(model, fighter(id, { facing }), 1)
        let seconds = 3
        for (const slot of [
          'standingLight',
          'standingHeavy',
          'lowLight',
          'lowHeavy',
          'forwardLight',
          'forwardHeavy',
          'backHeavy',
        ] as const) {
          const attack = attacking(id, slot, 0)
          attack.facing = facing
          attack.attack!.frame = attackData(attack.attack!.kind, attack).startup
          const height = poseAndMeasure(model, attack, seconds)
          expect(Math.abs(height - standing), `${id} ${slot} ${facing}`).toBeLessThan(0.1)
          seconds += 2
        }
      }
    },
  )

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

  it.each(FIGHTING_ROSTER.map(({ id }) => id))(
    'carries %s contact into the next strike and lands the new pose on the active frame',
    (id) => {
      const model = figureOf(id)
      const jab = attacking(id, 'standingLight', 0)
      jab.attack!.frame = attackData('light', jab).startup
      const followup = attacking(id, 'standingHeavy', 0)
      const startup = attackData('heavy', followup).startup
      const shoulder = model.root.getObjectByName('shoulder-right')!
      pose(model, jab)
      const outgoing = shoulder.rotation.clone()
      pose(model, followup)
      expect(shoulder.rotation.toArray()).toEqual(outgoing.toArray())
      pose(model, attacking(id, 'standingHeavy', Math.max(1, startup - 2)))
      expect(shoulder.rotation.toArray()).not.toEqual(outgoing.toArray())
      pose(model, attacking(id, 'standingHeavy', startup))
      const contact = shoulder.rotation.clone()
      const isolated = figureOf(id)
      pose(isolated, attacking(id, 'standingHeavy', startup))
      expect(contact.toArray()).toEqual(
        isolated.root.getObjectByName('shoulder-right')!.rotation.toArray(),
      )
    },
  )

  it.each(FIGHTING_ROSTER.map(({ id }) => id))(
    'uses a grounded transfer on %s links and leaves the first active pose intact',
    (id) => {
      const linked = figureOf(id)
      const isolated = figureOf(id)
      const first = attacking(id, 'forwardLight', 0)
      first.attack!.frame = attackData('light', first).startup
      const strike = attacking(id, 'standingHeavy', 0)
      const timing = attackData('heavy', strike)
      expect(bodyPlan(strike, context)?.attackFlow?.transfer).toBeDefined()
      pose(linked, first, 1)
      pose(linked, fighter(id), 1 + FIXED_STEP)
      pose(isolated, fighter(id), 1)
      pose(linked, strike, 1 + 2 * FIXED_STEP)
      pose(isolated, strike, 1 + 2 * FIXED_STEP)
      strike.attack!.frame = Math.ceil(timing.startup / 2)
      const time = 1 + FIXED_STEP * (2 + strike.attack!.frame)
      pose(linked, strike, time)
      pose(isolated, strike, time)
      const knees = (model: ReturnType<typeof figureOf>) =>
        ['knee-left', 'knee-right'].map((part) => model.root.getObjectByName(part)!.rotation.x)
      expect(knees(linked)).not.toEqual(knees(isolated))
      strike.attack!.frame = timing.startup
      pose(linked, strike, time + FIXED_STEP)
      pose(isolated, strike, time + FIXED_STEP)
      expect(knees(linked)).toEqual(knees(isolated))
    },
  )

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

  it('uses personal choreography for the complete playable roster', () => {
    expect(keyedMove('kurapika', 'standingLight').authored).toBe(true)
    expect(keyedMove('kurapika', 'neutralSpecial').authored).toBe(true)
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
