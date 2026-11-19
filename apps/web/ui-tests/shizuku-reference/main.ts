import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack, tickFight } from '$lib/fighting/engine'
import { buildFightFigure } from '$lib/fighting/fighterFigure'
import { fightBodyMotion } from '$lib/fighting/fightBodyMotion'
import { fightWorldX, fightWorldY } from '$lib/fighting/fightCoordinates'
import { createBlinkySuctionScene } from '$lib/fighting/blinkySuctionScene'
import { attackData } from '$lib/fighting/frameData'
import { moveForSlot } from '$lib/fighting/movesets'
import { disposeMountedVisitHatsu } from '$lib/fighting/visitHatsuModel'
import { EMPTY_INPUT, type FightSide, type FightState, type MoveSlot } from '$lib/fighting/types'

const slots: (MoveSlot | 'blood')[] = [
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'airLight',
  'airHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
  'neutralSpecial',
  'forwardSpecial',
  'downSpecial',
  'backSpecial',
  'finisher',
  'blood',
]
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('canvas')!,
  antialias: true,
})
renderer.setSize(1440, 460)
renderer.setPixelRatio(1)
renderer.setClearColor(0x111723)
const camera = new THREE.OrthographicCamera(-1.9, 1.9, 1.82, -1.82, 0.1, 25)
camera.position.set(0, 1.2, 7)
camera.lookAt(0, 1.2, 0)
const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
const panels = Array.from({ length: 3 }, () => {
  const scene = new THREE.Scene()
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x424553, 2.5))
  const lamp = new THREE.DirectionalLight(0xffeed9, 2.5)
  lamp.position.set(-2, 4, 5)
  scene.add(lamp)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 10),
    new THREE.MeshStandardMaterial({ color: 0x242a36 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.025
  scene.add(floor)
  return {
    scene,
    models: {} as Partial<Record<FightSide, ReturnType<typeof buildFightFigure>>>,
    effect: undefined as ReturnType<typeof createBlinkySuctionScene> | undefined,
  }
})
let selected: MoveSlot | 'blood' = 'forwardSpecial'
let facing: 1 | -1 = 1

function tick(s: FightState, frames: number): FightState {
  for (let i = 0; i < frames; i++)
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return s
}
function cast(s: FightState, slot: MoveSlot) {
  const move = moveForSlot('shizuku', slot)!
  return performAuraAttack({
    state: s,
    side: 'player',
    kind: move.kind,
    moveId: move.id,
    auraCharged: false,
  })
}
function snapshot(slot: MoveSlot | 'blood', phase: number) {
  let s = beginFight(createFight('shizuku', 'phinks', { mode: 'versus-local' }))
  const physical = slot !== 'blood' && moveForSlot('shizuku', slot)!.kind !== 'special'
  const gap = physical || slot === 'blood' || slot === 'finisher' ? 6 : 20
  s = {
    ...s,
    player: {
      ...s.player,
      x: 50 - (facing * gap) / 2,
      facing,
      aura: 100,
      health: s.player.maxHealth,
    },
    opponent: { ...s.opponent, x: 50 + (facing * gap) / 2, facing: facing === 1 ? -1 : 1 },
  }
  if (slot === 'blood' || slot === 'finisher') {
    s = tick(cast(s, 'standingLight'), 60)
    for (let i = 0; i < 12; i++)
      s = tickFight(
        s,
        { ...EMPTY_INPUT, left: facing === 1, right: facing === -1 },
        {
          dt: 1 / 60,
          opponentInput: EMPTY_INPUT,
        },
      )
  }
  if (slot === 'blood') {
    s = cast(s, 'finisher')
    if (!s.player.attack) throw new Error('Blood suction was refused')
    const data = attackData('special', s.player)
    return tick(s, [data.startup - 1, data.startup + 16, data.startup + 46][phase])
  }
  if (slot === 'backSpecial') {
    s.player.blinky = {
      target: 'bullet',
      lastObject: {
        id: 99,
        owner: 'opponent',
        fighterId: 'theta',
        x: 50,
        y: 6.1,
        velocityX: -50,
        shape: 'bullet',
        matter: 'object',
        colour: '#aaaaaa',
        width: 0.1,
        height: 0.1,
        damage: 10,
        hitstun: 10,
        blockstun: 5,
        hitstop: 3,
        knockback: 1,
        targetZone: 'torso',
        concealed: false,
        age: 0,
        lifetime: 120,
      },
    }
  }
  s = cast(s, slot)
  if (!s.player.attack) throw new Error(`Refused pose: ${slot}`)
  const data = attackData(s.player.attack.kind, s.player)
  const frame = [
    data.startup * 0.65,
    data.startup,
    data.startup + data.active + data.recovery * 0.65,
  ][phase]
  return {
    ...s,
    player: {
      ...s.player,
      y: slot.startsWith('air') ? 5 : 0,
      attack: { ...s.player.attack, frame },
    },
  }
}

