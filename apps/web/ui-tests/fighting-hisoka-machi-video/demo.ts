import {
  beginFight,
  createFight,
  performAttack,
  performAuraAttack,
  tickFight,
} from '../../src/lib/fighting/engine'
import { canStartFighterAttack } from '../../src/lib/fighting/fighterAttacks'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type MoveSlot,
} from '../../src/lib/fighting/types'

const HISOKA_ROUTES: readonly MoveSlot[][] = [
  ['standingLight', 'standingHeavy', 'forwardLight'],
  ['lowLight', 'standingHeavy', 'backHeavy'],
]

function fresh(ai = false): FightState {
  const initial = beginFight(
    createFight(ai ? 'machi' : 'hisoka', ai ? 'hisoka' : 'machi', {
      mode: ai ? 'versus-ai' : 'versus-local',
      formatId: 'knockout',
      environment: { stageId: 'heavens-arena' },
    }),
  )
  return {
    ...initial,
    aiCooldown: ai ? 180 : undefined,
    player: { ...initial.player, x: ai ? 40 : 34, health: 600, maxHealth: 600, aura: 100 },
    opponent: {
      ...initial.opponent,
      x: ai ? 60 : 66,
      health: 600,
      maxHealth: 600,
      aura: 100,
    },
  }
}

export function createHisokaMachiDemo() {
  let state = fresh()
  let frame = 0
  let route = 0,
    step = 0,
    cooldown = 0
  let cards = 0,
    cardThrows = 0,
    gumFrames = 0,
    textureFrames = 0,
    dashFrames = 0,
    hits = 0
  let gumAttached = false,
    gumPulled = false,
    gumRebounded = false
  const moves = new Set<string>()

  function attack(side: FightSide, slot: MoveSlot): boolean {
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

  function hisokaSpecial(
    slot: 'neutralSpecial' | 'forwardSpecial' | 'backSpecial' | 'downSpecial',
  ) {
    attack('player', slot)
  }

  function throwHisokaCard() {
    const previous = state.player.attack
    const next = performAttack(state, 'player', 'ranged')
    if (next.player.attack !== previous) cardThrows++
    state = next
  }

  function enterTake() {
    if (frame === 300) {
      state = fresh()
      state = {
        ...state,
        player: { ...state.player, x: 43 },
        opponent: { ...state.opponent, x: 52 },
      }
    }
    if (frame === 600) {
      state = fresh()
      state = {
        ...state,
        player: { ...state.player, x: 43 },
        opponent: { ...state.opponent, x: 54 },
      }
    }
    if (frame === 900) state = fresh(true)
  }

  function scriptedCommands() {
    if (frame === 54 || frame === 224) throwHisokaCard()
    if (frame === 118 || frame === 198) attack('opponent', 'standingHeavy')
    if (frame >= 138 && frame < 280) sparringCombo()

    if (frame === 315) hisokaSpecial('neutralSpecial')
    if (frame === 390) {
      state = { ...state, opponent: { ...state.opponent, x: 72 } }
      hisokaSpecial('forwardSpecial')
      gumPulled = true
    }
    if (frame === 474) {
      hisokaSpecial('backSpecial')
      gumRebounded = true
    }
    if (frame === 615) hisokaSpecial('downSpecial')
    if (frame === 720 || frame === 810) attack('opponent', 'standingHeavy')

    if (frame === 930 || (frame > 930 && frame % 112 === 0)) attack('player', 'standingHeavy')
    if (frame >= 990 && frame % 170 === 0) state = performAttack(state, 'player', 'ranged')
  }

  function sparringCombo() {
    if (cooldown > 0) {
      cooldown--
      return
    }
    if (Math.abs(state.player.x - state.opponent.x) > 10) return
    const slots = HISOKA_ROUTES[route % HISOKA_ROUTES.length]
    if (!attack('player', slots[step])) return
    step++
    if (step < slots.length) return
    step = 0
    route++
    cooldown = 24
  }

  function record(previousImpact: number | undefined, previousCards: number) {
    const hisoka = frame < 900 ? state.player : state.opponent
    if (hisoka.attack?.moveId) moves.add(hisoka.attack.moveId)
    if (state.impact?.sequence !== previousImpact && state.impact && !state.impact.blocked) hits++
    cards += Math.max(
      0,
      state.projectiles.filter((shot) => shot.fighterId === 'hisoka' && shot.shape === 'card')
        .length - previousCards,
    )
    if (state.bungeeGum) {
      gumFrames++
      gumAttached = true
    }
    if (hisoka.textureSurprise) textureFrames++
    if (hisoka.motion?.dash) dashFrames++
  }

  function advance() {
    enterTake()
    scriptedCommands()
    const previousImpact = state.impact?.sequence
    const previousCards = state.projectiles.filter(
      (shot) => shot.fighterId === 'hisoka' && shot.shape === 'card',
    ).length
    state = tickFight(state, inputFor(state, frame), {
      dt: 1 / 60,
      ai: frame >= 900,
      ...(frame < 900 ? { opponentInput: enemyInput(state, frame) } : {}),
    })
    record(previousImpact, previousCards)
    frame++
    return { state, frame, title: titleFor(frame) }
  }

  return {
    initial: state,
    advance,
    diagnostics: () => ({
      frame,
      cards,
      cardThrows,
      hits,
      gumFrames,
      gumAttached,
      gumPulled,
      gumRebounded,
      textureFrames,
      dashFrames,
      moves: [...moves],
      phase: state.phase,
    }),
  }
}

export function createHisokaMachiAudioStates(frames = 1440): FightState[] {
  const demo = createHisokaMachiDemo()
  return Array.from({ length: frames }, () => demo.advance().state)
}

function inputFor(state: FightState, frame: number): FightInput {
  const player = state.player
  const opponent = state.opponent
  const gap = Math.abs(player.x - opponent.x)
  if (frame < 300) return gap > 8 ? toward(player.x, opponent.x) : EMPTY_INPUT
  if (frame < 600) return EMPTY_INPUT
  if (frame < 900) return gap > 9 ? toward(player.x, opponent.x) : EMPTY_INPUT
  if (frame % 190 > 145 && gap < 14) return { ...EMPTY_INPUT, guard: true }
  return gap > 10 ? toward(player.x, opponent.x) : EMPTY_INPUT
}

function enemyInput(state: FightState, frame: number): FightInput {
  if (frame >= 300 && frame < 600) return EMPTY_INPUT
  if (state.opponent.knockdownFrames) return EMPTY_INPUT
  const gap = Math.abs(state.player.x - state.opponent.x)
  if (frame < 300 && frame % 150 > 120) return { ...EMPTY_INPUT, guard: true }
  return gap > 10 ? toward(state.opponent.x, state.player.x) : EMPTY_INPUT
}

function toward(x: number, target: number): FightInput {
  return { ...EMPTY_INPUT, left: target < x, right: target > x }
}

function titleFor(frame: number): string {
  if (frame < 300) return '1 / Cartes physiques et frappes sans téléportation'
  if (frame < 600) return '2 / Bungee Gum · Attache, traction et propulsion'
  if (frame < 900) return '3 / Texture Surprise reste un masque, pas un soin'
  return '4 / Lecture réelle · Retrait, retour et duel piloté par l’IA'
}
