import * as THREE from 'three'
import { buildFightFigure } from '../../src/lib/fighting/fighterFigure'
import { createFightState } from '../../src/lib/fighting/fightState'
import { fightBodyMotion } from '../../src/lib/fighting/fightBodyMotion'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import { FIGHTING_ROSTER } from '../../src/lib/fighting/roster'
import { humanAnimationRig } from '../../src/lib/tour/humanAnimation'
import { fightRigOf } from '../../src/lib/fighting/fightRig'
import {
  captureFightMotionSnapshot,
  goldenHeavyDiagnostics,
  type GoldenHeavyDiagnostics,
} from '../../src/lib/fighting/fightMotionDiagnostics'
import { KURAPIKA_GOLDEN_HEAVY } from '../../src/lib/fighting/kurapikaGoldenHeavy'
import type { FighterId, MoveSlot } from '../../src/lib/fighting/types'
import {
  clampMotionFrame,
  phaseAtFrame,
  representativeFrame,
  totalMoveFrames,
  type MotionPhase,
} from './motionLab'

const ids: FighterId[] = FIGHTING_ROSTER.map(({ id }) => id)
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
  <output name="diagnostics" aria-live="polite"></output>
`
document.body.append(controls)
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(1080, 540)
renderer.setScissorTest(true)
renderer.setClearColor(0x101923)
document.body.append(renderer.domElement)
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-1.5, 1.5, 1.5, -1.5, 0.1, 50)
camera.position.set(0, 1.05, 12)
camera.lookAt(0, 1.05, 0)
const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
type MotionModel = ReturnType<typeof buildFightFigure>
interface MotionEntry {
  id: FighterId
  slot: MoveSlot
  model: MotionModel
  fighter: ReturnType<typeof createFightState>['player']
}
const models = new Map<string, MotionEntry>()
function modelFor(id: FighterId, slot: MoveSlot): MotionEntry {
  const key = `${id}:${slot}`
  const held = models.get(key)
  if (held) return held
  const fighter = createFightState(id, id === 'hisoka' ? 'kurapika' : 'hisoka').player
  const model = buildFightFigure({ THREE, glow, fighter })
  scene.add(model.root)
  model.root.visible = false
  const made = { id, slot, model, fighter }
  models.set(key, made)
  return made
}
let tick = 0
let inspected: { id: FighterId; slot: MoveSlot; frame: number; facing: 1 | -1 } | null = null
function poseFighter(entry: MotionEntry, frame: number, facing: 1 | -1): void {
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

function show(
  phase: MotionPhase = 'active',
  facing: 1 | -1 = 1,
  id: FighterId = (fighterSelect?.value as FighterId) || ids[0],
) {
  inspected = null
  tick += 2
  title.textContent = `${id} — 9 attacks — ${phase} — face ${facing}`
  renderer.setSize(1080, 540)
  slots.forEach((slot, i) => {
    const entry = modelFor(id, slot)
    const { model } = entry
    const move = moveForSlot(id, slot)!
    poseFighter(entry, representativeFrame(phase, move.tuning), facing)
    const col = i % 3
    const row = Math.floor(i / 3)
    renderer.setViewport(col * 360, (2 - row) * 180, 360, 180)
    renderer.setScissor(col * 360, (2 - row) * 180, 360, 180)
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
  const entry = modelFor(id, slot)
  const move = moveForSlot(id, slot)!
  const currentFrame = clampMotionFrame(frame, move.tuning)
  inspected = { id, slot, frame: currentFrame, facing }
  tick += 2
  title.textContent = `${id} · ${slot} · frame ${currentFrame} · ${phaseAtFrame(currentFrame, move.tuning)}`
  renderer.setSize(720, 720)
  models.forEach(({ model }) => (model.root.visible = false))
  const diagnostics = goldenDiagnostics(entry, currentFrame, facing)
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
    diagnostics,
  }
}

function goldenDiagnostics(
  entry: MotionEntry,
  frame: number,
  facing: 1 | -1,
): GoldenHeavyDiagnostics | null {
  if (entry.id !== 'kurapika' || entry.slot !== KURAPIKA_GOLDEN_HEAVY.slot) {
    poseFighter(entry, frame, facing)
    return null
  }
  const human = humanAnimationRig(entry.model.turns)
  if (!human) throw new Error('Kurapika motion lab figure has no animation rig')
  const rig = fightRigOf(human)
  poseFighter(entry, 0, facing)
  const stance = captureFightMotionSnapshot(rig, facing)
  poseFighter(entry, KURAPIKA_GOLDEN_HEAVY.frames.startup, facing)
  const contact = captureFightMotionSnapshot(rig, facing)
  poseFighter(entry, frame, facing)
  return goldenHeavyDiagnostics(captureFightMotionSnapshot(rig, facing), stance, contact, facing)
}

const fields = controls.elements as typeof controls.elements & {
  namedItem(
    name:
      'fighter' | 'slot' | 'phase' | 'facing' | 'frame' | 'frameOutput' | 'readout' | 'diagnostics',
  ): HTMLInputElement | HTMLSelectElement | HTMLOutputElement
}
const fighterSelect = fields.namedItem('fighter') as HTMLSelectElement
const slotSelect = fields.namedItem('slot') as HTMLSelectElement
const phaseSelect = fields.namedItem('phase') as HTMLSelectElement
const facingSelect = fields.namedItem('facing') as HTMLSelectElement
const frameInput = fields.namedItem('frame') as HTMLInputElement
const frameOutput = fields.namedItem('frameOutput') as HTMLOutputElement
const readout = fields.namedItem('readout') as HTMLOutputElement
const diagnosticOutput = fields.namedItem('diagnostics') as HTMLOutputElement
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
  diagnosticOutput.value = result.diagnostics
    ? `plant ${(result.diagnostics.plantedFootDrift * 100).toFixed(1)}cm · pivot ${(result.diagnostics.pivotFootDrift * 100).toFixed(1)}cm · fist ${(result.diagnostics.fistToContact * 100).toFixed(1)}cm`
    : ''
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
    show(
      phaseSelect.value as MotionPhase,
      Number(facingSelect.value) as 1 | -1,
      fighterSelect.value as FighterId,
    ),
  )
show()
Object.assign(window, {
  fightMotionFixture: {
    show,
    inspect,
    current: () => inspected,
    count: ids.length * slots.length,
    ids,
    slots,
    renderedCount: () => models.size,
  },
})
