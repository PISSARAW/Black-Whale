import * as THREE from 'three'
import { beginFight, createFight, performAttack, tickFight } from '../../src/lib/fighting/engine'
import { buildFightFigure } from '../../src/lib/fighting/fighterFigure'
import { fightFaceRig } from '../../src/lib/fighting/fightExpressionRig'
import { createKameoScene } from '../../src/lib/fighting/kameos/scene'
import { withKameos } from '../../src/lib/fighting/kameos/state'
import { EMPTY_INPUT, type FightInput, type FightState } from '../../src/lib/fighting/types'

document.body.style.cssText = 'margin:0;background:#f5f2eb;color:#24242b;font:14px system-ui'
const header = document.createElement('header')
header.style.cssText = 'padding:20px 28px 12px'
header.innerHTML =
  '<h1 style="margin:0 0 7px;font-size:25px">Tubeppa · animations et expressions</h1>' +
  '<p style="margin:0;color:#696770">Modèle du kaméo · articulations et expressions du roster · états issus du moteur</p>'
const labels = document.createElement('div')
labels.style.cssText = 'display:flex;height:30px;align-items:center;text-align:center;color:#696770'
document.body.append(header, labels)
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
renderer.setSize(1300, 660)
renderer.setClearColor(0xf5f2eb)
renderer.setScissorTest(true)
document.body.append(renderer.domElement)
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50)
const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({
    color,
    opacity,
    transparent: opacity < 1,
  })
function initial() {
  const state = beginFight(
    withKameos(
      createFight('kurapika', 'hisoka', {
        mode: 'versus-local',
      }),
      { player: 'tubeppa' },
    ),
  )
  return {
    ...state,
    player: { ...state.player, x: 20, health: 200 },
    opponent: { ...state.opponent, x: 70 },
  }
}
const tick = (state: FightState, input: FightInput = EMPTY_INPUT) =>
  tickFight(state, input, {
    dt: 1 / 60,
    opponentInput: EMPTY_INPUT,
    ai: false,
  })
const sequence: FightState[] = []
let state = tick(initial(), { ...EMPTY_INPUT, kameo: true })
for (let frame = 0; frame < 100; frame++) {
  sequence.push(state)
  state = tick(state)
}
let wounded = initial()
wounded.opponent.x = 34
wounded = performAttack(
  tick(wounded, { ...EMPTY_INPUT, kameo: true, right: true }),
  'opponent',
  'heavy',
)
for (let frame = 0; frame < 40 && wounded.kameos!.player!.fighter.hitStun === 0; frame++)
  wounded = tick(wounded)
if (!wounded.kameos!.player!.fighter.hitStun)
  throw new Error('Tubeppa did not receive the test strike')
const find = (phase: string, frame: number) =>
  sequence.find(
    (s) => s.kameos!.player!.phase === phase && s.kameos!.player!.phaseFrames === frame,
  )!
const samples = [
  { label: 'Concentration', state: find('entering', 0) },
  { label: 'Ajustement des lunettes', state: find('entering', 9) },
  { label: 'Soin · frame de déclenchement', state: find('acting', 12) },
  { label: 'Relâchement', state: find('acting', 35) },
  { label: 'Douleur · impact réel', state: wounded },
]
function actor() {
  const scene = new THREE.Scene()
  let model: ReturnType<typeof buildFightFigure>
  const kameos = createKameoScene({
    scene,
    worldX: () => 0,
    buildFighter: (fighter) => {
      model = buildFightFigure({ THREE, glow, fighter })
      return model
    },
  })
  return {
    scene,
    kameos,
    get model() {
      return model
    },
  }
}
const actors = samples.map(actor)
const film = actor()
function render(
  options: { scene: THREE.Scene; target: THREE.Vector3; range: number },
  viewport: { x: number; y: number; width: number; height: number },
) {
  const { target, range, scene } = options
  camera.top = range
  camera.bottom = -range
  camera.right = (range * viewport.width) / viewport.height
  camera.left = -camera.right
  camera.position.copy(target).add(new THREE.Vector3(0, 0, 8))
  camera.lookAt(target)
  camera.updateProjectionMatrix()
  renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height)
  renderer.setScissor(viewport.x, viewport.y, viewport.width, viewport.height)
  renderer.render(scene, camera)
}
function gallery() {
  renderer.setSize(1300, 660)
  labels.replaceChildren(
    ...samples.map(({ label }) => {
      const span = document.createElement('span')
      span.style.width = '260px'
      span.textContent = label
      return span
    }),
  )
  samples.forEach(({ state }, column) => {
    const actor = actors[column]
    actor.kameos.sync(state, state.frame / 60)
    // Diagnostic closeups keep a constant size; the film retains the production arrival scale.
    actor.model.root.scale.setScalar(1)
    actor.model.root.rotation.y = 0.3
    render(
      { scene: actor.scene, target: new THREE.Vector3(0, 1, 0), range: 1.15 },
      {
        x: column * 260,
        y: 230,
        width: 260,
        height: 430,
      },
    )
    const head = actor.model.root.getObjectByName('manga-head:prince-tubeppa')!
    const target = head.getWorldPosition(new THREE.Vector3())
    target.y -= 0.015
    render(
      { scene: actor.scene, target, range: 0.235 },
      {
        x: column * 260,
        y: 0,
        width: 260,
        height: 230,
      },
    )
  })
}
function movie(frame: number) {
  const state = sequence[Math.min(frame, sequence.length - 1)]
  const slot = state.kameos!.player!
  labels.textContent = `Appel réel · ${slot.phase} · frame ${slot.phaseFrames} · ralenti ×3`
  film.kameos.sync(state, frame / 60)
  renderer.setSize(1300, 660)
  render(
    { scene: film.scene, target: new THREE.Vector3(0, 1, 0), range: 1.17 },
    {
      x: 0,
      y: 0,
      width: 650,
      height: 660,
    },
  )
  const head = film.model.root.getObjectByName('manga-head:prince-tubeppa')!
  render(
    { scene: film.scene, target: head.getWorldPosition(new THREE.Vector3()), range: 0.3 },
    {
      x: 650,
      y: 0,
      width: 650,
      height: 660,
    },
  )
}
Object.assign(window, {
  tubeppaFixture: {
    gallery,
    movie,
    frameCount: sequence.length,
    report: () =>
      actors.map(({ model }, index) => ({
        label: samples[index].label,
        mode: fightFaceRig(model.root)?.mode,
        effort: fightFaceRig(model.root)?.pose?.effort,
        pain: fightFaceRig(model.root)?.pose?.pain,
      })),
  },
})
gallery()
