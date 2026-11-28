import { preparedNenDestinations, preparedBranchReady } from './nenPreparedBranches'
import { nenFollowupReadiness, nenTransferWaiting } from './nenComboReadiness'
import { hasDuelComboProfile } from './duelComboProfiles'
import {
  openingDestinations,
  openingFollowup,
  openingReward,
  openingStartup,
} from './comboOpenings'
import { attackAuraCost } from './fightAttackCost'
import { comboAdmissionBody, comboMoveCost } from './comboAuraCost'
import { CYCLOTRON_PUNCH } from './phinksCyclotron'
import { cyclotronComboRelease } from './phinksComboRelease'
import { attackData, otherSide } from './frameData'
import { canStartFighterAttack } from './fighterAttacks'
import { meetsMovesetRequirements, moveById } from './movesets'
import type { FighterMove } from './movesetTypes'
import type { ArcadeFighter, FightState, FightSide } from './types'

type ComboChoiceStatus = 'unavailable' | 'blocked' | 'late' | 'confirm' | 'ready' | 'wait'

/** Read-only player guidance: admission and the next impact still belong to the engine. */
export function comboChoices(state: FightState, side: FightSide = 'player') {
  const fighter = state[side]
  const current = moveById(fighter.attack?.moveId)
  if (!hasDuelComboProfile(fighter.id) || !fighter.attack || !current) return []
  const openings = [...openingDestinations(fighter), ...preparedNenDestinations(fighter)]
  const cyclotron = cyclotronComboRelease(fighter) ? [CYCLOTRON_PUNCH] : []
  return cancelChoices(current, [...openings, ...cyclotron]).flatMap(({ id, link }) => {
    const move = moveById(id)
    if (!move) return []
    const cost =
      comboMoveCost(state, side, move) ??
      attackAuraCost({
        fighter,
        kind: move.kind,
        moveId: move.id,
        concealed: fighter.nen.in && move.kind === 'special',
      })
    const status = choiceStatus({ state, side, current, move, link })
    const opening = openings.includes(id) ? fighter.attack?.comboOpening : undefined
    return [
      {
        move,
        link,
        cost,
        status,
        nenReadiness: nenFollowupReadiness(comboAdmissionBody(state, side, move), move),
        opening,
        reward: openingReward(fighter, id),
      },
    ]
  })
}

function cancelChoices(move: FighterMove, openings: string[]) {
  const links = (move.linkInto ?? []).filter((id) => !openings.includes(id))
  const cancels = new Set([...move.cancelInto.filter((id) => !links.includes(id)), ...openings])
  return [
    ...Array.from(cancels, (id) => ({ id, link: false })),
    ...links.map((id) => ({ id, link: true })),
  ]
}

function choiceStatus(options: {
  state: FightState
  side: FightSide
  current: FighterMove
  move: FighterMove
  link: boolean
}): ComboChoiceStatus {
  const { state, side, current, move, link } = options
  const fighter = state[side]
  const attack = fighter.attack!
  // A recovery link may require a free body (Cyclotron); preview that state only for guidance.
  const readiness = link ? { ...state, [side]: { ...fighter, attack: null } } : state
  if (!meetsMovesetRequirements(readiness, side, move)) return 'unavailable'
  if (waitingForAura(readiness[side], move)) return 'wait'
  if (attack.confirmedBlock && !current.cancelOnBlockInto.includes(move.id)) return 'blocked'
  const target = state[otherSide(side)]
  if (choiceExpired({ fighter, target, move, link })) return 'late'
  if (unconfirmed(fighter)) return 'confirm'
  if (link) return 'wait'
  const admitted = comboAdmissionBody(state, side, move)
  return canStartFighterAttack(admitted, move.kind, move.id) ? 'ready' : 'wait'
}

function choiceExpired(options: {
  fighter: ArcadeFighter
  target: ArcadeFighter
  move: FighterMove
  link: boolean
}) {
  const { fighter, target, move, link } = options
  const attack = fighter.attack!
  const startup = openingStartup(move.tuning.startup, openingFollowup(fighter, move.id))
  if (attack.confirmedHit && target.hitStun <= startup) return true
  return !link && attack.frame > attackData(attack.kind, fighter).cancelEnd
}

function unconfirmed(fighter: ArcadeFighter): boolean {
  return !fighter.attack?.confirmedHit && !fighter.attack?.confirmedBlock
}

function waitingForAura(fighter: ArcadeFighter, move: FighterMove): boolean {
  return nenTransferWaiting(fighter, move) || !preparedBranchReady(fighter, move.id)
}
