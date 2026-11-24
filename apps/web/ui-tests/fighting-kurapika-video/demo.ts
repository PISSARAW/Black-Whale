import {
  beginFight,
  createFight,
  performAttack,
  performAuraAttack,
  tickFight,
} from '../../src/lib/fighting/engine'
import { canStartFighterAttack } from '../../src/lib/fighting/fighterAttacks'
import { toggleEmperorTime } from '../../src/lib/fighting/kurapikaActions'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type MoveSlot,
} from '../../src/lib/fighting/types'

function fresh(distance = 12): FightState {
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
  let state = fresh(24)
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

    if (frame === 480) reset(30)
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
