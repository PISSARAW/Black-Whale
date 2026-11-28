import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure, type HumanLook } from './humanFigure'
import { humanProfile } from './humanProfiles'
import { buildBasicApparition } from './apparitionBasicView'
import { ApparitionView } from './ApparitionView'
import type { PortalRenderer } from './PortalRenderer'
import { FIGHTING_ROSTER } from '../fighting/roster'
import { buildFightFigure } from '../fighting/fighterFigure'
import { createFightState } from '../fighting/fightState'
import { finishFightModel } from '../fighting/fighterModelFinish'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

function seen(identity: string): HumanLook {
  return {
    id: `shared:${identity}`,
    kind: 'avatar',
    spaceId: 'room',
    tierId: 'tier-1',
    at: [0, 0],
    y: 0,
    size: 0.42,
    colour: 0xffffff,
    stage: 0,
    hidden: false,
    human: { role: 'witness', identity, pose: 'idle', aura: 'none' },
  }
}

function named(root: THREE.Object3D, name: string): THREE.Mesh[] {
  const found: THREE.Mesh[] = []
  root.traverse((node) => {
    if (node.name === name) found.push(node as THREE.Mesh)
  })
  return found
}

const DETAILS = [
  'clash-eyelid-contours',
  'clash-iris-fibres',
  'clash-pupil-core',
  'clash-face-contours',
]

