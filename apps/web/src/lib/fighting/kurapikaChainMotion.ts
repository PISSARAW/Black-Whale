import { attackData } from './frameData'
import type { ArcadeFighter, FightSide, FightState } from './types'

export type ChainStage = 0 | 1 | 2 | 3 | 4
export interface ChainMotion {
  stage: ChainStage
  mode: 'attack' | 'jail' | 'drain' | 'healing'
  extension: number
  reach: number
}
const STAGES: Record<string, ChainStage> = {
  'kurapika:neutralSpecial': 2,
  'kurapika:forwardSpecial': 0,
  'kurapika:downSpecial': 3,
  'kurapika:backSpecial': 1,
  'kurapika:finisher': 4,
}

/** Independent fingers: healing never replaces the chain holding a prisoner. */
export function kurapikaChainMotions(state: FightState, side: FightSide): ChainMotion[] {
  const target = state[side === 'player' ? 'opponent' : 'player']
  const motions = maintainedChains(target, side)
  const attack = attackChain(state[side])
  if (attack && !motions.some((held) => held.stage === attack.stage)) motions.push(attack)
  return motions
}

function maintainedChains(target: ArcadeFighter, side: FightSide): ChainMotion[] {
  const motions: ChainMotion[] = []
  if (target.chainJail?.owner === side)
    motions.push({ stage: 2, mode: 'jail', extension: 1, reach: 0 })
  if (target.drainingChain?.owner === side)
    motions.push({ stage: 1, mode: 'drain', extension: 1, reach: 0 })
  return motions
}

/** Gameplay frames own deployment and recovery, never an independent six-second timer. */
function attackChain(fighter: ArcadeFighter): ChainMotion | null {
  const attack = fighter.attack
  if (!attack || !isChainAttack(attack)) return null
  const stage = STAGES[attack.moveId ?? ''] ?? (attack.kind === 'special' ? 2 : 0)
  const data = attackData(attack.kind, fighter)
  const recovery = attack.frame - data.startup - data.active
  const progress =
    recovery > 0 ? 1 - smooth(recovery / data.recovery) : smooth(attack.frame / data.startup)
  return {
    stage,
    mode: stage === 3 ? 'healing' : 'attack',
    extension: 0.06 + progress * 0.94,
    reach: data.box.right,
  }
}

function isChainAttack(attack: NonNullable<ArcadeFighter['attack']>): boolean {
  return Boolean(attack.moveId?.startsWith('kurapika:') || attack.hatsuSource === 'kurapika')
}

function smooth(value: number): number {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}
