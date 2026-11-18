import * as THREE from 'three'
import { FIGHTING_ROSTER } from '$lib/fighting/roster'
import { createFightState } from '$lib/fighting/fightState'
import { performAuraAttack } from '$lib/fighting/engine'
import { applyAuraContext } from '$lib/fighting/nen'
import { focusNenZone } from '$lib/fighting/nenAdvanced'
import { fighterAuraHex } from '$lib/fighting/auraColours'
import { auraConcentration } from '$lib/fighting/nenConcentration'
import { createNenConcentrationScene } from '$lib/fighting/nenConcentrationScene'
import { fightBodyMotion } from '$lib/fighting/fightBodyMotion'
import { buildFightFigure } from '$lib/fighting/fighterFigure'
import { moveForSlot } from '$lib/fighting/movesets'
import { attackData } from '$lib/fighting/frameData'
import { EMPTY_INPUT, type FighterId, type FightState } from '$lib/fighting/types'

const canvas = document.querySelector('canvas')!
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
renderer.setSize(640, 480)
renderer.setPixelRatio(1)
renderer.setClearColor(0x101923)
const scene = new THREE.Scene()
scene.add(new THREE.HemisphereLight(0xf4f4ff, 0x303847, 2))
const light = new THREE.DirectionalLight(0xffeed9, 2)
light.position.set(-2, 4, 5)
scene.add(light)
const camera = new THREE.PerspectiveCamera(34, 640 / 480, 0.1, 20)
camera.position.set(0, 1.1, 4.6)
camera.lookAt(0, 0.95, 0)
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(6, 6),
  new THREE.MeshBasicMaterial({ color: 0x202c37 }),
)
floor.rotation.x = -Math.PI / 2
floor.position.y = -0.05
scene.add(floor)
const materials = new Map<number, THREE.MeshBasicMaterial>()
const glow = (color: number) => {
  if (!materials.has(color)) materials.set(color, new THREE.MeshBasicMaterial({ color }))
  return materials.get(color)!
}
let model: ReturnType<typeof buildFightFigure> | undefined
let effects: ReturnType<typeof createNenConcentrationScene> | undefined

async function show(id: FighterId, technique: 'ryu' | 'ko', facing: 1 | -1) {
  effects?.dispose()
  model?.root.removeFromParent()
  let state: FightState = { ...createFightState(id, 'chrollo'), phase: 'fighting' }
  state.player = { ...state.player, aura: 100, facing }
  model = buildFightFigure({ THREE, glow, fighter: state.player })
  scene.add(model.root)
  model.root.rotation.y = facing * 1.25
  effects = createNenConcentrationScene({
    THREE,
    scene,
    worldX: (x) => x,
    worldY: (y) => y,
    figureOf: (side) => (side === 'player' ? model?.turns : undefined),
  })
  draw(state, 0)
  const lightMove = moveForSlot(id, 'standingLight')!
  const initial = performAuraAttack({
    state,
    side: 'player',
    kind: lightMove.kind,
    moveId: lightMove.id,
    auraCharged: false,
  })
  initial.player.attack!.frame = attackData(lightMove.kind, initial.player).startup
  draw(initial, 1)
  const heavy = moveForSlot(id, 'standingHeavy')!
  state.player = focusNenZone(state.player, heavy.tuning.auraZone)
  state = performAuraAttack({
    state,
    side: 'player',
    kind: heavy.kind,
    moveId: heavy.id,
    auraCharged: technique === 'ko',
  })
  if (technique === 'ko') state.player = applyAuraContext(state.player, EMPTY_INPUT)
  const frames = attackData(heavy.kind, state.player)
  const fluxColours: number[] = []
  for (let frame = 0; frame <= frames.startup; frame++) {
    state = {
      ...state,
      frame: frame + 2,
      player: { ...state.player, attack: { ...state.player.attack!, frame } },
    }
    draw(state, (frame + 2) / 60)
    fluxColours.push(...readFluxColours())
  }
  const expected = fighterAuraHex(id)
  const skins: Array<{ colour: number; share: number }> = []
  model.root.traverse((node) => {
    if (!node.name.startsWith('nen-concentration:') || !node.visible) return
    const mesh = node as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>
    skins.push({
      colour: mesh.material.uniforms.u_colour.value.getHex(),
      share: mesh.material.uniforms.u_share.value,
    })
  })
  const points: number[] = []
  model.root.traverse((node) => {
    points.push(...node.getWorldPosition(new THREE.Vector3()).toArray())
  })
  return {
    id,
    technique,
    facing,
    expected,
    skins,
    fluxColours,
    allocation: auraConcentration(state.player),
    finite: points.every(Number.isFinite),
    glError: renderer.getContext().getError(),
    programs: renderer.info.programs?.length,
  }
}

function draw(state: FightState, seconds: number) {
  model!.animate(seconds, 'idle', {
    transitionSeconds: 0,
    motion: fightBodyMotion({ fighter: state.player, seconds, progress: 0 }),
  })
  effects!.sync(state)
  renderer.render(scene, camera)
}

function readFluxColours() {
  return scene.children
    .filter((node) => node.name === 'nen-redistribution-flow' && node.visible)
    .map((node) =>
      (node as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>).material.color.getHex(),
    )
}

Object.assign(window, { rosterMotion: { ids: FIGHTING_ROSTER.map((f) => f.id), show } })
document.body.style.cssText = 'margin:0;background:#101923;overflow:hidden'
