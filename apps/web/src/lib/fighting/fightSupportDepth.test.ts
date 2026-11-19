import { expect, it } from 'vitest'
import { FIGHTING_ROSTER } from './roster'
import * as THREE from 'three'
import { createFightState } from './fightState'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { createFightPoseContinuity } from './fightPoseContinuity'
import { createSeparationSupport } from './fightSeparationSupport'
import { performAuraAttack } from './engine'
import { moveForSlot } from './movesets'
import { FIGHT_MODEL_POSES, transitionSecondsFor } from './sceneMotion'
import { attackData } from './frameData'
import { humanAnimationRig } from '$lib/tour/humanAnimation'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s keeps its presented pelvis low through a crouch-to-strike contact',
  (id) => {
    const state = { ...createFightState(id, 'leorio'), phase: 'fighting' as const }
    const makeModel = (fighter: typeof state.player) => buildFightFigure({
      THREE,
      glow: (color) => new THREE.MeshBasicMaterial({ color }),
      fighter,
    })
    const scene = new THREE.Scene()
    let model = makeModel(state.player)
    scene.add(model.root)
    const continuity = createFightPoseContinuity(),
      support = createSeparationSupport()
    const draw = (fighter: typeof state.player, frame: number) => {
      model.animate(frame / 60, FIGHT_MODEL_POSES[fighter.pose], {
        transitionKey: `${fighter.pose}:${fighter.attack?.moveId ?? ''}`,
        transitionSeconds: transitionSecondsFor(fighter),
        motion: fightBodyMotion({
          fighter,
          seconds: frame / 60,
          progress: 0,
          poseContinuity: continuity,
        }),
      })
      support.prepare(model.turns, fighter, { frame, frozen: false })
      support(model.turns, fighter, { frame, frozen: false })
      return humanAnimationRig(model.turns)!.pelvis.getWorldPosition(new THREE.Vector3()).y
    }
    const low = { ...state.player, crouching: true }
    const before = draw(low, 0)
    const move = moveForSlot(id, 'forwardLight')!
    const fighter = performAuraAttack({
      state,
      side: 'player',
      kind: move.kind,
      moveId: move.id,
      auraCharged: false,
    }).player
    const frames = attackData(move.kind, fighter)
    let after = before
    for (let frame = 0; frame <= frames.startup; frame++)
      after = draw({ ...fighter, attack: { ...fighter.attack!, frame } }, frame + 1)
    expect(after - before).toBeLessThan(0.24)
    scene.remove(model.root)
    model = makeModel(fighter)
    scene.add(model.root)
    const rebuilt = draw({ ...fighter, attack: { ...fighter.attack!, frame: frames.startup } }, frames.startup + 1)
    expect(Math.abs(rebuilt - after)).toBeLessThan(0.08)
  },
)