function show(slot: MoveSlot | 'blood' = selected, direction: 1 | -1 = facing) {
  selected = slot
  facing = direction
  const audits = panels.map((panel, phase) => {
    panel.effect?.dispose()
    for (const model of Object.values(panel.models)) {
      disposeMountedVisitHatsu(model.root)
      model.root.removeFromParent()
    }
    panel.models = {}
    const state = snapshot(slot, phase)
    for (const side of ['player', 'opponent'] as const) {
      const fighter = state[side]
      const model = buildFightFigure({ THREE, glow, fighter })
      panel.models[side] = model
      model.root.position.set(fightWorldX(fighter.x), fightWorldY(fighter.y), 0)
      model.root.rotation.y = fighter.facing * 1.25
      panel.scene.add(model.root)
      model.animate(1, 'idle', {
        transitionSeconds: 0,
        motion: fightBodyMotion({ fighter, seconds: 1, progress: 0.5 }),
      })
    }
    panel.effect = createBlinkySuctionScene({
      THREE,
      scene: panel.scene,
      worldX: fightWorldX,
      worldY: fightWorldY,
      figureOf: (side) => panel.models[side]?.root,
    })
    panel.effect.sync(state, 1)
    renderer.setViewport(phase * 480, 0, 480, 460)
    renderer.setScissor(phase * 480, 0, 480, 460)
    renderer.setScissorTest(true)
    renderer.render(panel.scene, camera)
    const coordinates: number[] = []
    panel.scene.traverse((object) =>
      coordinates.push(...object.getWorldPosition(new THREE.Vector3()).toArray()),
    )
    return {
      phase,
      finite: coordinates.every(Number.isFinite),
      wounds: state.opponent.openWounds ?? 0,
      health: state.opponent.health,
    }
  })
  renderer.setScissorTest(false)
  const labels =
    slot === 'blood'
      ? ['Plaie ouverte', 'Aspiration', 'Aspiration maintenue']
      : ['Préparation', 'Phase active', 'Retour']
  document
    .querySelectorAll('#phases span')
    .forEach((label, index) => (label.textContent = labels[index]))
  document
    .querySelectorAll<HTMLButtonElement>('[data-slot]')
    .forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.slot === slot)))
  document.querySelector('#caption')!.textContent =
    slot === 'blood'
      ? 'Blessure réelle par Blinky, puis aspiration du sang par la plaie ouverte.'
      : `${moveForSlot('shizuku', slot)!.nameFr} · Adversaire d’essai : Phinks.`
  return { slot, facing, audits, glError: renderer.getContext().getError() }
}
for (const slot of slots) {
  const button = document.createElement('button')
  button.dataset.slot = slot
  button.textContent =
    slot === 'blood' ? 'Blesser puis aspirer' : moveForSlot('shizuku', slot)!.nameFr
  button.onclick = () => show(slot)
  document.querySelector('#moves')!.append(button)
}
const mirror = document.createElement('button')
mirror.textContent = 'Changer de côté'
mirror.onclick = () => show(selected, facing === 1 ? -1 : 1)
document.querySelector('#moves')!.append(mirror)
Object.assign(window, { shizukuReference: { show, slots } })
show()
