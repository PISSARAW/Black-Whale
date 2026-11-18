import * as THREE from 'three'
import { buildFightFigure } from '../../src/lib/fighting/fighterFigure'
import { createFightState } from '../../src/lib/fighting/fightState'
import { fightBodyMotion } from '../../src/lib/fighting/fightBodyMotion'
import { createFeitanBladeScene } from '../../src/lib/fighting/feitanBladeScene'
import { styleMobility } from '../../src/lib/fighting/styleMobility'
import { STILL_MOTION } from '../../src/lib/fighting/fighterMovement'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import type { ArcadeFighter, MoveSlot } from '../../src/lib/fighting/types'

const slots: MoveSlot[] = [
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'airLight',
  'airHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
  'forwardSpecial',
  'downSpecial',
  'backSpecial',
]
const movement = ['Avance basse', 'Dash avant', 'Retrait', 'Bond']
document.body.style.cssText = 'margin:0;background:#11131c;color:#ecedf4;font:14px system-ui'
const header = document.createElement('header')
header.style.cssText = 'height:92px;padding:16px 28px;box-sizing:border-box'
header.innerHTML =
  '<h1 style="margin:0;font-size:24px">FEITAN / FEITAN CONTRE ZAZAN</h1><p style="margin:8px 0;color:#c4a5bc">Parapluie · Lame dissimulée · Accélérations basses · Bonds</p>'
document.body.append(header)
const title = document.createElement('div')
title.style.cssText = 'padding:0 28px 14px;color:#8f9cb3'
document.body.append(title)
const width = 1440,
  cellWidth = 360,
  cellHeight = 260,
  rows = 4
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(width, rows * cellHeight)
renderer.setScissorTest(true)
renderer.setClearColor(0x11131c)
const board = document.createElement('div')
board.style.cssText = `position:relative;width:${width}px`
board.append(renderer.domElement)
document.body.append(board)
const scene = new THREE.Scene()
scene.add(new THREE.HemisphereLight(0xeaf0ff, 0x574253, 2.4))
const key = new THREE.DirectionalLight(0xffffff, 2)
key.position.set(-3, 4, 6)
scene.add(key)
const camera = new THREE.OrthographicCamera(-1.65, 1.65, 1.2, -1.2, 0.1, 50)
camera.position.set(0, 0.95, 12)
camera.lookAt(0, 0.95, 0)
const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
const base = createFightState('feitan', 'hisoka')
const models = [...slots, ...movement].map((slot, index) => {
  const model = buildFightFigure({ THREE, glow, fighter: base.player })
  scene.add(model.root)
  model.root.visible = false
  const effects = createFeitanBladeScene({
    THREE,
    scene,
    worldX: (x) => x,
    worldY: (y) => y,
    figureOf: () => model.turns,
  })
  const label = document.createElement('div')
  label.style.cssText = `position:absolute;left:${(index % 4) * cellWidth + 18}px;top:${Math.floor(index / 4) * cellHeight + 8}px;color:#e4d4e2`
  label.textContent = moveForSlot('feitan', slot as MoveSlot)?.nameFr ?? slot
  board.append(label)
  return { slot, model, effects }
})

let clock = 0
let audit: unknown[] = []
function show(phase: 'startup' | 'active' | 'recovery' = 'active', facing: 1 | -1 = 1) {
  clock += 2
  audit = []
  title.textContent = `Gestes de production · ${phase} · orientation ${facing}`
  models.forEach(({ slot, model, effects }, index) => {
    const current = poseFor(slot, { phase, facing })
    model.root.visible = true
    model.root.rotation.y = facing * 1.25
    for (const seconds of [clock, clock + 1])
      model.animate(seconds, 'idle', {
        motion: fightBodyMotion({ fighter: current, seconds, progress: 0.5 }),
      })
    effects.sync({ ...base, phase: 'fighting', player: current }, clock)
    renderer.setViewport(
      (index % 4) * cellWidth,
      (rows - 1 - Math.floor(index / 4)) * cellHeight,
      cellWidth,
      cellHeight,
    )
    renderer.setScissor(
      (index % 4) * cellWidth,
      (rows - 1 - Math.floor(index / 4)) * cellHeight,
      cellWidth,
      cellHeight,
    )
    renderer.render(scene, camera)
    const hand = model.turns.getObjectByName('hand-left')!
    const sword = model.turns.getObjectByName('feitan-blade:player')!
    audit.push({
      slot,
      facing,
      hand: hand.getWorldPosition(new THREE.Vector3()).toArray(),
      tip: sword.localToWorld(new THREE.Vector3(0, -0.95, 0)).toArray(),
      shoulder: model.turns.getObjectByName('shoulder-left')?.rotation.toArray(),
      elbow: model.turns.getObjectByName('elbow-left')?.rotation.toArray(),
      wrist: hand.rotation.toArray(),
    })
    model.root.visible = false
  })
}

function poseFor(slot: string, options: { phase: string; facing: 1 | -1 }): ArcadeFighter {
  const move = moveForSlot('feitan', slot as MoveSlot)
  const fighter = { ...base.player, facing: options.facing }
  if (!move) return movementPose(fighter, slot)
  const f = move.tuning
  const frame =
    options.phase === 'startup'
      ? f.startup * 0.65
      : options.phase === 'active'
        ? f.startup
        : f.startup + f.active + f.recovery * 0.45
  return {
    ...fighter,
    pose: move.kind,
    y: move.variant === 'air' ? 1 : 0,
    crouching: move.variant === 'low',
    attack: {
      moveId: move.id,
      kind: move.kind,
      variant: move.variant,
      frame,
      impacted: false,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: false,
      reversal: false,
    },
  }
}

function movementPose(fighter: ArcadeFighter, slot: string): ArcadeFighter {
  if (slot === 'Bond') return { ...fighter, pose: 'jump', y: 4, velocityY: 10 }
  const forward = slot !== 'Retrait'
  const direction = (forward ? fighter.facing : -fighter.facing) as 1 | -1
  const profile = forward ? styleMobility(fighter).forwardDash : styleMobility(fighter).backDash
  return {
    ...fighter,
    pose: 'walk',
    motion: {
      ...STILL_MOTION,
      heldDirection: direction,
      dash:
        slot === 'Avance basse' ? null : { direction, ...profile, frame: profile.frames * 0.24 },
    },
  }
}

show()
Object.assign(window, {
  feitanCombatFixture: { show, count: models.length, diagnostics: () => audit },
})
