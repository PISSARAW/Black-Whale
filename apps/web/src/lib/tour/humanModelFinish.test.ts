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
