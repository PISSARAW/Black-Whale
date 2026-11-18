import type { AttackFrameData } from './frameData'
import type { ArcadeFighter, FightInput, MoveAction, MoveSlot } from './types'

export type DirectionalEnding = 'ground' | 'air' | 'close' | 'carry'
export type DirectionalChain = 'bridge' | DirectionalEnding
export const DIRECTIONAL_LAUNCH_SPEED = 56

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
): DirectionalChain | undefined {
  if (!directionalChainAvailable(fighter, action, input)) return
  const attack = fighter.attack!
  if (attack.directionalChain === 'bridge') return endingFor(input, fighter.facing)
  if (attack.moveId === `${fighter.id}:standingLight` && isNeutral(input)) return 'bridge'
}

function directionalChainAvailable(fighter: ArcadeFighter, action: MoveAction, input: FightInput) {
  if (action !== 'light' || input.aura || fighter.y > 0) return false
  if (fighter.id !== 'kurapika' && fighter.id !== 'hisoka') return false
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

export function directionalSlot(chain: DirectionalChain): MoveSlot {
  return chain === 'bridge' ? 'forwardLight' : FINISHES[chain]
}

export function directionalAllows(fighter: ArcadeFighter, moveId: string): boolean {
  if (fighter.attack?.directionalChain !== 'bridge') return false
  const signature = fighter.id === 'kurapika' ? 'forwardSpecial' : 'finisher'
  return [signature, ...Object.values(FINISHES)].some((slot) => moveId === `${fighter.id}:${slot}`)
}

export function directionalFrameData(
  data: AttackFrameData,
  chain?: DirectionalChain,
): AttackFrameData {
  if (!chain) return data
  if (chain === 'bridge') return { ...data, hitstun: Math.max(data.hitstun, 33) }
  const startup = Math.min(data.startup, chain === 'carry' ? 16 : 9)
  const base = { ...data, startup, cancelEnd: data.cancelEnd - (data.startup - startup) }
  if (chain === 'air') return { ...base, knockback: 2.5, recovery: 14, hitstun: 28 }
  if (chain === 'close') return { ...base, knockback: 2, recovery: 14, hitstun: 18 }
  if (chain === 'carry') return { ...base, knockback: Math.max(6.5, data.knockback) }
  return base
}
