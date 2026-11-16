import type { TechniqueCanonContract } from './techniqueContracts'
import type { MoveSlot } from './types'

const CONTROL: TechniqueCanonContract = {
  source: 'Hunter × Hunter — Needle People, chapters 326–329',
  evidence: 'manga-stated',
  conditions: [
    'A real aura-imbued special needle must enter the skull.',
    'Issue an order to the implanted target.',
  ],
  prohibitions: [
    'No generic aura drain or temporary paralysis.',
    'No control from ordinary thrown needles or body blows.',
  ],
  narrativeCost:
    'Needle People destroys the victim’s autonomy and leaves survivors permanently impaired.',
  narrativeEffect:
    'A disposable puppet executes its instruction. The selected simple orders, movement speed and resetting bodies each round are duel adaptations.',
}
const DISGUISE: TechniqueCanonContract = {
  source: 'Hunter × Hunter — Illumi’s physical disguises in the Hunter Exam and Yorknew arcs',
  evidence: 'manga-shown',
  conditions: ['Physical needles reshape the user’s own face and skin.'],
  prohibitions: [
    'No mind control of the opponent.',
    'No healing, invulnerability or defensive bonus.',
  ],
  narrativeCost:
    'Illumi describes the physical alteration as painful. Twenty aura and thirty preparation frames are duel tuning.',
  narrativeEffect:
    'A visibly altered face held by physical needles; removal restores the appearance.',
}

export function illumiCanon(slot: MoveSlot): TechniqueCanonContract {
  return slot === 'backSpecial' ? DISGUISE : CONTROL
}
