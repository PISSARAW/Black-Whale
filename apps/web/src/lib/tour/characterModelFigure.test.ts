import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createFightState } from '$lib/fighting/fightState'
import { buildFightFigure } from '$lib/fighting/fighterFigure'
import { preloadCharacterModels, cachedCharacterModel } from './characterModelLoader'
import { humanAnimationRig } from './humanAnimation'

const STATIC = fileURLToPath(new URL('../../../static', import.meta.url))
const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })

beforeAll(async () => {
  // Node has no page origin: serve `static/` the way the browser would.
  const Base = globalThis.Request
  vi.stubGlobal(
    'Request',
    class extends Base {
      constructor(url: string, init?: RequestInit) {
        super(new URL(url, 'http://glb.test'), init)
      }
    },
  )
  vi.stubGlobal('self', globalThis)
  vi.stubGlobal(
    'ProgressEvent',
    class extends Event {
      constructor(type: string, init: Record<string, unknown> = {}) {
        super(type)
        Object.assign(this, init)
      }
    },
  )
  vi.stubGlobal('fetch', async (input: Request | string) => {
    const path = new URL(typeof input === 'string' ? input : input.url).pathname
    return new Response(readFileSync(`${STATIC}${path}`))
  })
  vi.spyOn(console, 'error').mockImplementation(() => undefined) // textures need a DOM
  await preloadCharacterModels(THREE, ['feitan-portor'])
})

afterAll(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function feitan() {
  return buildFightFigure({ THREE, glow, fighter: createFightState('feitan', 'hisoka').player })
}

const world = (node: THREE.Object3D) => node.getWorldPosition(new THREE.Vector3())

describe('Feitan wears his GLB over the procedural skeleton', () => {
  it('caches one source and hands out independent skeletons', () => {
    const cached = cachedCharacterModel('feitan-portor')
    expect(cached?.clips.map((clip) => clip.name)).toContain('Walking')
    const a = feitan().root.getObjectByName('character-model:feitan-portor')!
    const b = feitan().root.getObjectByName('character-model:feitan-portor')!
    expect(a.getObjectByName('Hips')).not.toBe(b.getObjectByName('Hips'))
  })

  it('keeps every combat attach and takes only the body out of the camera', () => {
    const model = feitan()
    for (const name of ['hand-left', 'hand-right', 'knee-left', 'knee-right', 'torso'])
      expect(model.root.getObjectByName(name), name).toBeTruthy()
    const rig = humanAnimationRig(model.turns)!
    expect(rig.torso.children.some((node) => (node as THREE.Mesh).isMesh)).toBe(true)
    const hiddenBody = rig.legs[0].children.find((node) => node.type === 'Group')!
    hiddenBody.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) expect(node.layers.mask).toBe(0)
    })
    const glb = model.root.getObjectByName('character-model:feitan-portor')!
    expect((glb.getObjectByName('nen-skin-ten') as THREE.SkinnedMesh)?.isSkinnedMesh).toBe(true)
  })

  it('stands on the floor at the procedural height', () => {
    const model = feitan()
    model.root.updateMatrixWorld(true)
    const glb = model.root.getObjectByName('character-model:feitan-portor')!
    const box = new THREE.Box3().setFromObject(humanAnimationRig(model.turns)!.head)
    const head = world(glb.getObjectByName('head_end')!)
    expect(Math.abs(head.y - box.max.y)).toBeLessThan(0.12)
  })

  it('lays each limb along the procedural limb as the combat poses it', () => {
    const model = feitan()
    const rig = humanAnimationRig(model.turns)!
    model.root.rotation.y = Math.PI / 2
    rig.arms[0].rotation.set(-1.4, 0, 0.3) // a jab
    rig.arms[0].children[1].rotation.x = -0.6
    rig.legs[1].rotation.x = -1.1 // a knee
    rig.knees[1].rotation.x = 1.3
    model.root.updateMatrixWorld(true)
    const glb = model.root.getObjectByName('character-model:feitan-portor')!
    const pairs: Array<[string, string, THREE.Object3D, THREE.Object3D]> = []
    for (const index of [0, 1]) {
      const arm = rig.arms[index]
      const elbow = arm.children[1]
      const meshySide = Math.sign(model.turns.worldToLocal(world(arm)).x) > 0 ? 'Left' : 'Right'
      pairs.push([`${meshySide}Arm`, `${meshySide}ForeArm`, arm, elbow])
      pairs.push([`${meshySide}UpLeg`, `${meshySide}Leg`, rig.legs[index], rig.knees[index]])
    }
    for (const [bone, tip, from, to] of pairs) {
      const glbDirection = world(glb.getObjectByName(tip)!)
        .sub(world(glb.getObjectByName(bone)!))
        .normalize()
      const driven = world(to).sub(world(from)).normalize()
      expect(glbDirection.angleTo(driven), bone).toBeLessThan(0.02)
    }
  })

  it('leaves an identity without a GLB entirely procedural', () => {
    const hisoka = buildFightFigure({
      THREE,
      glow,
      fighter: createFightState('hisoka', 'feitan').player,
    })
    expect(hisoka.root.getObjectByName('character-model:hisoka')).toBeUndefined()
    hisoka.root.traverse((node) => expect(node.layers.mask).not.toBe(0))
  })
})
