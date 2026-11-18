import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack, tickFight } from '$lib/fighting/engine'
import { bodyPlan, fightBodyMotion } from '$lib/fighting/fightBodyMotion'
import { buildFightFigure } from '$lib/fighting/fighterFigure'
import { moveForSlot } from '$lib/fighting/movesets'
import { attackData } from '$lib/fighting/frameData'
import { STILL_MOTION } from '$lib/fighting/fighterMovement'
import { styleMobility } from '$lib/fighting/styleMobility'
import { disposeMountedVisitHatsu } from '$lib/fighting/visitHatsuModel'
import { physicalJoints, physicalViolations } from '$lib/fighting/physicalAuditTestKit'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { EMPTY_INPUT, type FightState, type MoveSlot } from '$lib/fighting/types'

type Phase = 'idle' | 'strike' | 'advance' | 'retreat' | 'dash' | 'backdash'
interface Shot {
  phase: Phase
  frame?: number
  facing?: 1 | -1
  slot?: MoveSlot
  confiscated?: boolean
  projected?: boolean
}
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('canvas')!,
  antialias: true,
  preserveDrawingBuffer: true,
})
renderer.setSize(960, 640)
renderer.setPixelRatio(1)
renderer.setClearColor(0x14202c)
const scene = new THREE.Scene()
scene.add(new THREE.HemisphereLight(0xf3f4ff, 0x33445c, 2.4))
const camera = new THREE.OrthographicCamera(-2.5, 2.5, 1.67, -1.67, 0.1, 20)
camera.position.set(0, 1.15, 6)
camera.lookAt(0, 1.15, 0)
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 12),
  new THREE.MeshBasicMaterial({ color: 0x223545 }),
)
floor.rotation.x = -Math.PI / 2
floor.position.y = -0.03
scene.add(floor)
const materials = new Map<number, THREE.MeshBasicMaterial>()
const glow = (color: number) => {
  if (!materials.has(color)) materials.set(color, new THREE.MeshBasicMaterial({ color }))
  return materials.get(color)!
}
let model: ReturnType<typeof buildFightFigure> | undefined

function ready(options: Shot): FightState {
  const state = beginFight(
    createFight('hanzo', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  const facing = options.facing ?? 1
  return {
    ...state,
    player: { ...state.player, x: 50, facing },
    opponent: { ...state.opponent, x: facing === 1 ? 85 : 15 },
  }
}

function poseState(options: Shot): FightState {
  const { phase, frame = 0, slot = 'standingLight' } = options
  let state = ready(options)
  state.player = { ...state.player, weaponsConfiscated: Boolean(options.confiscated) }
  if (options.projected) {
    state = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: 'hanzo:neutralSpecial',
      auraCharged: false,
    })
    for (let frame = 0; frame < 24; frame++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
  }
  if (phase === 'strike') {
    const move = moveForSlot('hanzo', slot)!
    if (move.variant === 'air') state.player = { ...state.player, y: 5 }
    state = performAuraAttack({
      state,
      side: 'player',
      kind: move.kind,
      moveId: move.id,
      variant: move.variant,
      auraCharged: false,
    })
    if (!state.player.attack) throw Error(`Hanzo move did not start: ${move.id}`)
    state.player = { ...state.player, attack: { ...state.player.attack, frame } }
  }
  if (!['idle', 'strike'].includes(phase)) state.player = moving(state.player, options)
  return state
}

function moving(fighter: FightState['player'], options: Shot): FightState['player'] {
  const { phase, frame = 0 } = options
  const backwards = phase === 'retreat' || phase === 'backdash'
  const direction = (backwards ? -fighter.facing : fighter.facing) as 1 | -1
  const mobility = styleMobility(fighter)
  const dash = backwards ? mobility.backDash : mobility.forwardDash
  return {
    ...fighter,
    x: 50 + direction * frame * 0.5,
    pose: 'walk',
    motion: {
      ...STILL_MOTION,
      heldDirection: direction,
      dash: ['dash', 'backdash'].includes(phase)
        ? { ...dash, direction, frame: Math.min(frame, dash.frames - 1) }
        : null,
    },
  }
}

function show(options: Shot) {
  if (model) {
    disposeMountedVisitHatsu(model.root)
    model.root.removeFromParent()
  }
  const state = poseState(options),
    fighter = state.player,
    seconds = (options.frame ?? 0) / 60
  model = buildFightFigure({ THREE, glow, fighter })
  model.root.rotation.y = fighter.facing * 1.25
  model.root.position.y = fighter.y > 0 ? 0.75 : 0
  scene.add(model.root)
  model.animate(seconds, 'idle', {
    transitionSeconds: 0,
    motion: fightBodyMotion({ fighter, seconds, progress: 0 }),
  })
  renderer.render(scene, camera)
  const points: number[] = []
  model.root.traverse((node) =>
    points.push(...node.getWorldPosition(new THREE.Vector3()).toArray()),
  )
  const human = humanAnimationRig(model.turns)!
  const feet = human.knees.map((knee) => new THREE.Box3().setFromObject(knee.children[1]).min.y)
  const move = fighter.attack?.moveId ? moveForSlot('hanzo', options.slot ?? 'standingLight') : null
  document.querySelector('#caption')!.textContent =
    move?.nameFr ??
    {
      idle: 'Posture calme',
      advance: 'Approche mesurée',
      retreat: 'Retrait · main ouverte',
      dash: 'Accélération courte',
      backdash: 'Recul court',
      strike: 'Corps-à-corps',
    }[options.phase]
  const blade = model.root.getObjectByName('hanzo-hidden-blade')!
  const slide = blade.getObjectByName('hanzo-blade-slide')!
  const tip = blade.getObjectByName('hanzo-blade-tip')!
  const wrist = model.root.getObjectByName('hand-right')!.getWorldPosition(new THREE.Vector3())
  return {
    ...options,
    blade: {
      parent: blade.parent?.name,
      visible: blade.visible,
      deployed: slide.visible,
      extension: blade.userData.extension,
      ahead: (tip.getWorldPosition(new THREE.Vector3()).x - wrist.x) * fighter.facing,
    },
    plan: bodyPlan(fighter, { seconds, progress: 0 })?.key,
    timing: fighter.attack ? attackData(fighter.attack.kind, fighter) : undefined,
    finite: points.every(Number.isFinite),
    violations: physicalViolations(physicalJoints(model.root)),
    grounded: fighter.y === 0,
    lowestFoot: Math.min(...feet),
    glError: renderer.getContext().getError(),
    moveId: fighter.attack?.moveId,
  }
}
Object.assign(window, { hanzoCombat: { show } })
show({ phase: 'idle' })
