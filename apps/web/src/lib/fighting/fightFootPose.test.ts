import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { humanFootRig } from '$lib/tour/humanFootRig'
import { buildFightFigure } from './fighterFigure'
import { createFightState } from './fightState'
import { movesetFor } from './movesets'
import { animateFightFootPoseResponse } from './fightFootPose'

const glow = (color: number, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

describe('deterministic skinned fight feet', () => {
  it('articulates the lead toe for a low heavy without moving its contact anchor', () => {
    const base = createFightState('hisoka', 'kurapika').player
    const move = movesetFor(base.id)!.moves.find((candidate) => candidate.slot === 'lowHeavy')!
    const fighter = {
      ...base,
      facing: 1 as const,
      attack: {
        kind: move.kind,
        variant: move.variant,
        moveId: move.id,
        frame: move.tuning.startup,
        impacted: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: null,
        projectileSpawned: false,
        reversal: false,
      },
    }
    const model = buildFightFigure({ THREE, glow, fighter })
    const rig = humanFootRig(model.root.getObjectByName('foot-right')!)!
    const contact = model.root.getObjectByName('ground-contact-right')!
    const before = contact.position.clone()
    animateFightFootPoseResponse(model.turns, fighter)
    expect(rig.ankle.rotation.x).toBeLessThan(0)
    expect(rig.toe.rotation.x).toBeGreaterThan(0)
    expect(contact.position).toEqual(before)
  })

  it('repeats the same foot pose for the same replay frame', () => {
    const fighter = createFightState('kurapika', 'hisoka').player
    const model = buildFightFigure({ THREE, glow, fighter })
    const rig = humanFootRig(model.root.getObjectByName('foot-left')!)!
    animateFightFootPoseResponse(model.turns, fighter)
    const first = [
      rig.ankle.rotation.x,
      rig.heel.rotation.x,
      rig.ball.rotation.x,
      rig.toe.rotation.x,
    ]
    animateFightFootPoseResponse(model.turns, fighter)
    expect([
      rig.ankle.rotation.x,
      rig.heel.rotation.x,
      rig.ball.rotation.x,
      rig.toe.rotation.x,
    ]).toEqual(first)
  })
})
