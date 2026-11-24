import {
  beginFight,
  createFight,
  performAttack,
  performAuraAttack,
  tickFight,
} from '../../src/lib/fighting/engine'
import { canStartFighterAttack } from '../../src/lib/fighting/fighterAttacks'
import type { CinematicFrame } from '../../src/lib/fighting/cinematicTrack'
import { fightWorldX } from '../../src/lib/fighting/fightCoordinates'
import { toggleEmperorTime } from '../../src/lib/fighting/kurapikaActions'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type MoveSlot,
} from '../../src/lib/fighting/types'

function fresh(distance = 10): FightState {
  const initial = beginFight(
    createFight('kurapika', 'mizaistom', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { stageId: 'banquet-hall' },
    }),
  )
  return {
    ...initial,
    player: { ...initial.player, x: 50 - distance / 2, health: 600, maxHealth: 600 },
    opponent: { ...initial.opponent, x: 50 + distance / 2, health: 600, maxHealth: 600 },
  }
}

export function createKurapikaVideoDemo() {
  let state = fresh(10)
  let frame = 0
  const moves = new Set<string>()
  let dashFrames = 0,
    blockedFrames = 0,
    pistolFrames = 0,
    chainFrames = 0,
    emperorFrames = 0,
    hits = 0

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

  function reset(distance: number) {
    state = fresh(distance)
  }

  function scriptedCommands() {
    if (frame === 240) reset(9)
    if (frame === 270) attack('player', 'standingLight')
    if (frame === 310) attack('player', 'standingHeavy')
    if (frame === 356) attack('player', 'forwardHeavy')
    if (frame === 410) attack('player', 'airHeavy')

    if (frame === 480) reset(12)
    if (frame === 515) state = performAttack(state, 'player', 'ranged')
    if (frame === 585) attack('player', 'forwardSpecial')
    if (frame === 660) attack('player', 'downSpecial')

    if (frame === 720) {
      reset(7)
      state = toggleEmperorTime(state, 'player')
    }
    if (frame === 760) attack('player', 'backSpecial')
    if (frame === 850) attack('player', 'forwardSpecial')
    if (frame === 930) attack('player', 'standingHeavy')
    if (frame === 990) attack('player', 'forwardLight')
    if (frame === 1045) attack('opponent', 'standingHeavy')
    if (frame === 1105) attack('player', 'standingHeavy')
    if (frame === 1165) attack('player', 'airHeavy')
    if (frame === 1225) attack('opponent', 'forwardHeavy')
    if (frame === 1285) attack('player', 'forwardSpecial')
    if (frame === 1360) attack('player', 'forwardHeavy')
  }

  function opponentCommands() {
    if (frame === 154) attack('opponent', 'standingHeavy')
    if (frame > 960 && frame % 130 === 0) attack('opponent', 'standingHeavy')
  }

  function record(previousImpact: number | undefined) {
    if (state.player.attack?.moveId) moves.add(state.player.attack.moveId)
    if (state.player.motion?.dash) dashFrames++
    if (state.player.blockStun > 0) blockedFrames++
    if (state.player.attack?.kind === 'ranged') pistolFrames++
    if (state.player.attack?.kind === 'special') chainFrames++
    if (state.player.kurapika?.emperorTime) emperorFrames++
    if (state.impact?.sequence !== previousImpact && state.impact) hits++
  }

  function advance() {
    scriptedCommands()
    opponentCommands()
    const previousImpact = state.impact?.sequence
    state = tickFight(state, playerInput(state, frame), {
      dt: 1 / 60,
      opponentInput: opponentInput(state, frame),
    })
    record(previousImpact)
    frame++
    return { state, frame, ...copy(frame) }
  }

  return {
    initial: state,
    advance,
    diagnostics: () => ({
      frame,
      moves: [...moves],
      dashFrames,
      blockedFrames,
      pistolFrames,
      chainFrames,
      emperorFrames,
      hits,
      chainJailTargetEligible: false,
      phase: state.phase,
    }),
  }
}

