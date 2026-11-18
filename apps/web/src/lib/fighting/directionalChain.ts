import type { AttackFrameData } from './frameData'
import type { ArcadeFighter, FightInput, MoveAction, MoveSlot } from './types'
import { FIGHTING_ROSTER } from './roster'

export type DirectionalEnding = 'ground' | 'air' | 'close' | 'carry'
export type AirPursuit = 'pursuit' | 'pursuit-technique'
export type DirectionalChain = 'bridge' | DirectionalEnding | AirPursuit
export const DIRECTIONAL_LAUNCH_SPEED = 56

export interface DirectionalIntent {
  moveId?: string
  directionalChain?: DirectionalChain
}

const CHAIN_FIGHTERS = new Set(FIGHTING_ROSTER.map(({ id }) => id))

export function hasDirectionalChain(id: ArcadeFighter['id']): boolean {
  return CHAIN_FIGHTERS.has(id)
}

const FINISHES: Record<DirectionalEnding, MoveSlot> = {
  ground: 'lowHeavy',
  air: 'standingHeavy',
  close: 'backHeavy',
  carry: 'forwardHeavy',
}

export function directionalInput(
  fighter: ArcadeFighter,
  action: MoveAction,
  input: FightInput,
): DirectionalEnding | 'bridge' | undefined {
  if (!directionalChainAvailable(fighter, action, input)) return
  const attack = fighter.attack!
  if (attack.directionalChain === 'bridge') return endingFor(input, fighter.facing)
  if (attack.moveId === `${fighter.id}:standingLight` && isNeutral(input)) return 'bridge'
}

function directionalChainAvailable(fighter: ArcadeFighter, action: MoveAction, input: FightInput) {
  if (action !== 'light' || input.aura || fighter.y > 0) return false
  if (!hasDirectionalChain(fighter.id)) return false
  const attack = fighter.attack
  return Boolean(attack && (!attack.impacted || attack.confirmedHit))
}

function endingFor(input: FightInput, facing: 1 | -1): DirectionalEnding {
  if (input.down) return 'ground'
  if (input.jump) return 'air'
  const forward = facing === 1 ? input.right : input.left
  return forward ? 'carry' : 'close'
}

function isNeutral(input: FightInput): boolean {
  return !input.down && !input.jump && !input.left && !input.right
}

export function launchesWithDirectionalEnding(fighter: ArcadeFighter, antiAir: boolean): boolean {
  return antiAir || fighter.attack?.directionalChain === 'air'
}

export function directionalSlot(chain: DirectionalEnding | 'bridge'): MoveSlot {
  return chain === 'bridge' ? 'forwardLight' : FINISHES[chain]
}

export function directionalSourceMatches(fighter: ArcadeFighter, chain: DirectionalChain): boolean {
  const attack = fighter.attack
  if (!attack || !hasDirectionalChain(fighter.id)) return false
  if (isAirPursuit(chain)) return attack.directionalChain === 'air'
  return chain === 'bridge'
    ? attack.moveId === `${fighter.id}:standingLight`
    : attack.directionalChain === 'bridge'
}

export function isAirPursuit(chain?: DirectionalChain): chain is AirPursuit {
  return chain === 'pursuit' || chain === 'pursuit-technique'
}

export function pursuitWindow(frame: number, data: AttackFrameData, buffer = 0): boolean {
  const activeEnd = data.startup + data.active
  return frame >= activeEnd + 2 - buffer && frame < activeEnd + data.recovery
}

export function directionalFrameData(
  data: AttackFrameData,
  chain?: DirectionalChain,
): AttackFrameData {
  if (!chain) return data
  if (chain === 'pursuit-technique') return data
  if (chain === 'pursuit') return { ...data, lunge: 0, damage: Math.round(data.damage * 0.85) }
  if (chain === 'bridge')
    return {
      ...data,
      knockback: Math.min(data.knockback, 2.5),
      hitstun: Math.max(data.hitstun, 33),
    }
  const startup = Math.min(data.startup, chain === 'carry' ? 16 : 9)
  const base = { ...data, startup, cancelEnd: data.cancelEnd - (data.startup - startup) }
  if (chain === 'air') return { ...base, knockback: 2.5, recovery: 14, hitstun: 28 }
  if (chain === 'close') return { ...base, knockback: 2, recovery: 14, hitstun: 18 }
  if (chain === 'carry') return { ...base, knockback: Math.max(6.5, data.knockback) }
  return base
}
