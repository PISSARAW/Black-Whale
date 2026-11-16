import * as THREE from 'three'
import { buildFightFigure } from '../../src/lib/fighting/fighterFigure'
import { createFightState } from '../../src/lib/fighting/fightState'
import { fightBodyMotion } from '../../src/lib/fighting/fightBodyMotion'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import type { FighterId, MoveSlot } from '../../src/lib/fighting/types'

const ids: FighterId[] = ['kurapika', 'hisoka', 'chrollo', 'benjamin']
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
]
document.body.style.cssText = 'margin:0;background:#101923;color:#e8edf7;font:16px system-ui'
const title = document.createElement('h1')
title.style.cssText = 'margin:12px 24px;font-size:22px'
document.body.append(title)
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(1440, slots.length * 180)
renderer.setScissorTest(true)
renderer.setClearColor(0x101923)
document.body.append(renderer.domElement)
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-1.5, 1.5, 1.5, -1.5, 0.1, 50)
camera.position.set(0, 1.05, 12)
camera.lookAt(0, 1.05, 0)
const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
const models = slots.flatMap((slot) =>
  ids.map((id) => {
    const fighter = createFightState(id, 'hisoka').player
    const model = buildFightFigure({ THREE, glow, fighter })
    scene.add(model.root)
    model.root.visible = false
    return { id, slot, model, fighter }
  }),
)
let tick = 0
function show(phase: 'startup' | 'active' | 'recovery' = 'active', facing: 1 | -1 = 1) {
  tick += 2
  title.textContent = `Kurapika · Hisoka · Chrollo · Benjamin — ${phase} — face ${facing}`
  models.forEach(({ id, slot, model, fighter }, i) => {
    const move = moveForSlot(id, slot)!
    const f = move.tuning
    const frame =
      phase === 'startup'
        ? Math.floor(f.startup * 0.65)
        : phase === 'active'
          ? f.startup
          : f.startup + f.active + Math.floor(f.recovery * 0.45)
    const current = {
      ...fighter,
      facing,
      y: move.variant === 'air' ? 1 : 0,
      pose: move.kind,
      crouching: move.variant === 'low',
      attack: {
        moveId: move.id,
        variant: move.variant,
        kind: move.kind,
        frame,
        impacted: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: null,
        projectileSpawned: false,
        reversal: false,
      },
    }
    model.root.visible = true
    model.root.rotation.y = facing * 1.25
    model.animate(tick, 'idle', {
      motion: fightBodyMotion({ fighter: current, seconds: tick, progress: 0 }),
    })
    model.animate(tick + 1, 'idle', {
      motion: fightBodyMotion({ fighter: current, seconds: tick + 1, progress: 0 }),
    })
    const col = i % 4
    const row = Math.floor(i / 4)
    renderer.setViewport(col * 360, (slots.length - 1 - row) * 180, 360, 180)
    renderer.setScissor(col * 360, (slots.length - 1 - row) * 180, 360, 180)
    camera.left = -2.4
    camera.right = 2.4
    camera.top = 1.2
    camera.bottom = -1.2
    camera.updateProjectionMatrix()
    renderer.render(scene, camera)
    model.root.visible = false
  })
}
show()
Object.assign(window, { fightMotionFixture: { show, count: models.length } })