export function cinematicFrame(state: FightState, frame: number): CinematicFrame {
  const player = fightWorldX(state.player.x)
  const opponent = fightWorldX(state.opponent.x)
  const centre = (player + opponent) / 2
  if (frame < 110) return { x: centre, lookY: 1.18, z: 4.55, intensity: 0.4, yaw: -0.035 }
  if (frame < 205)
    return {
      x: player * 0.78 + centre * 0.22,
      lookY: 1.28,
      z: 3.35,
      intensity: 1,
      yaw: -0.1,
    }
  if (frame < 240) return { x: centre, lookY: 1.2, z: 3.65, intensity: 1, yaw: 0.08 }
  if (frame < 480)
    return {
      x: centre,
      lookY: state.player.y > 0 ? 1.48 : 1.18,
      z: frame > 390 ? 3.7 : 3.95,
      intensity: 0.9,
      yaw: frame > 330 ? -0.07 : 0.05,
    }
  if (frame < 615)
    return {
      x: player * 0.65 + centre * 0.35,
      lookY: 1.25,
      z: 3.55,
      intensity: 1,
      yaw: -0.12,
    }
  if (frame < 720) return { x: centre, lookY: 1.2, z: 3.75, intensity: 0.9, yaw: 0.06 }
  if (frame < 790)
    return {
      x: player * 0.82 + centre * 0.18,
      lookY: 1.36,
      z: 3.2,
      intensity: 1,
      yaw: -0.14,
    }
  if (frame < 960) return { x: centre, lookY: 1.22, z: 3.7, intensity: 1, yaw: 0.08 }
  return {
    x: centre + Math.sin(frame / 90) * 0.08,
    lookY: state.player.y > 0 ? 1.42 : 1.2,
    z: 3.72 + Math.sin(frame / 70) * 0.12,
    intensity: 0.9,
    yaw: Math.sin(frame / 75) * 0.075,
  }
}

export function transitionOpacity(frame: number): number {
  return Math.max(
    0,
    ...[0, 240, 480, 720, 960].map((cut) => {
      const distance = Math.abs(frame - cut)
      return distance >= 10 ? 0 : 1 - distance / 10
    }),
  )
}

function playerInput(state: FightState, frame: number): FightInput {
  if (frame === 30 || (frame >= 32 && frame < 48)) return { ...EMPTY_INPUT, right: true }
  if (frame === 86 || (frame >= 88 && frame < 105)) return { ...EMPTY_INPUT, left: true }
  if (frame >= 145 && frame < 190) return { ...EMPTY_INPUT, guard: true }
  if (frame > 960) {
    const gap = Math.abs(state.player.x - state.opponent.x)
    if (gap > 9) return { ...EMPTY_INPUT, right: true }
    if (frame % 180 > 125) return { ...EMPTY_INPUT, guard: true }
  }
  return EMPTY_INPUT
}

function opponentInput(state: FightState, frame: number): FightInput {
  if (frame > 960 && Math.abs(state.player.x - state.opponent.x) > 10)
    return { ...EMPTY_INPUT, left: true }
  return EMPTY_INPUT
}

function copy(frame: number): { title: string; note: string } {
  if (frame < 240)
    return {
      title: '1 / Garde verticale et pas-éclair de 1999',
      note: 'Corps entier rémanent · micro-disparition graphique · réception bras levé',
    }
  if (frame < 480)
    return {
      title: '2 / Frappes compactes du duel Uvogin 2011',
      note: 'Direct court · crochet au corps · rotation · Croix des cinq doigts',
    }
  if (frame < 720)
    return {
      title: '3 / Discipline de garde du corps — Black Whale',
      note: 'Pistolet matériel · visée propre · Dowsing Chain · Holy Chain',
    }
  if (frame < 960)
    return {
      title: '4 / Emperor Time, Steal Chain et contrôle de portée',
      note: 'Chain Jail reste interdite : Mizaistom n’est pas membre de la Brigade',
    }
  return {
    title: '5 / Échange libre contre Mizaistom',
    note: 'Toutes les corrections restent dans les règles normales du duel',
  }
}
