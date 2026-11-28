import { afterAll, expect, it, vi } from 'vitest'
import { createCamillaFatalityFilm } from '../../../../demos/fighting-showcase/camillaFatalityFilm'
import { createPhinksFatalityFilm } from '../../../../demos/fighting-showcase/phinksFatalityFilm'
import { writeFileSync } from 'node:fs'
import * as THREE from 'three'
import { createFight } from '../engine'
import { fightBodyMotion } from '../fightBodyMotion'
import { buildFightFigure } from '../fighterFigure'
import { defaultFightComfort } from '../fightComfort'
import { physicalJoints, physicalViolations, boneSnapshot } from '../physicalAuditTestKit'
import {
  VICTORY_FIGHTERS,
  selectVictory,
  type VictorySelection,
  type VictoryFighter,
} from './catalogue'
import { createVictoryRenderer } from './renderer'
import {
  PHINKS_CONTACT,
  PHINKS_DISINTEGRATED,
  PHINKS_FRAGMENT_BURST,
  PHINKS_PARRY,
  PHINKS_REACTION_SHOT,
} from './phinksTiming'
import type { FighterId, FightSide, FightState } from '../types'
vi.mock('./card', () => ({ createVictoryCard: () => new THREE.Group() }))

const motionReport: unknown[] = []
afterAll(() => {
  if (process.env.CINEMATIC_AUDIT_REPORT)
    writeFileSync(process.env.CINEMATIC_AUDIT_REPORT, JSON.stringify(motionReport, null, 2))
})

const KEYS = [
  0, 1, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450, 480, 510, 540, 570,
  599,
]
interface Case {
  id: VictoryFighter
  target: FighterId
  variant?: VictorySelection['variant']
  side: FightSide
  dense?: boolean
}
const cases: Case[] = VICTORY_FIGHTERS.flatMap((id) =>
  (['player', 'opponent'] as const).flatMap((side) =>
    (['franklin', 'biscuit'] as const).map((target) => ({
      id,
      target,
      side,
      dense: side === 'player' && target === 'franklin',
    })),
  ),
)
cases.push({ id: 'phinks', target: 'kurapika', side: 'player', dense: true })
const variants: Pick<Case, 'id' | 'target' | 'variant'>[] = [
  { id: 'chrollo', target: 'hisoka', variant: 'chrollo-sun-moon' },
  { id: 'benjamin', target: 'furykov', variant: 'beyond-curse-furykov' },
  { id: 'camilla', target: 'longhi', variant: 'beyond-curse-longhi' },
  { id: 'rihan', target: 'shizuku' },
  { id: 'rihan', target: 'hisoka' },
]
for (const variant of variants)
  for (const side of ['player', 'opponent'] as const)
    cases.push({ ...variant, side, dense: side === 'player' })

