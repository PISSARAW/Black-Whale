import * as THREE from 'three'
import { FIGHTING_ROSTER } from '$lib/fighting/roster'
import { createFightState } from '$lib/fighting/fightState'
import { performAuraAttack, tickFight } from '$lib/fighting/engine'
import { focusNenZone } from '$lib/fighting/nenAdvanced'
import { fighterAuraHex } from '$lib/fighting/auraColours'
import { createNenConcentrationScene } from '$lib/fighting/nenConcentrationScene'
import { createFightReactionPresentation } from '$lib/fighting/fightReactionPresentation'
import { createFightContactAlignment } from '$lib/fighting/fightContactAlignment'
import { coreBoxes } from '$lib/fighting/fightBodySeparation'
import { fightBodyMotion } from '$lib/fighting/fightBodyMotion'
import { fightGroundContact } from '$lib/fighting/fightGroundContact'
import { buildFightFigure, fightFigureKey } from '$lib/fighting/fighterFigure'
import { createPresentedModelRefresh } from '$lib/fighting/refreshPresentedModel'
import { moveForSlot } from '$lib/fighting/movesets'
import { canStartFighterAttack } from '$lib/fighting/fighterAttacks'
import { fightReplayHash } from '$lib/fighting/fightReplayHash'
import { EMPTY_INPUT, type FighterId, type FightState } from '$lib/fighting/types'

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('canvas')!,
  antialias: true,
  preserveDrawingBuffer: true,
})
renderer.setSize(800, 600)
renderer.setPixelRatio(1)
renderer.setClearColor(0x101923)
const scene = new THREE.Scene()
scene.add(new THREE.HemisphereLight(0xf4f4ff, 0x303847, 2))
const light = new THREE.DirectionalLight(0xffeed9, 2)
light.position.set(-2, 4, 5)
scene.add(light)
const camera = new THREE.PerspectiveCamera(36, 800 / 600, 0.1, 30)
camera.position.set(0, 1.7, 5.7)
camera.lookAt(0, 1.05, 0)
const materials = new Map<number, THREE.MeshBasicMaterial>()
function glow(color: number) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshBasicMaterial({ color }))
  return materials.get(color)!
}
let dispose = () => {}

function show(id: FighterId, technique: 'ryu' | 'ko', facing: 1 | -1) {
  dispose()
  const ids = FIGHTING_ROSTER.map((f) => f.id),
    opponent = ids[(ids.indexOf(id) + 13) % ids.length]
  let state: FightState = {
    ...createFightState(id, opponent, { mode: 'versus-local', formatId: 'knockout' }),
    phase: 'fighting',
  }
  state = {
    ...state,
    player: { ...state.player, x: facing === 1 ? 44 : 50, facing },
    opponent: { ...state.opponent, x: facing === 1 ? 50 : 44, facing: facing === 1 ? -1 : 1 },
  }
  const make = (fighter: FightState['player']) => buildFightFigure({ THREE, glow, fighter })
  const models = {
    player: { model: make(state.player), nen: fightFigureKey(state.player) },
    opponent: { model: make(state.opponent), nen: fightFigureKey(state.opponent) },
  }
  scene.add(models.player.model.root, models.opponent.model.root)
  const refresh = createPresentedModelRefresh({
    scene,
    models,
    nenKey: fightFigureKey,
    buildFighter: make,
  })
  const read = createFightReactionPresentation()
  const align = createFightContactAlignment((side) => models[side].model.turns)
  const effects = createNenConcentrationScene({
    THREE,
    scene,
    worldX: (x) => x,
    worldY: (y) => y,
    figureOf: (side) => models[side].model.turns,
  })
  const colours: number[] = [],
    flows: number[] = [],
    reactions: number[] = []
  let overlap = 0,
    finite = true,
    unchanged = true,
    rebuilds = 0,
    sequence = 0,
    hits = 0,
    heavyStarted = false,
    koFrames = 0
  const expected = fighterAuraHex(id)
  const lightMove = moveForSlot(id, 'standingLight')!,
    heavy = moveForSlot(id, 'standingHeavy')!
  function draw() {
    const hash = fightReplayHash(state)
    for (const side of ['player', 'opponent'] as const) {
      const before = models[side].model
      const model = refresh(side, state[side])
      if (model !== before) rebuilds++
      model.root.position.set((state[side].x - 47) * 0.115, state[side].y * 0.12, 0)
      model.root.rotation.y = state[side].facing * 1.25
      const context = read(state, side, { fighter: state[side], seconds: state.frame / 60 })
      if (context.physicalHit && state[side].pose === 'hit')
        reactions.push(context.physicalHit.sequence)
      model.animate(state.frame / 60, 'idle', {
        transitionSeconds: 0,
        motion: fightBodyMotion({ fighter: state[side], ...context, seconds: state.frame / 60 }),
        afterMotion: fightGroundContact(state[side]),
      })
    }
    align(state)
    effects.sync(state)
    renderer.render(scene, camera)
    const a = models.player.model,
      b = models.opponent.model
    const [left, right] = a.root.position.x <= b.root.position.x ? [a, b] : [b, a]
    for (const x of coreBoxes(left.turns))
      for (const y of coreBoxes(right.turns))
        if (Math.min(x.max.y, y.max.y) - Math.max(x.min.y, y.min.y) > 0.01)
          overlap = Math.max(overlap, x.max.x - y.min.x)
    a.root.traverse((node) => {
      finite = finite && node.getWorldPosition(new THREE.Vector3()).toArray().every(Number.isFinite)
      if (node.visible && node.name.startsWith('nen-concentration:'))
        colours.push(
          (
            node as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>
          ).material.uniforms.u_colour.value.getHex(),
        )
    })
    scene.children
      .filter((node) => node.visible && node.name === 'nen-redistribution-flow')
      .forEach((node) =>
        flows.push(
          (
            node as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
          ).material.color.getHex(),
        ),
      )
    unchanged = unchanged && fightReplayHash(state) === hash
  }
  draw()
  for (let frame = 0; frame < 110; frame++) {
    if (frame === 8) {
      state.player = focusNenZone(state.player, 'hands')
      state = performAuraAttack({
        state,
        side: 'player',
        kind: lightMove.kind,
        moveId: lightMove.id,
        auraCharged: false,
      })
    }
    if (hits >= 1 && !heavyStarted && canStartFighterAttack(state.player, heavy.kind, heavy.id)) {
      state.player = focusNenZone(state.player, heavy.tuning.auraZone)
      state = performAuraAttack({
        state,
        side: 'player',
        kind: heavy.kind,
        moveId: heavy.id,
        auraCharged: technique === 'ko',
      })
      heavyStarted = state.player.attack?.moveId === heavy.id
    }
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    if (state.player.nen.ko) koFrames++
    if (state.impact && state.impact.sequence !== sequence) {
      sequence = state.impact.sequence
      if (state.impact.attacker === 'player' && !state.impact.blocked) hits++
    }
    draw()
    if (hits >= 2 && state.hitstop === 0) break
  }
  dispose = () => {
    effects.dispose()
    scene.remove(models.player.model.root, models.opponent.model.root)
  }
  return {
    id,
    opponent,
    technique,
    facing,
    expected,
    colours: [...new Set(colours)],
    flowColours: [...new Set(flows)],
    hits,
    reactions: [...new Set(reactions)].length,
    overlap,
    finite,
    unchanged,
    rebuilds,
    koFrames,
    glError: renderer.getContext().getError(),
  }
}
Object.assign(window, { physicalRoster: { show, ids: FIGHTING_ROSTER.map((f) => f.id) } })
