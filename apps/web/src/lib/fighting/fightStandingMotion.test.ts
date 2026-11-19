import { expect, it } from 'vitest'
import * as THREE from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { buildFightFigure } from './fighterFigure'
import { createFightState } from './fightState'
import { fightBodyMotion } from './fightBodyMotion'
import { createFightReactionPresentation } from './fightReactionPresentation'
import { createFightContactAlignment } from './fightContactAlignment'
import { fightRigOf } from './fightRig'
import { fightWorldX } from './fightCoordinates'
import { FIGHT_MODEL_POSES, transitionSecondsFor } from './sceneMotion'
import { motionOf, walkSpeed } from './fighterMovement'
import { lowestFootHeight } from './fightFootContact'
import { FIGHTING_ROSTER } from './roster'
import type { FighterId } from './types'

const glow = (color: number) => new THREE.MeshBasicMaterial({ color })

function duel(id: FighterId, facing: 1 | -1 = 1) {
  const state = { ...createFightState(id, 'chrollo'), phase: 'fighting' as const }
  state.player = { ...state.player, x: facing === 1 ? 30 : 70, facing }
  state.opponent = { ...state.opponent, x: facing === 1 ? 85 : 15, facing: facing === 1 ? -1 : 1 }
  const models = {
    player: buildFightFigure({ THREE, glow, fighter: state.player }),
    opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
  }
  new THREE.Scene().add(models.player.root, models.opponent.root)
  const reaction = createFightReactionPresentation()
  const align = createFightContactAlignment((side) => models[side].turns)
  let frame = 0
  return {
    state,
    draw() {
      state.frame = frame++
      const seconds = state.frame / 60
      for (const side of ['player', 'opponent'] as const) {
        const fighter = state[side],
          model = models[side]
        model.root.position.set(fightWorldX(fighter.x), fighter.y * 0.12, 0)
        model.root.rotation.y = fighter.facing * 1.25
        model.animate(seconds, FIGHT_MODEL_POSES[fighter.pose], {
          transitionKey: `${fighter.pose}:${fighter.attack?.moveId ?? ''}`,
          transitionSeconds: transitionSecondsFor(fighter),
          motion: fightBodyMotion({
            fighter,
            seconds,
            ...reaction(state, side, { fighter, seconds }),
          }),
        })
      }
      const human = humanAnimationRig(models.player.turns)!
      const knees = human.knees.map((knee) => knee.rotation.x)
      align(state)
      return { human, knees, rig: fightRigOf(human) }
    },
  }
}

it.each(FIGHTING_ROSTER.map((fighter) => fighter.id))(
  '%s holds a stable standing posture with its soles on the floor',
  (id) => {
    const fight = duel(id)
    let standing: number[] | undefined
    let previous: number[] | undefined
    for (let n = 0; n < 90; n++) {
      const { human, rig } = fight.draw()
      standing ??= human.knees.map((knee) => knee.rotation.x)
      human.knees.forEach((knee, i) => {
        expect(
          Math.abs(knee.rotation.x - standing![i]),
          `${id} frame ${n}, knee ${i}`,
        ).toBeLessThan(0.2)
        if (previous)
          expect(
            Math.abs(knee.rotation.x - previous[i]),
            `${id}: knee snaps at frame ${n}`,
          ).toBeLessThan(0.08)
      })
      previous = human.knees.map((knee) => knee.rotation.x)
      rig.ankles.forEach((ankle) => expect(lowestFootHeight(ankle)).toBeGreaterThan(-0.008))
    }
  },
)

it.each([1, -1] as const)(
  'walks forward and backward facing %s, then recovers its standing posture',
  (facing) => {
    for (const { id } of FIGHTING_ROSTER) {
      const fight = duel(id, facing)
      const standing = fight.draw().human.knees.map((knee) => knee.rotation.x)
      const lifts = [0, 0]
      let maxSlide = 0
      let previous: { foot: number; sole: THREE.Vector3 } | undefined
      for (let n = 0; n < 180; n++) {
        const direction = n < 20 || n >= 140 ? 0 : n < 80 ? facing : -facing
        fight.state.player.pose = direction ? 'walk' : 'idle'
        fight.state.player.motion = {
          ...motionOf(fight.state.player),
          heldDirection: direction as 1 | -1 | 0,
        }
        fight.state.player.x += (direction * walkSpeed(fight.state.player)) / 60
        const { human, rig } = fight.draw()
        if (direction) {
          const bottoms = rig.ankles.map(lowestFootHeight)
          const support = bottoms[0] <= bottoms[1] ? 0 : 1
          const sole = rig.ankles[support].getWorldPosition(new THREE.Vector3())
          if (previous?.foot === support && n !== 80) {
            const slide = sole.distanceTo(previous.sole)
            maxSlide = Math.max(maxSlide, slide)
          }
          previous = { foot: support, sole }
          rig.ankles.forEach((ankle, i) => {
            const bottom = lowestFootHeight(ankle)
            expect(bottom, `${id} frame ${n}, foot ${i} penetrates the floor`).toBeGreaterThan(
              -0.01,
            )
            lifts[i] = Math.max(lifts[i], bottom)
          })
          expect(
            lowestFootHeight(rig.ankles[support]),
            `${id} frame ${n}: support floats`,
          ).toBeLessThan(0.02)
        } else previous = undefined
        if (n > 160)
          human.knees.forEach((knee, i) => {
            expect(
              Math.abs(knee.rotation.x - standing[i]),
              `${id} after stopping, knee ${i}`,
            ).toBeLessThan(0.25)
          })
        expect(Math.abs(human.figure.rotation.x), `${id} body lean`).toBeLessThan(0.4)
      }
      lifts.forEach((lift) =>
        expect(lift, `${id}: both feet must leave the floor`).toBeGreaterThan(0.025),
      )
      expect(maxSlide, `${id}: the supporting foot slides`).toBeLessThan(0.025)
    }
  },
  30000,
)
