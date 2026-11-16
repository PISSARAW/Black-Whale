import { releasePadailleWeapon } from './padailleWeapon'
import { finishBorrowedLuini } from './luiniDolphin'
import { borrowedDoorActive } from './voconteDoorState'
import { illumiBodyFree } from './illumiState'
import { finishBorrowedMary } from './bloodyMaryAi'
import { controlledEntities, releasePreparedControl } from './preparationActions'
import { healthPercent } from './health'
import { CYCLOTRON_PUNCH } from './phinksCyclotron'
import { finishBorrowedPredator } from './predatorDolphin'
import { canStartFighterAttack } from './fighterAttacks'
import { rangedAuraCost } from './projectiles'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { canonicalTechniqueAllowed } from './techniqueContracts'
import { moveById } from './movesets'
import { releaseMachiThread } from './machiThread'
import { dolphinMissingBattleBody } from './battleCantabileRules'
import {
  createKurapika,
  chainsImmobilize,
  EMPEROR_BLACKOUT_FRAMES,
  EMPEROR_BLACKOUT_THRESHOLD,
  kurapikaNenActive,
  zetsuFighter,
} from './kurapika'
import {
  dismissDolphinGum,
  dolphinCanUse,
  dolphinIsBusy,
  recordDolphinEffects,
  returnChainAbility,
  withDolphinIdentity,
} from './kurapikaDolphin'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function toggleEmperorTime(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (!canToggleEmperor(state, fighter)) return state
  if (fighter.judgmentChain) return chainRuleDeath(state, side)
  const chain = fighter.kurapika ?? createKurapika()
  if (chain.emperorTime && chain.held?.loaded) return state
  if (!chain.emperorTime && !kurapikaNenActive(fighter)) return state
  return {
    ...state,
    [side]: {
      ...fighter,
      kurapika: {
        ...chain,
        emperorTime: !chain.emperorTime,
        continuousFrames: 0,
      },
    },
  }
}

/** Every simulated frame, including hitstop and unconsciousness; never a render-frame clock. */
export function advanceEmperorClock(state: FightState): FightState {
  return {
    ...state,
    player: advanceEmperor(state.player),
    opponent: advanceEmperor(state.opponent),
  }
}

function advanceEmperor(fighter: ArcadeFighter): ArcadeFighter {
  const chain = fighter.kurapika
  if (!chain) return fighter
  const blackoutFrames = Math.max(0, chain.blackoutFrames - 1)
  const running = emperorRunning(fighter)
  const continuousFrames = running && chain.blackoutFrames === 0 ? chain.continuousFrames + 1 : 0
  const blackout = continuousFrames >= EMPEROR_BLACKOUT_THRESHOLD
  const body = blackout || blackoutFrames > 0 ? unconsciousBody(fighter) : fighter
  return {
    ...body,
    kurapika: {
      ...chain,
      emperorTime: running,
      lifespanFrames: chain.lifespanFrames + Number(running),
      continuousFrames: blackout ? 0 : continuousFrames,
      blackoutFrames: blackout ? EMPEROR_BLACKOUT_FRAMES : blackoutFrames,
    },
  }
}

function emperorRunning(fighter: ArcadeFighter): boolean {
  const chain = fighter.kurapika!
  return (
    chain.emperorTime &&
    (kurapikaNenActive(fighter) || Boolean(chain.held?.loaded) || chain.blackoutFrames > 0)
  )
}

function unconsciousBody(fighter: ArcadeFighter): ArcadeFighter {
  return {
    ...zetsuFighter(fighter),
    attack: null,
    bufferedAttack: null,
    blocking: false,
    motion: undefined,
  }
}

function canToggleEmperor(state: FightState, fighter: ArcadeFighter): boolean {
  return state.phase === 'fighting' && fighter.id === 'kurapika' && canAct(fighter)
}

/** A Nen condition kills by its rule, independent of score format or remaining HP. */
export function chainRuleDeath(state: FightState, side: FightSide): FightState {
  const fighter = { ...state[side], health: 0, attack: null, bufferedAttack: null, blocking: false }
  return resolveFightOutcome(
    recordFightDeath(
      { ...state, [side]: fighter },
      {
        victimSide: side,
        killerSide: state[side].judgmentChain?.owner ?? null,
        cause: state[side].judgmentChain ? 'judgment' : 'vow',
      },
    ),
  )
}

export function resolveJudgmentDeaths(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const judgment = state[side].judgmentChain
    if (!judgment || state[side].health > 0) continue
    next = recordFightDeath(next, {
      victimSide: side,
      killerSide: judgment.owner,
      cause: 'judgment',
    })
  }
  return next === state ? state : resolveFightOutcome(next)
}

type PerformAttack = (options: AuraAttackOptions) => FightState

export function performKurapikaAction(
  options: AuraAttackOptions,
  perform: PerformAttack,
): FightState | null {
  const { state, side, kind, moveId } = options
  if (state.phase !== 'fighting') return state
  if (violatesJudgment(options)) return chainRuleDeath(state, side)
  if (state[side].id !== 'kurapika') return null
  // U directs an attached Dowsing Chain, never a detached projectile.
  if (kind === 'ranged')
    return perform({ ...options, kind: 'special', moveId: 'kurapika:forwardSpecial' })
  if (kind !== 'special') return null
  if (!moveId) return perform({ ...options, moveId: 'kurapika:neutralSpecial' })
  return jailAction(options) ?? dolphinAction(options, perform)
}

