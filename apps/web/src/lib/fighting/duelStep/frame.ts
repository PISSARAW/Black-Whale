import { stepGumResuscitation } from '../gumResuscitation'
import { advanceRetrospectiveHitstop } from '../retrospectiveClocks'
import { performArenaAction } from '../arenaActions'
import { advanceArena, readArenaInputs } from '../arenaSimulation'
import { reconcileBattleCantabile } from '../battleCantabileFrame'
import { advancePreparation } from '../preparationSimulation'
import { advancePredatorClock } from '../predatorSeal'
import { reconcileMelodySound } from '../melodyChannel'
import { advanceCatsName } from '../camillaCat'
import { fightResolutionPending } from '../fightOutcome'
import { advanceEmperorClock } from '../kurapikaActions'
import { FIGHT_FPS } from '../fightClock'
import { finishExpiredFight } from '../fightTimeout'
import type { FightState } from '../types'
import type { DuelAttack, DuelInputs, DuelPhaseResult } from './types'
import { bufferKameoCalls } from '../kameos/buffer'
import { advanceNenMentalFatigue } from '../nenCognitiveLoad'
import { advanceNenPsychology } from '../nenPsychology'
import { advanceBurstZetsu, resolveBurstInputs } from '../fightBurst'
import { advanceTsk17, canReleaseTsk17, releaseTsk17 } from '../tsk17'
import { advanceChrolloBookIntel } from '../chrolloDeck'
import { pickChrolloFlipSlot } from '../chrolloBookAction'
import { advanceLeorioSonar } from '../leorioMedical'
import { advanceMusseOwl } from '../musseWindowUpgrades'
import { advanceFurykovProfile } from '../furykovProfile'
import { advanceBashoHaiku, extinguishBashoBurn } from '../bashoHaiku'
import { advanceNenPillars, startFirearmReload } from '../nenPillars'
import { advanceSeiyaku } from '../seiyaku'
import { advanceZodiacAndHeirUpgrades } from '../zodiacAndHeirUpgrades'

function resolveFirearmReload(state: FightState, inputs: DuelInputs): FightState {
  for (const side of ['player', 'opponent'] as const) {
    if (inputs[side]?.context) {
      const reloaded = startFirearmReload(state[side])
      if (reloaded !== state[side]) state = { ...state, [side]: reloaded }
    }
  }
  return state
}

function resolveBurnExtinguish(state: FightState, inputs: DuelInputs): FightState {
  for (const side of ['player', 'opponent'] as const) {
    if (inputs[side]?.context && state[side].haikuBurn) {
      state = { ...state, [side]: extinguishBashoBurn(state[side]) }
    }
  }
  return state
}

function resolveChrolloFlipInputs(state: FightState, inputs: DuelInputs): FightState {
  for (const side of ['player', 'opponent'] as const) {
    const input = inputs[side]
    const book = state[side].chrolloBook
    if (!input || !book?.isFlipping) continue
    if (input.kameo) state = pickChrolloFlipSlot(state, side, 2) ?? state
    else if (input.context) state = pickChrolloFlipSlot(state, side, 3) ?? state
    else if (!input.hatsu)
      state = { ...state, [side]: { ...state[side], chrolloBook: { ...book, isFlipping: false } } }
  }
  return state
}

function resolveTsk17Inputs(state: FightState, inputs: DuelInputs): FightState {
  if (inputs.player.context && !state.player.openWounds && canReleaseTsk17(state, 'player'))
    state = releaseTsk17(state, 'player')
  if (inputs.opponent?.context && !state.opponent.openWounds && canReleaseTsk17(state, 'opponent'))
    state = releaseTsk17(state, 'opponent')
  return state
}

/** Shared world clocks, preparation and arena, before any body moves. */
export function openFrame(
  state: FightState,
  inputs: DuelInputs,
  attack: DuelAttack,
): DuelPhaseResult {
  if (state.gumResuscitation) return { state: stepGumResuscitation(state), pending: true }
  state = resolveBurstInputs(state, inputs)
  state = resolveBurnExtinguish(state, inputs)
  state = resolveFirearmReload(state, inputs)
  state = advanceSeiyaku(state, inputs)
  state = advanceZodiacAndHeirUpgrades(state, inputs)
  state = resolveChrolloFlipInputs(state, inputs)
  state = resolveTsk17Inputs(state, inputs)
  state = advancePredatorClock(state)
  state = advanceEmperorClock(state)
  if (state.catsName) return { state: advanceCatsName(state), pending: true }
  if (state.hitstop > 0)
    return { state: hitstopFrame(bufferKameoCalls(state, inputs)), pending: true }
  state = advanceNenMentalFatigue(state)
  state = advancePreparation(state, inputs)
  state = readArenaInputs(state, inputs, (current, side) =>
    performArenaAction(current, side, attack),
  )
  state = advanceArena(state)
  return { state, pending: fightResolutionPending(state) }
}

function hitstopFrame(state: FightState): FightState {
  return advanceRetrospectiveHitstop({
    ...state,
    frame: state.frame + 1,
    hitstop: state.hitstop - 1,
  })
}

/** Advances the frame counter and round clock from the frame's opening world. */
export function closeFrame(start: FightState, resolved: FightState): FightState {
  const remainingFrames =
    start.mode === 'training' ? start.remainingFrames : Math.max(0, start.remainingFrames - 1)
  const next = {
    ...advanceNenPsychology(start, advanceBurstZetsu(resolved, start.frame)),
    frame: start.frame + 1,
    remainingFrames,
    time: remainingFrames / FIGHT_FPS,
  }
  return advanceNenPillars(
    advanceBashoHaiku(
      advanceFurykovProfile(
        advanceMusseOwl(
          advanceLeorioSonar(
            advanceTsk17(
              advanceChrolloBookIntel(
                reconcileBattleCantabile(reconcileMelodySound(finishExpiredFight(next))),
              ),
            ),
          ),
        ),
      ),
    ),
  )
}
