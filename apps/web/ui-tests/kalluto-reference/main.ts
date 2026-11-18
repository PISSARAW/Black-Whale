import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack, tickFight } from '$lib/fighting/engine'
import { buildFightFigure } from '$lib/fighting/fighterFigure'
import { fightBodyMotion } from '$lib/fighting/fightBodyMotion'
import { createKallutoPaperScene } from '$lib/fighting/kallutoScene'
import { attackData, attackProgress } from '$lib/fighting/frameData'
import { fightWorldX, fightWorldY } from '$lib/fighting/fightCoordinates'
import { disposeMountedVisitHatsu } from '$lib/fighting/visitHatsuModel'
import { EMPTY_INPUT, type FightState, type FightSide } from '$lib/fighting/types'

type Case = 'idle' | 'fan' | 'scatter' | 'serpent'
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('canvas')!,
  antialias: true,
})
renderer.setSize(1120, 450)
renderer.setPixelRatio(1)
renderer.setClearColor(0x111723)
const scene = new THREE.Scene()
scene.add(new THREE.HemisphereLight(0xf2e6ff, 0x393747, 2.5))
const light = new THREE.DirectionalLight(0xffeed9, 2.5)
light.position.set(-2, 4, 5)
scene.add(light)
const camera = new THREE.OrthographicCamera(-4.1, 4.1, 1.65, -1.65, 0.1, 30)
camera.position.set(0, 0.95, 8)
camera.lookAt(0, 0.95, 0)
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 12),
  new THREE.MeshStandardMaterial({ color: 0x242333 }),
)
floor.rotation.x = -Math.PI / 2
floor.position.y = -0.025
scene.add(floor)
const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
let models: Partial<Record<FightSide, ReturnType<typeof buildFightFigure>>> = {}
let effect: ReturnType<typeof createKallutoPaperScene> | undefined
let selected: Case = 'serpent'
let facing: 1 | -1 = 1

function advance(state: FightState, frames: number) {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function cast(state: FightState, slot: string) {
  return performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    moveId: `kalluto:${slot}`,
    auraCharged: false,
  })
}
function snapshot(kind: Case): FightState {
  const start = beginFight(createFight('kalluto', 'hisoka', { mode: 'versus-local' }))
  let state: FightState = {
    ...start,
    player: { ...start.player, x: facing === 1 ? 30 : 70, facing, aura: 100 },
    opponent: { ...start.opponent, x: facing === 1 ? 62 : 38, facing: facing === 1 ? -1 : 1 },
  }
  if (kind === 'idle') return state
  if (kind === 'fan') {
    state = performAuraAttack({ state, side: 'player', kind: 'light', auraCharged: false })
    return {
      ...state,
      player: {
        ...state.player,
        attack: { ...state.player.attack!, frame: attackData('light', state.player).startup },
      },
    }
  }
  state = cast(state, 'neutralSpecial')
  if (kind === 'scatter') return advance(state, 26)
  state = advance(state, 65)
  return advance(cast(state, 'forwardSpecial'), 24)
}
function show(kind: Case = selected, direction: 1 | -1 = facing) {
  selected = kind
  facing = direction
  effect?.dispose()
  for (const model of Object.values(models)) {
    disposeMountedVisitHatsu(model.root)
    model.root.removeFromParent()
  }
  models = {}
  const state = snapshot(kind)
  const worldX = fightWorldX
  const worldY = fightWorldY
  for (const side of ['player', 'opponent'] as const) {
    const fighter = state[side]
    const model = buildFightFigure({ THREE, glow, fighter })
    models[side] = model
    model.root.position.set(worldX(fighter.x), worldY(fighter.y), 0)
    model.root.rotation.y = fighter.facing * 1.25
    scene.add(model.root)
    model.animate(state.frame / 60, 'idle', {
      transitionSeconds: 0,
      motion: fightBodyMotion({
        fighter,
        seconds: state.frame / 60,
        progress: attackProgress(fighter),
      }),
    })
  }
  effect = createKallutoPaperScene({
    THREE,
    scene,
    worldX,
    worldY,
    figureOf: (side) => models[side]?.root,
  })
  effect.sync(state, state.frame / 60)
  renderer.render(scene, camera)
  document
    .querySelectorAll<HTMLButtonElement>('[data-case]')
    .forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.case === kind)))
  document.querySelector('#caption')!.textContent =
    `Papier matériel · ${state.projectiles.length} trajectoire(s) · Marques sur la cible : ${state.opponent.plantedPaper?.map((p) => p.zone).join(', ') || 'aucune'}`
  const positions: number[] = []
  scene.traverse((object) =>
    positions.push(...object.getWorldPosition(new THREE.Vector3()).toArray()),
  )
  return {
    kind,
    facing,
    finite: positions.every(Number.isFinite),
    glError: renderer.getContext().getError(),
    shots: state.projectiles.length,
    marked: Boolean(state.opponent.plantedPaper?.length),
  }
}
document
  .querySelectorAll<HTMLButtonElement>('[data-case]')
  .forEach((button) => button.addEventListener('click', () => show(button.dataset.case as Case)))
document
  .querySelector('#facing')!
  .addEventListener('click', () => show(selected, facing === 1 ? -1 : 1))
Object.assign(window, { kallutoReference: { show } })
show()
