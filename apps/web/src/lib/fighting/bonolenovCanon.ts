import type { TechniqueCanonContract } from './techniqueContracts'

const dance = 'Dance and music from the Gyudondond body holes must precede each piece.'
const tuning = 'Preparation frames, aura, sound radius and hitboxes are explicit duel tuning.'
export const BONOLENOV_CANON: Readonly<Record<string, TechniqueCanonContract>> = {
  'bonolenov:neutralSpecial': {
    source: 'Battle Cantabile: Prologue',
    evidence: 'gameplay-abstraction',
    conditions: [dance],
    prohibitions: ['No generic damage or defence multiplier.'],
    narrativeCost: tuning,
    narrativeEffect: 'Conjures the warrior attire and spear after an interruptible dance.',
  },
  'bonolenov:forwardSpecial': {
    source: 'Battle Cantabile: Prologue — spear',
    evidence: 'gameplay-abstraction',
    conditions: ['Prologue must have actually conjured the spear.'],
    prohibitions: ['No spear before the dance.'],
    narrativeCost: tuning,
    narrativeEffect: 'A physical thrust with the conjured spear.',
  },
  'bonolenov:finisher': {
    source: 'Battle Cantabile: Jupiter',
    evidence: 'gameplay-abstraction',
    conditions: [dance, 'A designated target remains within the spatial range of the music.'],
    prohibitions: ['No defensive Jupiter, instant melee finisher or ordinary aura bullet.'],
    narrativeCost: tuning,
    narrativeEffect:
      'A giant sphere starts around the performer, pursues its target and crushes on contact.',
  },
  'bonolenov:downSpecial': {
    source: 'Battle Cantabile: Metamorphosen — chapters 377 and 405',
    evidence: 'gameplay-abstraction',
    conditions: [
      dance,
      'A spoken exchange with the model has occurred.',
      'Duration cannot exceed measured co-presence with that model.',
    ],
    prohibitions: ['No copied Nen ability, stat boost, invulnerability or indefinite disguise.'],
    narrativeCost:
      'Models must be encountered and spoken with in the actual fight; remembered models remain selectable. T/V exchanges, nearby time, fixed collision shape and preparation time adapt the dialogue to a duel.',
    narrativeEffect:
      'Adopts the model’s appearance for the earned duration, without changing the fighter’s own identity or powers.',
  },
  'bonolenov:backSpecial': {
    source: 'Battle Cantabile — voluntary cessation',
    evidence: 'gameplay-abstraction',
    conditions: ['An existing dance, outfit, sphere or appearance.'],
    prohibitions: ['Never grants an evasion or a hit.'],
    narrativeCost: 'No refund for an interrupted preparation.',
    narrativeEffect: 'Stops the music, dismisses the construct and restores the native appearance.',
  },
}
