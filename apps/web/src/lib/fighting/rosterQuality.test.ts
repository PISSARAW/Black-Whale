import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { FIGHTING_ROSTER } from './roster'
import { COMBAT_FIGHTERS, COMBAT_ROUTES } from './combatRoutes'
import { movesetFor } from './movesets'
import { hasDuelComboProfile } from './duelComboProfiles'
import { ROSTER_CHOREOGRAPHY } from './rosterChoreography'
import { keyedMove } from './keyPoseMoves'
import { buildFightFigure } from './fighterFigure'
import { createFightState } from './fightState'
import { fightBodyMotion, bodyPlan } from './fightBodyMotion'
import { rosterSustainedMotion } from './rosterSustainedMotion'
import { footHeight, fightRigOf } from './fightRig'
import { BASHO_POEMS, BASHO_WRITING_FRAMES } from './bashoPoem'
import { fightingStyle } from './fightStyles'
import { projectHanzo } from './hanzoProjection'
import type { ArcadeFighter, MoveSlot } from './types'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
const NORMALS: MoveSlot[] = [
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'airLight',
  'airHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
]

describe('roster quality parity', () => {
  it('covers forty fighters, their core routes and one hundred and sixty-eight advanced duel lessons', () => {
    const ids = FIGHTING_ROSTER.map((fighter) => fighter.id).sort()
    expect(Object.keys(ROSTER_CHOREOGRAPHY).sort()).toEqual(ids)
    expect([...COMBAT_FIGHTERS].sort()).toEqual(ids)
    expect(COMBAT_ROUTES).toHaveLength(328)
    expect(new Set(COMBAT_ROUTES.map((route) => route.id)).size).toBe(328)
    expect(ids.every(hasDuelComboProfile)).toBe(true)
    for (const id of ids)
      expect(COMBAT_ROUTES.filter((route) => route.fighter === id)).toHaveLength(
        ['kurapika', 'benjamin'].includes(id) ? 12 : 8,
      )
  })

  it.each(FIGHTING_ROSTER)(
    '$name: every available move has a personal timeline and valid training routes',
    ({ id }) => {
      const moveset = movesetFor(id)!
      const style = fightingStyle(id)
      expect(style.descriptionFr).not.toMatch(/Adapte son Hatsu|Utilisateur de Nen de combat/)
      expect(style.descriptionEn).not.toMatch(/Adapts this Hatsu|Combat Nen User/)
      expect(style.descriptionFr).not.toMatch(new RegExp(`^${id}:`))
      for (const move of moveset.moves) {
        const clip = keyedMove(id, move.slot)
        expect(clip.authored, move.id).toBe(true)
        expect(
          clip.timeline.some((key) => key.phase === 'active' && key.at === 0),
          move.id,
        ).toBe(true)
        expect(
          clip.timeline.flatMap((key) => Object.values(key.pose).flat()).every(Number.isFinite),
        ).toBe(true)
      }
      for (const route of COMBAT_ROUTES.filter((route) => route.fighter === id)) {
        for (const slot of route.moves)
          expect(
            moveset.moves.some((move) => move.slot === slot),
            route.id,
          ).toBe(true)
        if (!hasDuelComboProfile(id)) {
          expect(
            route.moves.every((slot) => !slot.includes('Special') && slot !== 'finisher'),
          ).toBe(true)
        }
      }
    },
  )

  it('gives every pair of fighters different complete physical choreography', () => {
    const signatures = FIGHTING_ROSTER.map(({ id }) =>
      JSON.stringify(NORMALS.map((slot) => keyedMove(id, slot).timeline)),
    )
    expect(new Set(signatures).size).toBe(FIGHTING_ROSTER.length)
  })

  it('keeps close-up eye and face detail translucent on Hanzo’s projection', () => {
    const fighter = projectHanzo(createFightState('hanzo', 'hisoka').player)
    const model = buildFightFigure({ THREE, glow, fighter })
    for (const name of ['clash-eyelid-contours', 'clash-face-contours', 'clash-iris-fibres']) {
      const mesh = model.root.getObjectByName(name) as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshBasicMaterial
      >
      expect(mesh.material.transparent).toBe(true)
      expect(mesh.material.opacity).toBeCloseTo(0.28)
    }
  })

  it.each(FIGHTING_ROSTER)(
    '$name: close-up finish survives both orientations and all nine physical moves',
    ({ id }) => {
      const fighter = createFightState(id, 'hisoka').player
      const model = buildFightFigure({ THREE, glow, fighter })
      const duplicate = buildFightFigure({ THREE, glow, fighter })
      if (id !== 'kurapika') {
        const lids = model.root.getObjectByName('clash-eyelid-contours') as THREE.Mesh
        expect(lids).toBeDefined()
        expect(lids.geometry).toBe(
          (duplicate.root.getObjectByName('clash-eyelid-contours') as THREE.Mesh).geometry,
        )
      }
      const before = JSON.stringify(fighter)
      for (const facing of [1, -1] as const)
        for (const slot of NORMALS) {
          const move = movesetFor(id)!.moves.find((move) => move.slot === slot)!
          const posed: ArcadeFighter = {
            ...fighter,
            facing,
            pose: move.kind,
            y: move.variant === 'air' ? 3 : 0,
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
          model.animate(1, 'idle', {
            motion: fightBodyMotion({ fighter: posed, seconds: 1, progress: 0.5 }),
          })
          model.animate(2, 'idle', {
            motion: fightBodyMotion({ fighter: posed, seconds: 2, progress: 0.5 }),
          })
          model.root.updateMatrixWorld(true)
          const box = new THREE.Box3().setFromObject(model.root)
          expect(
            [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z].every(
              Number.isFinite,
            ),
            `${id}:${slot}`,
          ).toBe(true)
          model.animate(3, 'idle', {
            motion: (human) => {
              expect(Number.isFinite(footHeight(fightRigOf(human)))).toBe(true)
            },
          })
        }
      expect(JSON.stringify(fighter)).toBe(before)
    },
  )
})

describe('sustained technique presentation', () => {
  const base = createFightState('basho', 'hisoka').player
  const writing: ArcadeFighter = {
    ...base,
    bashoPoem: {
      text: BASHO_POEMS.fr,
      effect: 'ignite-punched-target',
      writingFrames: BASHO_WRITING_FRAMES - 4,
      originX: base.x,
      ready: false,
    },
  }
  it('freezes writing at the simulated counter, and retains the anatomical pen hand in both directions', () => {
    expect(rosterSustainedMotion(writing, 1)).toEqual(rosterSustainedMotion(writing, 100))
    const right = bodyPlan(writing, { seconds: 0, progress: 0 })!
    const left = bodyPlan({ ...writing, facing: -1 }, { seconds: 0, progress: 0 })!
    expect(left.pose.rearWrist).toEqual(right.pose.leadWrist)
    expect(
      bodyPlan(
        { ...writing, bashoPoem: { ...writing.bashoPoem!, writingFrames: 20 } },
        { seconds: 0, progress: 0 },
      )!.pose,
    ).not.toEqual(right.pose)
  })
  it('yields to actual interruptions, guard and occupied hands', () => {
    for (const patch of [
      { hitStun: 4 },
      { health: 0 },
      { coveringEars: true },
      { pluggingWounds: true },
      { blocking: true },
      { y: 3 },
    ])
      expect(rosterSustainedMotion({ ...writing, ...patch }, 0)).toBeNull()
  })
})