describe('shared close-up finish in Tour and its game modes', () => {
  it.each(FIGHTING_ROSTER)(
    '$name: the real apparition builder uses the same finish as Clash',
    (entry) => {
      const root = new THREE.Group()
      const parts = buildBasicApparition(seen(entry.modelId), {
        THREE,
        glow,
        root,
        skin: glow(0xffffff, 1),
      })!
      const fighter = buildFightFigure({
        THREE,
        glow,
        fighter: createFightState(entry.id, 'hisoka').player,
      })
      const counts =
        entry.id === 'kurapika'
          ? [0, 0, 0, 0]
          : [
              2,
              entry.id === 'illumi' ? 0 : 2,
              entry.id === 'illumi' ? 0 : 2,
              ['bonolenov', 'feitan'].includes(entry.id) ? 0 : 1,
            ]
      for (const [index, name] of DETAILS.entries()) {
        const common = named(root, name)
        const fighting = named(fighter.root, name)
        expect(common, name).toHaveLength(counts[index])
        expect(fighting, name).toHaveLength(common.length)
        common.forEach((mesh, i) => {
          expect(mesh.geometry, name).toBe(fighting[i].geometry)
          expect(mesh.geometry.userData.sharedHuman, name).toBe(true)
        })
      }
      const lids = named(root, DETAILS[0])
      if (lids.length) expect(lids[0].parent?.name).toBe('face-eye-left')
      for (const pose of ['idle', 'walk', 'guard', 'fallen'] as const)
        parts.humanAnimate?.(0.4, pose)
      expect(parts.humanLod?.far.children).toHaveLength(3)
      for (const name of DETAILS) expect(named(parts.humanLod!.far, name)).toHaveLength(0)
    },
  )

  it('keeps the old Clash entry point safe after the shared builder has finished the face', () => {
    const appearance = seen('hisoka')
    const model = buildHumanFigure({ THREE, glow, seen: appearance })
    const before = DETAILS.map((name) => named(model.root, name))
    finishFightModel({ THREE, glow, model, profile: humanProfile(appearance) })
    DETAILS.forEach((name, i) => expect(named(model.root, name)).toEqual(before[i]))
  })

  it('keeps Hisoka’s custom head and hair on the same rig in Tour and Clash', () => {
    const root = new THREE.Group()
    const visit = buildBasicApparition(seen('hisoka'), {
      THREE,
      glow,
      root,
      skin: glow(0xffffff, 1),
    })!
    const clash = buildFightFigure({
      THREE,
      glow,
      fighter: createFightState('hisoka', 'kurapika').player,
    })
    for (const name of ['manga-face', 'manga-layered-hair']) {
      const tourPart = root.getObjectByName(name)!
      const clashPart = clash.root.getObjectByName(name)!
      expect(tourPart.parent?.name).toBe('manga-head:hisoka')
      expect(clashPart.parent?.name).toBe(tourPart.parent?.name)
      expect((clashPart.children[1] as THREE.Mesh).geometry).toBe(
        (tourPart.children[1] as THREE.Mesh).geometry,
      )
    }
    const tourNose = root.getObjectByName('face-relief') as THREE.Mesh
    const clashNose = clash.root.getObjectByName('face-relief') as THREE.Mesh
    expect(clashNose.geometry).toBe(tourNose.geometry)
    for (const name of [
      'hisoka-waistcoat-left',
      'hisoka-waistcoat-trim',
      'hisoka-shirt-collar-stand',
    ]) {
      const tour = root.getObjectByName(name) as THREE.Mesh
      const combat = clash.root.getObjectByName(name) as THREE.Mesh
      expect(tour.parent?.name).toBe('torso')
      expect(combat.parent?.name).toBe('torso')
      expect(combat.geometry).toBe(tour.geometry)
    }
    const mouth = clash.root.getObjectByName('face-mouth') as THREE.Mesh
    expect(mouth.morphTargetInfluences).toHaveLength(3)
    for (const [actor, animate] of [
      [root, visit.humanAnimate!],
      [clash.root, clash.animate],
    ] as const) {
      const eye = actor.getObjectByName('face-eye-left')!
      const gaze = eye.getObjectByName('hisoka-gaze')!
      const hair = named(actor, 'manga-layered-hair')[0].children as THREE.Mesh[]
      const pendant = actor.getObjectByName('hisoka-pendant')!
      const layer = {
        motion: () => {
          eye.scale.y = 0.7
        },
      }
      animate(1.11, 'guard', layer)
      expect(eye.scale.y).toBeLessThan(0.09)
      expect(gaze.position.x).toBeGreaterThan(0.004)
      expect(hair[0].geometry.morphTargetsRelative).toBe(true)
      expect(hair[0].morphTargetInfluences![0]).not.toBe(0)
      expect(hair[0].morphTargetInfluences).toEqual(hair[1].morphTargetInfluences)
      const angle = pendant.rotation.z
      animate(1.5, 'guard')
      expect(eye.scale.y).toBe(0.7)
      expect(pendant.rotation.z).not.toBe(angle)
    }
    expect(clash.root.getObjectByName('manga-layered-hair')?.parent).toBe(mouth.parent)
  })

  it('keeps anonymous bodies and Morena’s separately authored face intact', () => {
    for (const identity of ['undeclared-guard', 'morena-prudo', 'kurapika']) {
      const model = buildHumanFigure({ THREE, glow, seen: seen(identity) })
      for (const name of DETAILS) expect(named(model.root, name)).toHaveLength(0)
    }
  })

  it('does not dispose the shared facial buffers when a passenger leaves the scene', () => {
    const first = buildHumanFigure({ THREE, glow, seen: seen('hisoka') })
    const second = buildHumanFigure({ THREE, glow, seen: seen('hisoka') })
    const geometry = named(first.root, DETAILS[0])[0].geometry
    expect(named(second.root, DETAILS[0])[0].geometry).toBe(geometry)
    const dispose = vi.spyOn(geometry, 'dispose')
    const portals = { drop: vi.fn() } as unknown as PortalRenderer
    const scene = new THREE.Scene()
    const view = new ApparitionView(scene, portals)
    view.add('first', { root: first.root, key: 'first' })
    view.add('second', { root: second.root, key: 'second' })
    view.drop('first')
    expect(dispose).not.toHaveBeenCalled()
    expect(scene.children).toContain(second.root)
    view.dispose()
    expect(dispose).not.toHaveBeenCalled()
    dispose.mockRestore()
  })
})
