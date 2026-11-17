import { beginFight, createFight, nextRound } from '../engine'
import { createChallengeFight } from '../fightChallenges'
import { encodeFightSnapshot, decodeFightSnapshot } from '../fightReplaySnapshot'
import type { FightState } from '../types'
import { soloEncounter } from './catalogue'
import type { SoloRun, SoloEncounter } from './types'

export const soloMarker = (run: Pick<SoloRun, 'id' | 'index' | 'mode' | 'route'>) => ({
  run: run.id,
  encounter: `${run.index}:${soloEncounter(run).id}`,
})
export function createSoloFight(run: SoloRun): FightState {
  if (run.mode === 'survival' && run.carry && ['won', 'complete'].includes(run.status))
    return readSoloCarry(run)
  const encounter = soloEncounter(run)
  let state = preparedEncounter(encounter, run)
  if (run.mode === 'survival' && run.carry) state = survivalEntry(state, run)
  return {
    ...state,
    mode: 'versus-ai',
    training: undefined,
    frameAccumulator: 0,
    rng: (run.seed + run.index * 7919) >>> 0,
    soloSession: soloMarker(run),
  }
}
function preparedEncounter(encounter: SoloEncounter, run: SoloRun) {
  if (encounter.goal === 'reveal') return createChallengeFight('reveal-in')
  if (encounter.goal === 'interrupt') return createChallengeFight('interrupt-preparation')
  if (encounter.goal === 'protect-body') return createChallengeFight('protect-body')
  let state = beginFight(
    createFight(
      encounter.player === 'selected' ? run.fighter : encounter.player,
      encounter.opponent,
      {
        mode: 'versus-ai',
        formatId: 'knockout',
        environment: {
          stageId: encounter.stage,
          arenaInteractions: encounter.goal === 'protect-crate',
        },
      },
    ),
  )
  if (encounter.goal === 'question')
    state = { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 50 } }
  if (encounter.script === 'fire')
    state = { ...state, player: { ...state.player, x: 46 }, opponent: { ...state.opponent, x: 74 } }
  if (encounter.goal === 'protect-crate')
    state = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.filter((e) => e.id === 'arena:crate:34'),
      },
    }
  return state
}
function survivalEntry(fresh: FightState, run: SoloRun) {
  const previous = readSoloCarry(run)
  const boundary = nextRound({ ...previous, matchWinner: null })
  return {
    ...fresh,
    player: {
      ...boundary.player,
      x: fresh.player.x,
      health: previous.player.health,
      aura: previous.player.aura,
      auraExhausted: previous.player.auraExhausted,
    },
  }
}
export function readSoloCarry(run: SoloRun): FightState {
  const index = ['won', 'complete'].includes(run.status) ? run.index : run.index - 1
  if (!run.carry || index < 0) throw Error('INVALID_SOLO_CARRY')
  const previous = soloEncounter({ ...run, index })
  const state = decodeFightSnapshot(run.carry, {
    player: run.fighter,
    opponent: previous.opponent,
    mode: 'versus-ai',
    formatId: 'knockout',
    environment: createFight(run.fighter, previous.opponent, {
      environment: { stageId: previous.stage, arenaInteractions: false },
    }).environment,
  })
  if (!validCarry(state, run)) throw Error('INVALID_SOLO_CARRY')
  return state
}
function validCarry(s: FightState, run: SoloRun) {
  if (s.phase !== 'finished' || s.winner !== 'player' || s.player.id !== run.fighter) return false
  if (!saneResources(s)) return false
  const index = ['won', 'complete'].includes(run.status) ? run.index : run.index - 1
  const marker = soloMarker({ ...run, index })
  return s.soloSession?.run === marker.run && s.soloSession.encounter === marker.encounter
}
function saneResources(s: FightState) {
  return (
    s.player.health > 0 &&
    s.player.health <= s.player.maxHealth &&
    s.player.aura >= 0 &&
    s.player.aura <= 100
  )
}
export const soloCarry = (state: FightState) => encodeFightSnapshot(state)
