import {
  beginFight,
  createFight,
  performAuraAttack,
  tickFight,
} from '../../src/lib/fighting/engine'
import { canStartFighterAttack } from '../../src/lib/fighting/fighterAttacks'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import { performArsenalCommand } from '../../src/lib/fighting/retrospectiveArsenal'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type MoveSlot,
} from '../../src/lib/fighting/types'

const ROUTES: readonly MoveSlot[][] = [
  ['standingLight', 'standingHeavy', 'forwardLight', 'backHeavy', 'forwardSpecial'],
  ['lowLight', 'standingHeavy', 'forwardLight', 'backHeavy', 'lowHeavy'],
  ['standingLight', 'forwardLight', 'forwardHeavy'],
  ['lowLight', 'standingHeavy', 'downSpecial'],
  ['standingLight', 'standingHeavy', 'backSpecial'],
]

function fresh(ai = false): FightState {
  const initial = beginFight(
    createFight(ai ? 'hisoka' : 'feitan', ai ? 'feitan' : 'hisoka', {
      mode: ai ? 'versus-ai' : 'versus-local',
      formatId: 'knockout',
      environment: { stageId: 'heavens-arena' },
    }),
  )
  return {
    ...initial,
    player: { ...initial.player, x: ai ? 38 : 32, health: 600, maxHealth: 600 },
    opponent: { ...initial.opponent, x: ai ? 62 : 72, health: 600, maxHealth: 600 },
  }
}

export function createFeitanDemo() {
  let state = fresh()
  let frame = 0,
    route = 0,
    step = 0,
    cooldown = 0
  const moves = new Set<string>()
  let hits = 0,
    jumps = 0,
    dashes = 0
  let feintShown = false,
    umbrellaCounterShown = false,
    umbrellaFrames = 0

  function attack(side: FightSide, slot: MoveSlot) {
    const move = moveForSlot(state[side].id, slot)!
    if (!canStartFighterAttack(state[side], move.kind, move.id)) return false
    const next = performAuraAttack({
      state,
      side,
      kind: move.kind,
      variant: move.variant,
      moveId: move.id,
      auraCharged: false,
    })
    const accepted = next[side].attack !== state[side].attack
    state = next
    return accepted
  }

  function sparringCommands() {
    if (cooldown > 0) {
      cooldown--
      return
    }
    if (state.opponent.knockdownFrames || Math.abs(state.player.x - state.opponent.x) > 10) return
    const slots = ROUTES[route % ROUTES.length]
    if (!attack('player', slots[step])) return
    step++
    if (step < slots.length) return
    step = 0
    route++
    cooldown = 32
  }

  function enterTakes() {
    if (frame === 480) {
      state = fresh()
      state = {
        ...state,
        player: { ...state.player, x: 45 },
        opponent: { ...state.opponent, x: 61 },
      }
      step = 0
      cooldown = 0
    }
    if (frame === 840) state = fresh(true)
  }

  function umbrellaCommands() {
    if (!feintShown) {
      state = performArsenalCommand(state, 'player', { action: 'umbrella-feint' })
      feintShown = Boolean(state.player.umbrellaFeintFrames)
    }
    if (frame >= 496 && !umbrellaCounterShown)
      umbrellaCounterShown = attack('player', 'forwardSpecial')
  }

  function airCommands() {
    if (frame === 168) attack('player', 'airLight')
    if (frame === 190) attack('player', 'airHeavy')
  }

  function enemyCommands() {
    if (umbrellaTake(frame)) return
    if (frame >= 300 && frame < 840 && frame % 144 === 0) attack('opponent', 'standingHeavy')
    if (frame >= 840 && frame % 94 === 0) attack('player', 'standingHeavy')
  }

  function applyCommands() {
    enterTakes()
    airCommands()
    if (umbrellaTake(frame)) umbrellaCommands()
    else if (frame >= 240 && frame < 840) sparringCommands()
    enemyCommands()
  }

  function record(before: number | undefined) {
    const feitan = frame >= 840 ? state.opponent : state.player
    if (feitan.attack?.moveId) moves.add(feitan.attack.moveId)
    if (state.impact?.sequence !== before && state.impact && !state.impact.blocked) hits++
    if (feitan.y > 0) jumps++
    if (feitan.motion?.dash) dashes++
    if (feitan.umbrellaFeintFrames) umbrellaFrames++
  }

  function advance() {
    applyCommands()
    const input = frame < 240 ? movementInput(frame) : duelInput(state, frame)
    const before = state.impact?.sequence
    state = tickFight(state, input, {
      dt: 1 / 60,
      ai: frame >= 840,
      ...(frame < 840 ? { opponentInput: enemyInput(state, frame) } : {}),
    })
    record(before)
    frame++
    return { state, frame, title: titleFor(frame) }
  }

  return {
    initial: state,
    advance,
    diagnostics: () => ({
      frame,
      moves: [...moves],
      hits,
      airborneFrames: jumps,
      dashFrames: dashes,
      umbrellaFrames,
      umbrellaCounterShown,
      phase: state.phase,
    }),
  }
}

function movementInput(frame: number): FightInput {
  if (frame >= 145 && frame < 155) return { ...EMPTY_INPUT, down: true }
  if (frame >= 30 && frame < 66) return { ...EMPTY_INPUT, right: true }
  if (frame >= 66 && frame < 84) return { ...EMPTY_INPUT, left: true }
  if (frame === 88 || (frame >= 90 && frame < 106)) return { ...EMPTY_INPUT, right: true }
  if (frame === 116 || (frame >= 118 && frame < 132)) return { ...EMPTY_INPUT, left: true }
  if (frame >= 136 && frame < 152) return { ...EMPTY_INPUT, right: true }
  if (frame === 155) return { ...EMPTY_INPUT, jump: true }
  return EMPTY_INPUT
}

function duelInput(state: FightState, frame: number): FightInput {
  if (umbrellaTake(frame)) return EMPTY_INPUT
  const player = state.player,
    enemy = state.opponent
  const gap = Math.abs(player.x - enemy.x)
  if (frame < 840) return gap > 8 ? toward(player.x, enemy.x) : EMPTY_INPUT
  if (frame % 160 > 105 && gap < 16) return { ...EMPTY_INPUT, guard: true }
  return gap > 10 ? toward(player.x, enemy.x) : EMPTY_INPUT
}

function enemyInput(state: FightState, frame: number): FightInput {
  if (frame < 240 || umbrellaTake(frame) || state.opponent.knockdownFrames) return EMPTY_INPUT
  if (frame % 180 > 135) return { ...EMPTY_INPUT, guard: true }
  return Math.abs(state.player.x - state.opponent.x) > 10
    ? toward(state.opponent.x, state.player.x)
    : EMPTY_INPUT
}

function toward(x: number, target: number): FightInput {
  return { ...EMPTY_INPUT, left: target < x, right: target > x }
}

function titleFor(frame: number): string {
  if (frame < 240) return '1 / Approches basses, dash, retrait et bond'
  if (umbrellaTake(frame)) return '3 / Ouverture du parapluie et lame dissimulée'
  return frame < 840 ? '2 / Échanges au sabre et au parapluie' : '4 / Feitan piloté par l’IA'
}

function umbrellaTake(frame: number): boolean {
  return frame >= 480 && frame < 660
}
