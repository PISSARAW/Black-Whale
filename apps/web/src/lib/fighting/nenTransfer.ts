import { fightingStyle } from './fightStyles'
import { fighterNenTraining } from './nenMastery'
import { nenMentalFatigueRatio } from './nenCognitiveLoad'
import { hasFastMartialTransfer } from './martialSpecialists'
import { seiyakuSpeedActive } from './seiyaku'
import type { ArcadeFighter, FightNenZone } from './types'

type Shares = Record<FightNenZone, number>
interface Transfer {
  zone: FightNenZone
  from: Shares
  to: Shares
  age: number
  duration: number
  ko?: boolean
}
declare module './types' {
  interface ArcadeFighter {
    nenTransfer?: Transfer
    lastAuraShares?: Shares
  }
}
const ZONES: readonly FightNenZone[] = ['head', 'torso', 'hands', 'feet']

export function nenTransferFrames(fighter: ArcadeFighter): number {
  if (fighter.musseOwlActive || fighter.enReflexActive || seiyakuSpeedActive(fighter)) return 1
  // Biscuit explicitly teaches these transfers. Other rates are style-based duel tuning, not manga ranks.
  const trained = fighterNenTraining(fighter, 'enhancer').level
  const base =
    (fighter.nenOwner ?? fighter.id) === 'biscuit' || hasFastMartialTransfer(fighter)
      ? 2
      : Math.max(3, Math.min(6, Math.round(7 - trained - fightingStyle(fighter.id).moveScale)))
  const fatigue = nenMentalFatigueRatio(fighter)
  const slowdown = fatigue <= 0.3 ? 1 : 1 + ((fatigue - 0.3) / 0.7) * 0.5
  return Math.max(2, Math.round(base * slowdown))
}

export function currentAuraShares(fighter: ArcadeFighter): Shares | undefined {
  if (fighter.nen.ko)
    return Object.fromEntries(ZONES.map((z) => [z, Number(z === fighter.nen.ko)])) as Shares
  if (ZONES.some((z) => Number(fighter.nen.ryu[z]) > 0))
    return Object.fromEntries(ZONES.map((z) => [z, Number(fighter.nen.ryu[z] ?? 0)])) as Shares
  return fighter.lastAuraShares
}

/** Keep the outgoing allocation through a cancel. Repeated held input cannot restart the transfer. */
export function requestNenTransfer(
  fighter: ArcadeFighter,
  request: { zone: FightNenZone; shares: Shares; ko?: boolean },
): ArcadeFighter {
  request = { ...request, shares: normaliseShares(request.shares) }
  const held = fighter.nenTransfer
  if (held?.zone === request.zone && Boolean(held.ko) === Boolean(request.ko)) return fighter
  const from = currentAuraShares(fighter)
  const nen = { ...fighter.nen, mode: 'ren' as const, ken: false, ko: null }
  if (!from || ZONES.every((z) => Math.abs(from[z] - request.shares[z]) < 0.001))
    return { ...fighter, nen: { ...nen, ryu: request.shares }, nenTransfer: undefined }
  return {
    ...fighter,
    nen: { ...nen, ryu: from },
    nenTransfer: {
      zone: request.zone,
      from,
      to: request.shares,
      age: 0,
      duration: nenTransferFrames(fighter),
      ko: request.ko,
    },
  }
}

export function advanceNenTransfer(fighter: ArcadeFighter, dt: number): ArcadeFighter {
  const transfer = fighter.nenTransfer
  if (!transfer) return fighter
  if (transferInterrupted(fighter)) return { ...fighter, nenTransfer: undefined }
  const age = Math.min(transfer.duration, transfer.age + Math.max(0, dt) * 60)
  const p = age / transfer.duration,
    weight = p * p * (3 - 2 * p)
  const shares = Object.fromEntries(
    ZONES.map((z) => [z, transfer.from[z] + (transfer.to[z] - transfer.from[z]) * weight]),
  ) as Shares
  const finishedKo = age === transfer.duration && transfer.ko
  return {
    ...fighter,
    nen: { ...fighter.nen, ryu: finishedKo ? {} : shares, ko: finishedKo ? transfer.zone : null },
    lastAuraShares: shares,
    nenTransfer: age === transfer.duration ? undefined : { ...transfer, age },
  }
}

function transferInterrupted(fighter: ArcadeFighter): boolean {
  return (
    fighter.nen.mode === 'zetsu' ||
    fighter.nen.on ||
    fighter.hitStun > 0 ||
    fighter.knockdownFrames > 0 ||
    !ZONES.some((z) => Number(fighter.nen.ryu[z]) > 0)
  )
}

export function prepareDefensiveKo(
  before: ArcadeFighter,
  after: ArcadeFighter,
  zone: FightNenZone,
) {
  if (!before.nen.ko || before.nen.ko === zone) return after
  const shares = Object.fromEntries(ZONES.map((z) => [z, Number(z === zone)])) as Shares
  return requestNenTransfer(
    { ...after, nen: { ...after.nen, ko: before.nen.ko } },
    { zone, shares, ko: true },
  )
}

function normaliseShares(shares: Shares): Shares {
  const total = ZONES.reduce((sum, zone) => sum + Math.max(0, shares[zone]), 0)
  if (Math.abs(total - 1) < 0.000001) return shares
  return Object.fromEntries(
    ZONES.map((zone) => [zone, total > 0 ? Math.max(0, shares[zone]) / total : 0.25]),
  ) as Shares
}
