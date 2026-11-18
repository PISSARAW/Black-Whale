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
  source: 'Hunter × Hunter — physical disguises, chapters 26 and 118',
  evidence: 'manga-shown',
  conditions: [
    'Physical needles hold the Gittarackur alteration; removing them restores the original appearance.',
    'The Hisoka face imitation can be held without needles for around four to five hours; the original eyes remain.',
  ],
  prohibitions: [
    'No mind control of the opponent.',
    'No healing, invulnerability or defensive bonus.',
    'The model’s clothes, body, identity and Hatsu are not acquired.',
  ],
  narrativeCost:
    'Illumi describes the physical alteration as painful. Twenty aura and thirty preparation frames are duel tuning.',
  narrativeEffect:
    'Physical face alteration with needles or the demonstrated unpinned imitation. Four hours is the duel’s chosen lower bound within the stated range.',
}

export function illumiCanon(slot: MoveSlot): TechniqueCanonContract {
  return slot === 'backSpecial' ? DISGUISE : CONTROL
}
