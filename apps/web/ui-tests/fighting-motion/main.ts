import * as THREE from 'three'
import { buildFightFigure } from '../../src/lib/fighting/fighterFigure'
import { createFightState } from '../../src/lib/fighting/fightState'
import { fightBodyMotion } from '../../src/lib/fighting/fightBodyMotion'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import type { FighterId, MoveSlot } from '../../src/lib/fighting/types'
import {
  clampMotionFrame,
  phaseAtFrame,
  representativeFrame,
  totalMoveFrames,
  type MotionPhase,
} from './motionLab'

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
const controls = document.createElement('form')
controls.setAttribute('aria-label', 'Motion laboratory controls')
controls.style.cssText =
  'position:sticky;top:0;z-index:2;display:flex;gap:12px;align-items:end;flex-wrap:wrap;padding:12px 24px;background:#101923;border-bottom:1px solid #314153'
controls.innerHTML = `
  <label>Fighter <select name="fighter"></select></label>
  <label>Move <select name="slot"></select></label>
  <label>Phase <select name="phase"><option>startup</option><option>active</option><option>recovery</option></select></label>
  <label>Facing <select name="facing"><option value="1">right</option><option value="-1">left</option></select></label>
  <label style="min-width:280px">Frame <output name="frameOutput">0</output>
    <input name="frame" type="range" min="0" value="0" step="1" style="width:260px" />
  </label>
  <button name="previous" type="button">Previous frame</button>
  <button name="next" type="button">Next frame</button>
  <button name="grid" type="button">Review grid</button>
  <output name="readout" aria-live="polite"></output>
`
document.body.append(controls)
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
let inspected: { id: FighterId; slot: MoveSlot; frame: number; facing: 1 | -1 } | null = null
function poseFighter(entry: (typeof models)[number], frame: number, facing: 1 | -1): void {
  const { id, slot, model, fighter } = entry
  const move = moveForSlot(id, slot)!
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
      frame: clampMotionFrame(frame, move.tuning),
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
}

function show(phase: MotionPhase = 'active', facing: 1 | -1 = 1) {
  inspected = null
  tick += 2
  title.textContent = `Kurapika · Hisoka · Chrollo · Benjamin — ${phase} — face ${facing}`
  renderer.setSize(1440, slots.length * 180)
  models.forEach((entry, i) => {
    const { id, slot, model } = entry
    const move = moveForSlot(id, slot)!
    poseFighter(entry, representativeFrame(phase, move.tuning), facing)
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

function inspect(id: FighterId, slot: MoveSlot, frame = 0, facing: 1 | -1 = 1) {
  const entry = models.find((candidate) => candidate.id === id && candidate.slot === slot)
  if (!entry) throw new Error(`Unknown motion ${id}:${slot}`)
  const move = moveForSlot(id, slot)!
  const currentFrame = clampMotionFrame(frame, move.tuning)
  inspected = { id, slot, frame: currentFrame, facing }
  tick += 2
  title.textContent = `${id} · ${slot} · frame ${currentFrame} · ${phaseAtFrame(currentFrame, move.tuning)}`
  renderer.setSize(720, 720)
  models.forEach(({ model }) => (model.root.visible = false))
  poseFighter(entry, currentFrame, facing)
  renderer.setViewport(0, 0, 720, 720)
  renderer.setScissor(0, 0, 720, 720)
  camera.left = -1.5
  camera.right = 1.5
  camera.top = 1.5
  camera.bottom = -1.5
  camera.updateProjectionMatrix()
  renderer.render(scene, camera)
  entry.model.root.visible = false
  return {
    frame: currentFrame,
    phase: phaseAtFrame(currentFrame, move.tuning),
    frames: move.tuning,
  }
}

const fields = controls.elements as typeof controls.elements & {
  namedItem(
    name: 'fighter' | 'slot' | 'phase' | 'facing' | 'frame' | 'frameOutput' | 'readout',
  ): HTMLInputElement | HTMLSelectElement | HTMLOutputElement
}
const fighterSelect = fields.namedItem('fighter') as HTMLSelectElement
const slotSelect = fields.namedItem('slot') as HTMLSelectElement
const phaseSelect = fields.namedItem('phase') as HTMLSelectElement
const facingSelect = fields.namedItem('facing') as HTMLSelectElement
const frameInput = fields.namedItem('frame') as HTMLInputElement
const frameOutput = fields.namedItem('frameOutput') as HTMLOutputElement
const readout = fields.namedItem('readout') as HTMLOutputElement
fighterSelect.innerHTML = ids.map((id) => `<option value="${id}">${id}</option>`).join('')
slotSelect.innerHTML = slots.map((slot) => `<option value="${slot}">${slot}</option>`).join('')

function syncScrubber(useRepresentative = false): void {
  const id = fighterSelect.value as FighterId
  const slot = slotSelect.value as MoveSlot
  const move = moveForSlot(id, slot)!
  if (useRepresentative)
    frameInput.value = String(representativeFrame(phaseSelect.value as MotionPhase, move.tuning))
  frameInput.max = String(totalMoveFrames(move.tuning) - 1)
  const result = inspect(id, slot, Number(frameInput.value), Number(facingSelect.value) as 1 | -1)
  frameInput.value = String(result.frame)
  frameOutput.value = `${result.frame} / ${totalMoveFrames(move.tuning) - 1}`
  readout.value = `${result.phase} · ${move.tuning.startup}f startup · ${move.tuning.active}f active · ${move.tuning.recovery}f recovery`
}

fighterSelect.addEventListener('change', () => syncScrubber(true))
slotSelect.addEventListener('change', () => syncScrubber(true))
phaseSelect.addEventListener('change', () => syncScrubber(true))
facingSelect.addEventListener('change', () => syncScrubber())
frameInput.addEventListener('input', () => syncScrubber())
controls.elements.namedItem('previous')?.addEventListener('click', () => {
  frameInput.value = String(Number(frameInput.value) - 1)
  syncScrubber()
})
controls.elements.namedItem('next')?.addEventListener('click', () => {
  frameInput.value = String(Number(frameInput.value) + 1)
  syncScrubber()
})
controls.elements
  .namedItem('grid')
  ?.addEventListener('click', () =>
    show(phaseSelect.value as MotionPhase, Number(facingSelect.value) as 1 | -1),
  )
show()
Object.assign(window, {
  fightMotionFixture: {
    show,
    inspect,
    current: () => inspected,
    count: models.length,
  },
})
