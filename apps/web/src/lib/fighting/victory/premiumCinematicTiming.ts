import { ease } from './resources'

export interface PremiumImpactTiming {
  impact: number
  anticipation?: number
  freeze?: number
  recovery?: number
}

export interface PremiumImpactPhase {
  anticipation: number
  contact: number
  recoil: number
  settle: number
  stage: 'idle' | 'anticipation' | 'contact' | 'recovery'
}

function phaseStage(options: Pick<PremiumImpactPhase, 'anticipation' | 'contact' | 'recoil'>) {
  if (options.anticipation > 0) return 'anticipation' as const
  if (options.contact) return 'contact' as const
  if (options.recoil > 0) return 'recovery' as const
  return 'idle' as const
}

export function premiumImpactPhase(age: number, timing: PremiumImpactTiming): PremiumImpactPhase {
  const anticipationFrames = timing.anticipation ?? 12
  const freezeFrames = timing.freeze ?? 4
  const recoveryFrames = timing.recovery ?? 26
  const before = (age - (timing.impact - anticipationFrames)) / anticipationFrames
  const after = age - timing.impact
  const anticipation = after < 0 ? ease(before) : 0
  const contact = after >= 0 && after < freezeFrames ? 1 : 0
  const recoveryAge = Math.max(0, after - freezeFrames)
  const recoil = after >= 0 ? 1 - ease(recoveryAge / recoveryFrames) : 0
  const settle = after >= freezeFrames ? ease(recoveryAge / recoveryFrames) : 0
  const stage = phaseStage({ anticipation, contact, recoil })
  return { anticipation, contact, recoil, settle, stage }
}
