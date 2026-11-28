import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { humanHandRig } from '$lib/tour/humanHandRig'
import { buildFightFigure } from './fighterFigure'
import { createFightState } from './fightState'
import { movesetFor } from './movesets'
import { animateFightHandGripResponse, fightGripProfiles } from './fightHandGrip'

const glow = (color: number, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

describe('deterministic skinned fight grips', () => {
  it('closes the lead hand for a punch without moving its public grip anchor', () => {
    const base = createFightState('kurapika', 'hisoka').player
    const move = movesetFor(base.id)!.moves.find((candidate) => candidate.slot === 'standingHeavy')!
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
    const hand = model.root.getObjectByName('hand-right')!
    const rig = humanHandRig(hand)!
    const grip = model.root.getObjectByName('grip-right')!
    const before = grip.position.clone()
    animateFightHandGripResponse(model.turns, fighter)
    expect(rig.fingers[0].proximal.rotation.x).toBeLessThan(-0.9)
    expect(grip.position).toEqual(before)
  })

  it('derives book and pistol profiles from visible held objects', () => {
    const hands = [new THREE.Group(), new THREE.Group()] as const
    const book = new THREE.Group()
    book.name = 'open-book'
    hands[0].add(book)
    const pistol = new THREE.Group()
    pistol.name = 'service-pistol'
    hands[1].add(pistol)
    const fighter = createFightState('kurapika', 'hisoka').player
    expect(fightGripProfiles(hands, fighter)).toEqual(['book', 'pistol'])
  })

  it('keeps the same bone result when a replay frame is evaluated twice', () => {
    const fighter = createFightState('hisoka', 'kurapika').player
    const model = buildFightFigure({ THREE, glow, fighter })
    const rig = humanHandRig(model.root.getObjectByName('hand-left')!)!
    animateFightHandGripResponse(model.turns, fighter)
    const first = rig.fingers.flatMap((finger) => [
      finger.proximal.rotation.x,
      finger.middle.rotation.x,
      finger.distal.rotation.x,
    ])
    animateFightHandGripResponse(model.turns, fighter)
    expect(
      rig.fingers.flatMap((finger) => [
        finger.proximal.rotation.x,
        finger.middle.rotation.x,
        finger.distal.rotation.x,
      ]),
    ).toEqual(first)
  })
})