function violatesJudgment(options: AuraAttackOptions): boolean {
  const { state, side, kind } = options
  return (
    Boolean(state[side].judgmentChain) &&
    (kind === 'special' ||
      (kind === 'ranged' && rangedAuraCost(state[side].id) > 0) ||
      options.auraCharged)
  )
}

function jailAction({ state, side, kind, moveId }: AuraAttackOptions): FightState | null {
  if (moveId !== 'kurapika:neutralSpecial') return null
  const targetSide = side === 'player' ? 'opponent' : 'player'
  if (state[targetSide].chainJail?.owner === side && canAct(state[side]))
    return { ...state, [targetSide]: { ...state[targetSide], chainJail: undefined } }
  if (
    !canonicalTechniqueAllowed(state, side, { id: moveId }) &&
    canStartFighterAttack(state[side], kind, moveId)
  )
    return chainRuleDeath(state, side)
  return null
}

function dolphinAction(options: AuraAttackOptions, perform: PerformAttack): FightState | null {
  const { state, side, moveId } = options
  const fighter = state[side]
  const held = fighter.kurapika?.held
  if (moveId !== 'kurapika:backSpecial' || !held) return null
  if (!canUseDolphinAction(fighter)) return state
  if (!held.loaded)
    return {
      ...state,
      [side]: {
        ...fighter,
        kurapika: {
          ...fighter.kurapika!,
          held: { ...held, loaded: true },
        },
      },
    }
  if (held.used) {
    const detached = releasePadailleWeapon(state, side) ?? endDolphinEffect(options, perform)
    return dolphinIsBusy(detached, side, held) ? detached : returnChainAbility(detached, side)
  }
  return useDolphin(options, perform)
}

function canUseDolphinAction(fighter: ArcadeFighter): boolean {
  return (
    !dolphinMissingBattleBody(fighter) &&
    canAct(fighter) &&
    kurapikaNenActive(fighter) &&
    fighter.kurapika!.emperorTime
  )
}

function endDolphinEffect(options: AuraAttackOptions, perform: PerformAttack): FightState {
  const { state, side } = options
  const passage = finishBorrowedLuini(options, perform)
  if (passage) return passage
  const blood = finishBorrowedMary(options, perform)
  if (blood) return blood
  const predator = finishBorrowedPredator(state, side)
  if (predator) return predator
  const fighter = state[side]
  const held = fighter.kurapika!.held!
  if (controlledEntities(state, side).length) return releasePreparedControl(state, side)
  if (borrowedDoorActive(state, side))
    return withDolphinIdentity(
      state,
      (borrowed) => perform({ ...options, state: borrowed, moveId: held.moveId }),
      'voconte',
    )
  if (held.source === 'phinks')
    return withDolphinIdentity(
      state,
      (borrowed) => perform({ ...options, state: borrowed, moveId: CYCLOTRON_PUNCH }),
      'phinks',
    )
  return endBorrowedConstruct(options, perform)
}

function endBorrowedConstruct(options: AuraAttackOptions, perform: PerformAttack): FightState {
  const { state, side } = options
  const restored = releasePadailleWeapon(state, side)
  if (restored) return restored
  const fighter = state[side]
  const held = fighter.kurapika!.held!
  if (fighter.lynchQuestion) return { ...state, [side]: { ...fighter, lynchQuestion: undefined } }
  if (fighter.bashoPoem) return { ...state, [side]: { ...fighter, bashoPoem: undefined } }
  if (fighter.hanzoProjection)
    return withDolphinIdentity(
      state,
      (projected) => perform({ ...options, state: projected, moveId: held.moveId }),
      held.source,
    )
  if (fighter.textureSurprise)
    return { ...state, [side]: { ...fighter, textureSurprise: undefined } }
  return releaseMachiThread(dismissDolphinGum(state, side), side)
}

function useDolphin(options: AuraAttackOptions, perform: PerformAttack): FightState {
  const { state, side } = options
  if (!dolphinCanUse(state, side)) return state
  const fighter = state[side]
  const held = fighter.kurapika!.held!
  const prepared: FightState = {
    ...state,
    [side]: {
      ...fighter,
      id: held.source,
      nenOwner: fighter.nenOwner ?? fighter.id,
      kurapika: {
        ...fighter.kurapika!,
        held: { ...held, used: true },
      },
    },
  }
  const cast = performBorrowedMove({ ...options, state: prepared }, held.moveId, perform)
  if (cast === prepared || (cast[side] === prepared[side] && cast.lsdf === prepared.lsdf))
    return state
  const restored = {
    ...cast,
    [side]: { ...cast[side], id: fighter.id, nenOwner: fighter.nenOwner },
  }
  return recordDolphinEffects(state, restored, side)
}

function performBorrowedMove(
  options: AuraAttackOptions,
  moveId: string,
  perform: PerformAttack,
): FightState {
  const move = moveById(moveId)
  return perform({
    ...options,
    kind: move?.kind ?? 'special',
    variant: move?.variant,
    moveId: move?.id ?? moveId,
  })
}

function canAct(fighter: ArcadeFighter): boolean {
  if (fighter.easterEgg) return false
  if (!illumiBodyFree(fighter)) return false
  return (
    fighter.health > 0 &&
    fighter.y === 0 &&
    !chainsImmobilize(fighter) &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    fighter.attack === null
  )
}

export function kurapikaAiActivation(state: FightState): FightState | null {
  const fighter = state.opponent
  if (fighter.id !== 'kurapika' || fighter.kurapika?.emperorTime) return null
  if (healthPercent(fighter) >= 70 && !fighter.kurapika?.held) return null
  const activated = toggleEmperorTime(state, 'opponent')
  return activated === state ? null : activated
}
