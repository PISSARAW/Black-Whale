import {
  beginFight,
  createFight,
  performAuraAttack,
  performMove,
  tickFight,
} from '../../src/lib/fighting/engine'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import { performArsenalCommand } from '../../src/lib/fighting/retrospectiveArsenal'
import { combatRoute } from '../../src/lib/fighting/combatRoutes'
import { combatRouteAction, combatRouteInput } from '../../src/lib/fighting/combatRouteFight'
import { canStartFighterAttack } from '../../src/lib/fighting/fighterAttacks'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type MoveSlot,
} from '../../src/lib/fighting/types'

const SPEED_START = 90
const BLADE_START = 240
const UMBRELLA_START = 390
const WOUND_START = 540
const ARMOUR_START = 630
const SUN_START = 735

function fresh(): FightState {
  const state = beginFight(
    createFight('feitan', 'saiyu', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { stageId: 'princes-burial-chamber' },
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 37, health: 100, maxHealth: 100 },
    opponent: { ...state.opponent, x: 64, health: 100, maxHealth: 100 },
  }
}

function wounded(): FightState {
  const state = fresh()
  return {
    ...state,
    player: {
      ...state.player,
      x: 43,
      health: 38,
      hatsuEffects: {
        ...state.player.hatsuEffects,
        painPacker: { injuries: 62, packedDamage: 0, armour: false, sun: null },
      },
    },
    opponent: { ...state.opponent, x: 62 },
  }
}

export function createFeitanSaiyuDemo(portrait = false) {
  let state = fresh()
  let frame = 0
  let umbrellaStarted = false
  let spikeFired = false
  let armourCommanded = false
  let sunCommanded = false
  const moves = new Set<string>()
  const routes = [combatRoute('feitan:speed'), combatRoute('feitan:speed-economy')]
  const routeStarts = [BLADE_START, BLADE_START + 75]
  const comboRecords = [0, 0]
  const impacts: { frame: number; opponent: boolean }[] = []
  let routeIndex = -1
  let routeStep = 0
  const counters = { dash: 0, hidden: 0, umbrella: 0, wounded: 0, armour: 0, sun: 0, heat: 0 }

  function strike(side: FightSide, slot: MoveSlot) {
    const move = moveForSlot(state[side].id, slot)
    if (!move) return
    state = performAuraAttack({
      state,
      side,
      kind: move.kind,
      variant: move.variant,
      moveId: move.id,
      auraCharged: false,
    })
  }

  function commands() {
    if (frame === WOUND_START) state = wounded()
    if (frame === UMBRELLA_START) {
      state = fresh()
      state = {
        ...state,
        player: { ...state.player, x: 44 },
        opponent: { ...state.opponent, x: 62 },
      }
    }
    if (portrait && frame >= BLADE_START && frame < UMBRELLA_START) playCombo()
    if (!portrait && frame >= BLADE_START && frame < UMBRELLA_START && frame % 46 === 0)
      strike(
        'player',
        (['standingLight', 'standingHeavy', 'lowHeavy'] as const)[
          Math.floor((frame - BLADE_START) / 46) % 3
        ],
      )
    if (frame === UMBRELLA_START && !umbrellaStarted) {
      state = performArsenalCommand(state, 'player', { action: 'umbrella-feint' })
      umbrellaStarted = Boolean(state.player.umbrellaFeintFrames)
    }
    if (frame === UMBRELLA_START + 64 && !spikeFired) {
      state = performAuraAttack({ state, side: 'player', kind: 'ranged', auraCharged: false })
      spikeFired = Boolean(state.player.attack)
    }
    if (frame === UMBRELLA_START + 110) strike('player', 'forwardSpecial')
    if (frame === ARMOUR_START && !armourCommanded) {
      const next = performMove({ state, side: 'player', action: 'special' })
      armourCommanded = next !== state
      state = next
    }
    if (frame >= SUN_START && state.player.hatsuEffects.painPacker?.armour && !sunCommanded) {
      const next = performMove({ state, side: 'player', action: 'finisher' })
      sunCommanded = next !== state
      state = next
    }
  }

  function playCombo() {
    const index = routeStarts.indexOf(frame)
    if (index !== -1) {
      routeIndex = index
      routeStep = 0
      state = fresh()
      state = {
        ...state,
        player: { ...state.player, x: 44 },
        opponent: { ...state.opponent, x: 50 },
      }
    }
    const slot = routes[routeIndex]?.moves[routeStep]
    if (!slot || state.opponent.comboHits < routeStep) return
    const move = moveForSlot('feitan', slot)
    if (!move || !canStartFighterAttack(state.player, move.kind, move.id)) return
    const next =
      routeIndex === 0
        ? performMove({
            state,
            side: 'player',
            action: combatRouteAction(slot),
            input: combatRouteInput(slot, state.player.facing),
          })
        : performAuraAttack({
            state,
            side: 'player',
            kind: move.kind,
            variant: move.variant,
            moveId: move.id,
            auraCharged: false,
          })
    const started = next.player.attack?.moveId
    if (
      next.player.attack !== state.player.attack &&
      (started === move.id || (slot === 'backHeavy' && started === 'feitan:shadowless-blade'))
    )
      routeStep++
    state = next
  }

  function record() {
    const actor = state.player
    if (actor.attack?.moveId) moves.add(actor.attack.moveId)
    if (actor.motion?.dash) {
      counters.dash++
      if ([2, 3, 7].includes(actor.motion.dash.frame)) counters.hidden++
    }
    if (actor.umbrellaFeintFrames) counters.umbrella++
    const pain = actor.hatsuEffects.painPacker
    if ((pain?.injuries ?? 0) >= 20 && !pain?.armour) counters.wounded++
    if (pain?.armour) counters.armour++
    if (pain?.sun) {
      counters.sun++
      if (pain.sun.scored.includes('opponent')) counters.heat++
    }
  }

  function advance() {
    commands()
    const before = state
    const combo = portrait && frame >= BLADE_START && frame < UMBRELLA_START
    state = tickFight(state, combo ? EMPTY_INPUT : inputFor(frame), {
      dt: 1 / 60,
      opponentInput: combo
        ? { ...EMPTY_INPUT, guard: Boolean(before.impact) }
        : saiyuInput(before, frame),
    })
    if (combo)
      comboRecords[routeIndex] = Math.max(comboRecords[routeIndex], state.opponent.comboHits)
    if (state.impact && state.impact.sequence !== before.impact?.sequence && !state.impact.blocked)
      impacts.push({ frame, opponent: state.impact.attacker === 'opponent' })
    record()
    frame++
    return { state, frame, title: titleFor(frame) }
  }

  return {
    initial: state,
    advance,
    diagnostics: () => ({
      frame,
      moves: [...moves],
      ...counters,
      comboRecords,
      impacts,
      umbrellaStarted,
      spikeFired,
      armourCommanded,
      sunCommanded,
    }),
  }
}

