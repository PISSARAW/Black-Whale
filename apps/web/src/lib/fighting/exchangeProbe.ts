import { beginFight, createFight, performMove, tickFight } from './engine'
import { setTrainingDummy, setTrainingResources } from './trainingSession'
import { trainingCanAct } from './trainingMeasurement'
import { combatRouteAction, combatRouteInput } from './combatRouteFight'
import { otherSide } from './frameData'
import {
  EMPTY_INPUT,
  type FighterId,
  type FightSide,
  type FightState,
  type MoveSlot,
} from './types'

export interface ExchangeProbeOptions {
  fighter: FighterId
  defender: FighterId
  side?: FightSide
  position?: 'center' | 'left' | 'right'
  slot?: MoveSlot
  frames?: number
}

/** Real commands and ticks. Infinite HP lengthens observation; aura remains finite. */
function initialProbe(options: ExchangeProbeOptions, side: FightSide) {
  const target = otherSide(side)
  const mirrored = options.position === 'left'
  const facing = mirrored ? -1 : 1
  const x = options.position === 'center' ? 50 : mirrored ? 7 : 93
  let state = beginFight(
    createFight(
      side === 'player' ? options.fighter : options.defender,
      side === 'opponent' ? options.fighter : options.defender,
      {
        mode: 'training',
        formatId: 'knockout',
        environment: { stageId: 'heavens-arena', arenaInteractions: false },
      },
    ),
  )
  state = setTrainingDummy(state, { behavior: 'manual' })
  for (const body of ['player', 'opponent'] as const)
    state = setTrainingResources(state, body, { infiniteHealth: true, infiniteAura: false })
  state = {
    ...state,
    [side]: { ...state[side], x: x - facing * 6, facing },
    [target]: { ...state[target], x, facing: -facing },
  }
  return state
}

interface ProbeContacts {
  hits: number
  maxCombo: number
  guardAt: number | null
}

function observeProbe(
  sample: ProbeContacts,
  options: {
    state: FightState
    side: FightSide
    previous?: number
  },
) {
  const impact = options.state.impact
  if (!impact || impact.sequence === options.previous || impact.attacker !== options.side) return
  if (impact.blocked || impact.parried) sample.guardAt ??= options.state.frame
  else sample.hits++
  sample.maxCombo = Math.max(sample.maxCombo, impact.comboHits ?? 0)
}

export function probeGroundedExchange(options: ExchangeProbeOptions) {
  const side = options.side ?? 'player'
  const target = otherSide(side)
  const slot = options.slot ?? 'standingLight'
  let state = initialProbe(options, side)
  const sample: ProbeContacts = { hits: 0, maxCombo: 0, guardAt: null }
  let actionableFrames = 0
  for (let frame = 0; frame < (options.frames ?? 360); frame++) {
    state = performMove({
      state,
      side,
      action: combatRouteAction(slot),
      input: combatRouteInput(slot, state[side].facing),
    })
    const previous = state.impact?.sequence
    const guard = { ...EMPTY_INPUT, guard: sample.hits >= 3, down: slot.startsWith('low') }
    state = tickFight(state, target === 'player' ? guard : EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: target === 'opponent' ? guard : EMPTY_INPUT,
      ai: false,
    })
    observeProbe(sample, { state, side, previous })
    if (sample.hits && actionable(state, target)) actionableFrames++
  }
  return { ...sample, actionableFrames, frame: state.frame }
}

function actionable(state: FightState, side: FightSide): boolean {
  return state.hitstop === 0 && trainingCanAct(state[side])
}