it.each(cases)(
  '$id against $target, $side, $variant: the displayed film preserves anatomy and bone lengths',
  ({ id, target, side, variant, dense }) => {
    const state: FightState = {
      ...createFight(side === 'player' ? id : target, side === 'player' ? target : id),
      phase: 'finished',
      winner: side,
    }
    if (id === 'phinks' && target === 'kurapika')
      Object.assign(state, createPhinksFatalityFilm().state)
    if (id === 'camilla') Object.assign(state, createCamillaFatalityFilm({ target, side }).state)
    const source = JSON.stringify(state)
    const glow = (color: number) => new THREE.MeshBasicMaterial({ color })
    const build = (fighter: FightState['player']) => {
      const model = buildFightFigure({ THREE, glow, fighter })
      model.animate(0, 'idle', { motion: fightBodyMotion({ fighter, seconds: 0, progress: 0 }) })
      return model.root
    }
    const models = { player: build(state.player), opponent: build(state.opponent) }
    const joints = [...physicalJoints(models.player), ...physicalJoints(models.opponent)]
    const bones = boneSnapshot(joints)
    const seenBones = new Map(bones.map((bone) => [bone[0], bone]))
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(34, 1.6, 0.1, 100),
      scenery = new THREE.Group()
    scene.add(models.player, models.opponent, scenery)
    const renderer = createVictoryRenderer({ scene, camera, scenery })
    const found: unknown[] = []
    const previous = new Map<THREE.Object3D, { quaternion: THREE.Quaternion; age: number }>()
    const pops: unknown[] = []
    try {
      const frame = selectVictory(state)!
      const samples = dense
        ? Array.from({ length: (frame.duration ?? 10) * 60 }, (_, i) => i)
        : KEYS.filter((age) => age < (frame.duration ?? 10) * 60)
      for (const age of samples) {
        const restore = renderer.apply({
          state,
          models,
          comfort: defaultFightComfort(),
          frame: {
            ...frame,
            ...(variant ? { variant } : {}),
            active: true,
            elapsed: age / 60,
          },
        })!
        if (id === 'phinks' && target === 'kurapika' && age === PHINKS_PARRY) {
          const world = (root: THREE.Object3D, name: string) =>
            root.getObjectByName(name)!.getWorldPosition(new THREE.Vector3())
          const palm = world(models.player, 'hand-left')
          const reaching = new THREE.Line3(
            world(models.opponent, 'elbow-right'),
            world(models.opponent, 'hand-right'),
          )
          expect(
            reaching.closestPointToPoint(palm, true, new THREE.Vector3()).distanceTo(palm),
            'the free hand reaches the incoming forearm',
          ).toBeLessThan(0.15)
          const screen = palm.project(camera)
          expect(Math.abs(screen.x)).toBeLessThan(0.72)
          expect(Math.abs(screen.y)).toBeLessThan(0.72)
        }
        if (id === 'phinks' && target === 'kurapika' && age === PHINKS_CONTACT) {
          const world = (root: THREE.Object3D, name: string) =>
            root.getObjectByName(name)!.getWorldPosition(new THREE.Vector3())
          const fist = world(models.player, 'hand-right')
          const distance = Math.min(
            ...['left', 'right'].map((side) => {
              const guard = new THREE.Line3(
                world(models.opponent, `elbow-${side}`),
                world(models.opponent, `hand-${side}`),
              )
              return guard.closestPointToPoint(fist, true, new THREE.Vector3()).distanceTo(fist)
            }),
          )
          expect(distance, 'fist reaches the braced forearm').toBeLessThan(0.17)
          const impact = fist.project(camera)
          expect(Math.abs(impact.x)).toBeLessThan(0.72)
          expect(Math.abs(impact.y)).toBeLessThan(0.72)
        }
        if (id === 'phinks' && target === 'kurapika' && age === PHINKS_REACTION_SHOT + 58) {
          const subject = models.player.getObjectByName('face-eye-left')!
          const eye = subject.getWorldPosition(new THREE.Vector3()).project(camera)
          expect(eye.x, 'leave room for the verdict to the left of Phinks').toBeGreaterThan(0.12)
          expect(eye.x).toBeLessThan(0.72)
          expect(Math.abs(eye.y)).toBeLessThan(0.8)
        }
        if (id === 'phinks' && target === 'kurapika' && age === PHINKS_FRAGMENT_BURST + 6) {
          const torso = models.opponent.getObjectByName('torso')!
          const programs = new Set<string>()
          torso.traverseVisible((node) => {
            if (!(node instanceof THREE.Mesh)) return
            const materials = Array.isArray(node.material) ? node.material : [node.material]
            for (const material of materials) programs.add(material.customProgramCacheKey())
          })
          expect(models.opponent.visible).toBe(true)
          expect(programs.has('phinks-cell-fracture-v1')).toBe(true)
          expect(scene.getObjectByName('phinks-body-fragments')).toBeInstanceOf(THREE.InstancedMesh)
        }
        if (id === 'phinks' && target === 'kurapika' && age === PHINKS_DISINTEGRATED + 1) {
          expect(models.opponent.visible).toBe(false)
          expect(scene.getObjectByName('phinks-body-fragments')).toBeInstanceOf(THREE.InstancedMesh)
        }
        // Read after the complete driver, including props, alternate bodies and final constraints.
        const drawn = physicalJoints(scene)
        const errors = physicalViolations(drawn)
        const displayedBones = boneSnapshot(drawn)
        for (const bone of displayedBones) if (!seenBones.has(bone[0])) seenBones.set(bone[0], bone)
        expect(displayedBones, `all bodies, frame ${age}`).toEqual(
          displayedBones.map((bone) => seenBones.get(bone[0])),
        )
        if (dense)
          for (const { node, kind } of drawn) {
            if (!displayed(node)) {
              previous.delete(node)
              continue
            }
            const last = previous.get(node)
            const delta = last ? last.quaternion.angleTo(node.quaternion) : 0
            if (last?.age === age - 1 && delta > 0.65 && pops.length < 60)
              pops.push({ age, joint: node.name || kind, degrees: (delta * 180) / Math.PI })
            previous.set(node, { quaternion: node.quaternion.clone(), age })
          }
        if (errors.length && found.length < 8) found.push({ age, errors })
        expect(boneSnapshot(joints), `frame ${age}`).toEqual(bones)
        restore()
      }
      if (dense) motionReport.push({ id, target, side, variant, samples: samples.length, pops })
      expect(found).toEqual([])
      expect(pops).toEqual([])
      expect(JSON.stringify(state)).toBe(source)
    } finally {
      renderer.dispose()
    }
  },
  120000,
)

function displayed(node: THREE.Object3D): boolean {
  for (let ancestor: THREE.Object3D | null = node; ancestor; ancestor = ancestor.parent)
    if (!ancestor.visible) return false
  return true
}
