import type { TechniqueCanonContract } from './techniqueContracts'

const transformation: TechniqueCanonContract = {
  source: 'Hunter × Hunter — chapters 390–391 and 398, Biohazard',
  evidence: 'gameplay-abstraction',
  conditions: [
    'Touch a real carried object; handcuffs become a controlled pigeon and retain their locking function.',
  ],
  prohibitions: [
    'No animal from nothing, self-transformation, global combat buff, aura bullet or forced Zetsu.',
  ],
  narrativeCost:
    'Two physical pairs, 20 aura and 18 vulnerable preparation frames are duel tuning. Copies require equipment.',
  narrativeEffect:
    'A visible pigeon can lock a grounded opponent; guard, evasion and strikes prevent contact. A 48-frame restraint ends on injury and grants 90 frames against recapture, as duel adaptations.',
}

export const BIOHAZARD_CANON: Record<string, TechniqueCanonContract> = {
  'hinrigh:neutralSpecial': transformation,
  'hinrigh:downSpecial': {
    ...transformation,
    narrativeEffect:
      'Recall surviving free pigeons. Unlock and recover latched handcuffs only at hand contact; no remote transformation or equipment creation.',
  },
}
