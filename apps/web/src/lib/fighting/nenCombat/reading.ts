import { auraSight } from './sight'
import { voluntaryNenAvailable } from '../nenAccess'
import type { ArcadeFighter, FightNenZone } from '../types'
export const AURA_ZONES: readonly FightNenZone[] = ['head', 'torso', 'hands', 'feet']
export const ZONE_NAMES = {
  fr: { head: 'Tête', torso: 'Torse', hands: 'Mains', feet: 'Jambes' },
  en: { head: 'Head', torso: 'Torso', hands: 'Hands', feet: 'Legs' },
}
export interface AuraReading {
  output: 'quiet' | 'ten' | 'ren' | 'ken' | 'on'
  shares: Partial<Record<FightNenZone, number>> | null
  strong: FightNenZone[]
  weak: FightNenZone[]
}
/** Reads current aura only: never command buffers, Hatsu identity, conditions, affinity or future moves. */
export function readAura(observer: ArcadeFighter, target: ArcadeFighter): AuraReading | null {
  if (!auraSight(observer)) return null
  if (observer.gyoLow)
    return {
      output: target.nen.in ? 'quiet' : currentOutput(target),
      shares: null,
      strong: [],
      weak: [],
    }
  const output = currentOutput(target),
    shares = visibleShares(target, output)
  if (!shares) return { output, shares: null, strong: [], weak: [] }
  const values = AURA_ZONES.map((zone) => Number(shares[zone] ?? 0))
  const high = Math.max(...values),
    low = Math.min(...values)
  return {
    output,
    shares,
    strong: high === low ? [] : AURA_ZONES.filter((zone) => shares[zone] === high),
    weak: high === low ? [] : AURA_ZONES.filter((zone) => shares[zone] === low),
  }
}
function currentOutput(fighter: ArcadeFighter): AuraReading['output'] {
  if (fighter.nen.on) return 'on'
  if (!voluntaryNenAvailable(fighter, { requireHatsu: false, requireReserve: true })) return 'quiet'
  if (fighter.nen.ken) return 'ken'
  return fighter.nen.mode === 'ren' ? 'ren' : 'ten'
}
function visibleShares(
  fighter: ArcadeFighter,
  output: AuraReading['output'],
): AuraReading['shares'] {
  if (output === 'quiet') return null
  if (fighter.nen.ko)
    return Object.fromEntries(AURA_ZONES.map((zone) => [zone, Number(fighter.nen.ko === zone)]))
  if (!AURA_ZONES.some((zone) => Number(fighter.nen.ryu[zone] ?? 0) > 0)) return null
  return Object.fromEntries(
    AURA_ZONES.map((zone) => [zone, Math.max(0, Math.min(1, Number(fighter.nen.ryu[zone] ?? 0)))]),
  )
}
