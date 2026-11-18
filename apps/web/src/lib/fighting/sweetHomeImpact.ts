import { transferWoundToObject } from './preparationSweetHome'
import { sweetHomeContacts } from './sweetHomeContacts'
import { otherSide } from './frameData'
import { wakeHanzoBody } from './hanzoProjection'
import { scoreJudgedImpact } from './towerJudging'
import type { FightImpact, FightSide, FightState } from './types'

type Transfer = NonNullable<FightImpact['transfer']>

/** Route a wound once. The recipient's defence cannot reduce already inflicted damage. */
export function resolveSweetHomeImpact(options: {
  before: FightState
  after: FightState
  damagedSide: FightSide
}): FightState {
  const { after } = options
  const impact = after.impact
  if (!impact || impact.avoided || impact.damage <= 0) return after
  return transferIntoObject(options) ?? transferBetweenBodies(options)
}
function transferIntoObject(
  options: Parameters<typeof resolveSweetHomeImpact>[0],
): FightState | null {
  const { before, after, damagedSide } = options
  return transferWoundToObject({ before, after, source: damagedSide, explicitOnly: true })
}
function transferBetweenBodies(options: Parameters<typeof resolveSweetHomeImpact>[0]): FightState {
  const { before, after, damagedSide } = options
  const impact = after.impact!
  const transfer = findTransfer(before, damagedSide)
  if (!transfer) return transferWoundToObject({ before, after, source: damagedSide }) ?? after
  if (transfer.to === damagedSide) return after
  const recipient = wakeHanzoBody(after[transfer.to])
  const credit = otherSide(transfer.to)
  const backlash = transfer.backlash
  const points =
    transfer.to === transfer.owner
      ? 0
      : scoreJudgedImpact({
          formatId: before.formatId,
          blocked: false,
          critical: impact.critical,
          knockdown: false,
        })
  return {
    ...after,
    // The source never suffers this wound; the real recipient takes the full amount.
    [damagedSide]: {
      ...wakeHanzoBody(before[damagedSide]),
      // Transferring a wound does not undo the physical contact that exposed a disguise.
      textureSurprise: after[damagedSide].textureSurprise,
    },
    [transfer.to]: {
      ...recipient,
      health: Math.max(0, recipient.health - impact.damage),
      hitStun: Math.max(
        recipient.hitStun,
        after[damagedSide].hitStun,
        after[damagedSide].blockStun,
      ),
      blockStun: 0,
      pose: 'hit',
      blocking: false,
      attack: null,
      bufferedAttack: null,
      comboHits: recipient.comboHits + 1,
      comboDamage: recipient.comboDamage + impact.damage,
    },
    score: { ...before.score, [credit]: before.score[credit] + points },
    // A transferred injury carries no physical launch or extra knockdown point.
    knockdowns: before.knockdowns,
    impact: {
      ...impact,
      attacker: credit,
      blocked: false,
      parried: false,
      knockdown: false,
      antiAir: false,
      wallSplat: false,
      comboHits: recipient.comboHits + 1,
      points,
      zone: backlash ? 'hands' : impact.zone,
      position: { x: recipient.x, y: recipient.y + (backlash ? 7 : 6) },
      transfer,
    },
  }
}

function findTransfer(state: FightState, source: FightSide): Transfer | null {
  for (const owner of [source, otherSide(source)]) {
    const contacts = sweetHomeContacts(state, owner)
    if (!contacts) continue
    const self = owner === source
    if (!self && contacts.right !== source) continue
    if (contacts.left === source) continue
    if (contacts.left !== null) return { owner, from: source, to: contacts.left, backlash: false }
    if (!self && contacts.right === source)
      return { owner, from: source, to: owner, backlash: true }
  }
  return null
}
