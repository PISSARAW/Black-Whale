import { expect, it } from 'vitest'
import { createFight } from './engine'
import { createFightPoseContinuity } from './fightPoseContinuity'
import { bodyPlan } from './fightBodyMotion'
import { attackData } from './frameData'
import { FIGHTING_ROSTER } from './roster'
import { moveForSlot } from './movesets'
import type { ArcadeFighter, FighterId, MoveSlot } from './types'
import type { BodyPlan } from './fightPose'
import { pursuitGesture, pursuitSupport } from './pursuitMotion'

function pursuing(id: FighterId, slot: MoveSlot = 'airLight'): ArcadeFighter {
  const move = moveForSlot(id, slot)!
  const fighter = createFight(id, 'hisoka').player
  return {
    ...fighter,
    pose: move.kind,
    attack: {
      moveId: move.id,
      kind: move.kind,
      variant: move.variant,
      frame: 0,
      directionalChain: slot === 'airLight' ? 'pursuit' : 'pursuit-technique',
      impacted: false,
      confirmedHit: false,
      projectileSpawned: false,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      reversal: false,
    },
  }
}

it.each(FIGHTING_ROSTER.map(({ id }) => id))('%s conserve le contact natif en poursuite', (id) => {
  const fighter = pursuing(id)
  const flow = fighter.attack!
  const startup = attackData(flow.kind, fighter).startup
  const at = (frame: number, route = true) =>
    bodyPlan(
      {
        ...fighter,
        attack: { ...flow, frame, directionalChain: route ? 'pursuit' : undefined },
      },
      { seconds: 0, progress: 0 },
    )!
  const launch: BodyPlan = {
    key: 'launch',
    plant: true,
    blend: 0,
    pose: { leadKnee: [0.12, 0, 0] },
  }
  const draw = createFightPoseContinuity()
  draw(launch, 0)
  expect(at(0).attackFlow?.pursuit).toBeDefined()
  expect(draw(at(0), 1 / 60).leadKnee).toEqual(launch.pose.leadKnee)
  expect(draw(at(1), 2 / 60)).not.toEqual(launch.pose)
  expect(draw(at(startup), (startup + 1) / 60)).toEqual(at(startup, false).pose)
})

it('garde le pied avant de Kurapika, l’appui arrière d’Hisoka et les deux appuis de Franklin', () => {
  const examples = [
    ['kurapika', 'forwardSpecial', [1, 0]],
    ['hisoka', 'finisher', [0, 1]],
    ['franklin', 'forwardSpecial', ['both', 'both']],
  ] as const
  for (const [id, slot, feet] of examples) {
    const gesture = pursuitGesture(pursuing(id, slot), slot)!
    expect([pursuitSupport(gesture, 1), pursuitSupport(gesture, -1)]).toEqual(feet)
  }
})
