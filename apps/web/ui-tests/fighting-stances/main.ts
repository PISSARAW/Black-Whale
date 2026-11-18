import * as THREE from 'three'
import { FIGHTING_ROSTER } from '$lib/fighting/roster'
import { createFightState } from '$lib/fighting/fightState'
import { buildFightFigure } from '$lib/fighting/fighterFigure'
import { bodyPlan, fightBodyMotion } from '$lib/fighting/fightBodyMotion'
import { disposeMountedVisitHatsu } from '$lib/fighting/visitHatsuModel'
import type { FighterId } from '$lib/fighting/types'

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('canvas')!,
  antialias: true,
  preserveDrawingBuffer: true,
})
renderer.setSize(420, 520)
renderer.setPixelRatio(1)
renderer.setClearColor(0x17212d)
const scene = new THREE.Scene()
scene.add(new THREE.HemisphereLight(0xf4f4ff, 0x414b60, 2.5))
const light = new THREE.DirectionalLight(0xffeed9, 2.5)
light.position.set(-2, 4, 5)
scene.add(light)
const camera = new THREE.OrthographicCamera(-1.3, 1.3, 1.7, -1.52, 0.1, 20)
camera.position.set(0, 1.1, 6)
camera.lookAt(0, 1.1, 0)
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x253343 }),
)
floor.rotation.x = -Math.PI / 2
floor.position.y = -0.025
scene.add(floor)
const materials = new Map<number, THREE.MeshBasicMaterial>()
const glow = (colour: number) => {
  if (!materials.has(colour)) materials.set(colour, new THREE.MeshBasicMaterial({ color: colour }))
  return materials.get(colour)!
}
let model: ReturnType<typeof buildFightFigure> | undefined

function show(
  id: FighterId,
  facing: 1 | -1 = 1,
  options: { seconds?: number; view?: 'combat' | 'front' } = {},
) {
  const { seconds = 0, view = 'combat' } = options
  if (model) {
    disposeMountedVisitHatsu(model.root)
    model.root.removeFromParent()
  }
  const state = createFightState(id, id === 'hisoka' ? 'kurapika' : 'hisoka')
  const fighter = { ...state.player, facing }
  model = buildFightFigure({ THREE, glow, fighter })
  scene.add(model.root)
  model.root.rotation.y = view === 'front' ? 0 : facing * 1.25
  model.animate(seconds, 'idle', {
    transitionSeconds: 0,
    motion: fightBodyMotion({ fighter, seconds, progress: 0 }),
  })
  renderer.render(scene, camera)
  const coordinates: number[] = []
  model.root.traverse((node) => {
    coordinates.push(...node.getWorldPosition(new THREE.Vector3()).toArray())
  })
  const bounds = new THREE.Box3().setFromObject(model.root)
  const feet = ['knee-left', 'knee-right'].map((name) =>
    model!.root.getObjectByName(name)!.children[1].getWorldPosition(new THREE.Vector3()).toArray(),
  )
  return {
    id,
    facing,
    seconds,
    view,
    feet,
    finite: coordinates.every(Number.isFinite),
    glError: renderer.getContext().getError(),
    bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
    plan: bodyPlan(fighter, { seconds })?.key,
  }
}

Object.assign(window, {
  stanceGallery: { roster: FIGHTING_ROSTER.map(({ id, name }) => ({ id, name })), show },
})
document.body.style.cssText = 'margin:0;background:#17212d;overflow:hidden'
show('kurapika')