function inputFor(frame: number): FightInput {
  if (frame < SPEED_START) return EMPTY_INPUT
  if (frame === 94 || (frame >= 98 && frame < 114)) return { ...EMPTY_INPUT, right: true }
  if (frame === 126 || (frame >= 130 && frame < 146)) return { ...EMPTY_INPUT, left: true }
  if (frame === 158 || (frame >= 162 && frame < 178)) return { ...EMPTY_INPUT, right: true }
  if (frame === 182) return { ...EMPTY_INPUT, jump: true }
  if (frame >= BLADE_START && frame < WOUND_START && frame % 46 > 25)
    return { ...EMPTY_INPUT, right: true }
  return EMPTY_INPUT
}

function saiyuInput(state: FightState, frame: number): FightInput {
  if (frame < BLADE_START || frame >= WOUND_START) return EMPTY_INPUT
  const gap = Math.abs(state.player.x - state.opponent.x)
  if (frame % 120 > 88) return { ...EMPTY_INPUT, guard: true }
  return gap > 11 ? { ...EMPTY_INPUT, left: true } : EMPTY_INPUT
}

function titleFor(frame: number): string {
  if (frame < SPEED_START) return '1 / Le calme avant la mise à mort'
  if (frame < BLADE_START) return '2 / Le regard ne peut plus le suivre'
  if (frame < UMBRELLA_START) return '3 / Un trait d’acier dans l’ombre'
  if (frame < WOUND_START) return '4 / Sous le parapluie, la pointe cachée'
  if (frame < ARMOUR_START) return '5 / La douleur devient menace'
  if (frame < SUN_START) return '6 / Pain Packer · armure du supplice'
  return '7 / Rising Sun · le tombeau brûle'
}
