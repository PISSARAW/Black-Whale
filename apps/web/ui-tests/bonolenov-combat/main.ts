import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack, tickFight } from '$lib/fighting/engine'
import { BATTLE_MOVES } from '$lib/fighting/battleCantabileTypes'
import { bodyPlan, fightBodyMotion } from '$lib/fighting/fightBodyMotion'
import { buildFightFigure } from '$lib/fighting/fighterFigure'
import { moveForSlot } from '$lib/fighting/movesets'
import { attackData } from '$lib/fighting/frameData'
import { STILL_MOTION } from '$lib/fighting/fighterMovement'
import { styleMobility } from '$lib/fighting/styleMobility'
import { disposeMountedVisitHatsu } from '$lib/fighting/visitHatsuModel'
import { EMPTY_INPUT, type FightState, type MoveSlot } from '$lib/fighting/types'
import { unwrapBonolenovInstrument } from '$lib/fighting/bonolenovInstrument'
import { renderBodyMusic } from './audio'

type Phase = 'idle' | 'dance' | 'ready' | 'spear' | 'step' | 'pivot' | 'normal'
export interface Shot {
  phase: Phase
  frame?: number
  facing?: 1 | -1
  slot?: MoveSlot
}
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('canvas')!,
  antialias: true,
  preserveDrawingBuffer: true,
})
renderer.setSize(900, 600)
renderer.setPixelRatio(1)
renderer.setClearColor(0x14202c)
const scene = new THREE.Scene()
scene.add(new THREE.HemisphereLight(0xf3f4ff, 0x33445c, 2.4))
const sun = new THREE.DirectionalLight(0xffe7c7, 2.3)
sun.position.set(-3, 5, 4)
scene.add(sun)
const camera = new THREE.OrthographicCamera(-2.7, 2.7, 1.8, -1.8, 0.1, 20)
camera.position.set(0, 1.1, 6)
camera.lookAt(0, 1.1, 0)
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 12),
  new THREE.MeshStandardMaterial({ color: 0x223545 }),
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
let latestState: FightState

function step(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function cast(state: FightState, moveId: string): FightState {
  return performAuraAttack({ state, side: 'player', kind: 'special', moveId, auraCharged: false })
}

function show(options: Shot) {
  if (model) {
    disposeMountedVisitHatsu(model.root)
    model.root.removeFromParent()
  }
  const { phase, frame = 0, facing = 1, slot = 'standingLight' } = options
  let state = beginFight(
    createFight('bonolenov', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  state = {
    ...state,
    player: { ...state.player, x: 50, aura: 100 },
    opponent: { ...state.opponent, x: facing === 1 ? 85 : 15 },
  }
  if (['dance', 'ready', 'spear'].includes(phase)) state = cast(state, BATTLE_MOVES.prologue)
  if (phase === 'dance') state = step(state, Math.min(59, frame))
  if (phase === 'ready' || phase === 'spear') state = step(state, 60)
  if (phase === 'spear') state = cast(state, BATTLE_MOVES.spear)
  if (phase === 'normal') {
    const move = moveForSlot('bonolenov', slot)!
    state = performAuraAttack({
      state,
      side: 'player',
      kind: move.kind,
      moveId: move.id,
      auraCharged: false,
    })
    if (move.variant === 'air') state.player.y = 5
  }
  if (state.player.attack)
    state.player = { ...state.player, attack: { ...state.player.attack, frame } }
  if (phase === 'step' || phase === 'pivot') {
    const mobility = styleMobility(state.player)
    state.player = {
      ...state.player,
      x: 50 + frame * 0.5,
      pose: 'walk',
      motion: {
        ...STILL_MOTION,
        heldDirection: phase === 'pivot' ? (-facing as 1 | -1) : facing,
        dash:
          phase === 'pivot'
            ? {
                ...mobility.backDash,
                direction: -facing as 1 | -1,
                frame: Math.min(frame, mobility.backDash.frames - 1),
              }
            : null,
      },
    }
  }
  const fighter = unwrapBonolenovInstrument({ ...state.player, facing })
  latestState = { ...state, player: fighter }
  model = buildFightFigure({ THREE, glow, fighter })
  model.root.rotation.y = facing * 1.25
  scene.add(model.root)
  const seconds = state.frame / 60
  model.animate(seconds, 'idle', {
    transitionSeconds: 0,
    motion: fightBodyMotion({ fighter, seconds, progress: 0 }),
  })
  renderer.render(scene, camera)
  const points: number[] = []
  model.root.traverse((node) =>
    points.push(...node.getWorldPosition(new THREE.Vector3()).toArray()),
  )
  const timing = fighter.attack ? attackData(fighter.attack.kind, fighter) : undefined
  const labels: Record<Phase, string> = {
    idle: 'Repos',
    dance: 'Préparation musicale · appuis alternés et rotations',
    ready: 'Prologue · posture armée',
    spear: 'Prologue · estoc de la main droite',
    step: 'Déplacement · pas dansés',
    pivot: 'Recul · pivot sur les appuis',
    normal: 'Frappes adaptées au duel · rotations et équilibre',
  }
  document.querySelector('#caption')!.textContent = labels[phase]
  return {
    ...options,
    frame,
    facing,
    plan: bodyPlan(fighter, { seconds, progress: 0 })?.key,
    timing,
    finite: points.every(Number.isFinite),
    glError: renderer.getContext().getError(),
  }
}

Object.assign(window, {
  bonolenovCombat: {
    show,
    renderAudio: (shots: Shot[], fps = 30) =>
      renderBodyMusic(
        (shot) => {
          show(shot)
          return latestState
        },
        shots,
        fps,
      ),
  },
})
show({ phase: 'idle' })
