import type { FighterId } from './types'

export type EasterEggSlot = 1 | 2 | 3 | 4
export type EasterEggFighter = 'hisoka' | 'kurapika' | 'leorio' | 'rihan'
export interface EasterEggDefinition {
  slot: EasterEggSlot
  name: { fr: string; en: string }
  frames: number
  hint: { fr: string; en: string }
}

/** Authored comic interludes, not additional canonical abilities or quoted dialogue. */
export const EASTER_EGGS: Record<EasterEggFighter, readonly EasterEggDefinition[]> = {
  hisoka: [
    {
      slot: 1,
      name: { fr: 'Au bout des doigts', en: 'At his fingertips' },
      frames: 90,
      hint: { fr: 'Une carte roule entre ses doigts.', en: 'A card rolls between his fingers.' },
    },
    {
      slot: 2,
      name: { fr: 'Approche donc', en: 'Come closer' },
      frames: 84,
      hint: {
        fr: 'Une invitation beaucoup trop polie.',
        en: 'An invitation that is far too polite.',
      },
    },
    {
      slot: 3,
      name: { fr: 'Équilibre précaire', en: 'Delicate balance' },
      frames: 150,
      hint: { fr: 'Un château de cartes prend forme.', en: 'A house of cards takes shape.' },
    },
    {
      slot: 4,
      name: { fr: 'La carte de trop', en: 'One card too many' },
      frames: 180,
      hint: {
        fr: 'Terminer les gestes 1, 2 puis 3 dans cette manche.',
        en: 'Finish gestures 1, 2, then 3 in this round.',
      },
    },
  ],
  kurapika: [
    {
      slot: 1,
      name: { fr: 'Sous la manche', en: 'Under the sleeve' },
      frames: 84,
      hint: {
        fr: 'Il ajuste la manche qui couvre ses chaînes.',
        en: 'He adjusts the sleeve over his chains.',
      },
    },
    {
      slot: 2,
      name: { fr: 'Un avertissement', en: 'A warning' },
      frames: 108,
      hint: { fr: 'La chaîne apparaît, sans un mot.', en: 'The chain appears, without a word.' },
    },
    {
      slot: 3,
      name: { fr: 'Le pendule', en: 'The pendulum' },
      frames: 150,
      hint: { fr: 'Son regard suit un lent balancement.', en: 'His eyes follow a slow swing.' },
    },
    {
      slot: 4,
      name: { fr: 'Face à l’Araignée', en: 'Facing the Spider' },
      frames: 150,
      hint: {
        fr: 'Affronter un membre de la Brigade Fantôme.',
        en: 'Face a member of the Phantom Troupe.',
      },
    },
  ],
  leorio: [
    {
      slot: 1,
      name: { fr: 'Mise au point', en: 'In focus' },
      frames: 72,
      hint: { fr: 'Il remonte ses lunettes.', en: 'He pushes up his glasses.' },
    },
    {
      slot: 2,
      name: { fr: 'Une seconde !', en: 'One second!' },
      frames: 108,
      hint: { fr: 'Il proteste avec de grands gestes.', en: 'He protests with broad gestures.' },
    },
    {
      slot: 3,
      name: { fr: 'Où est-ce passé ?', en: 'Where did it go?' },
      frames: 150,
      hint: { fr: 'Il fouille sa mallette.', en: 'He searches his briefcase.' },
    },
    {
      slot: 4,
      name: { fr: 'Ah, le voilà…', en: 'Ah, there it is…' },
      frames: 180,
      hint: {
        fr: 'Terminer les gestes 1, 2 puis 3 dans cette manche.',
        en: 'Finish gestures 1, 2, then 3 in this round.',
      },
    },
  ],
  rihan: [
    {
      slot: 1,
      name: { fr: 'Première hypothèse', en: 'First hypothesis' },
      frames: 96,
      hint: { fr: 'Il prend le temps de réfléchir.', en: 'He takes a moment to think.' },
    },
    {
      slot: 2,
      name: { fr: 'Changer d’angle', en: 'Another angle' },
      frames: 120,
      hint: {
        fr: 'Il examine l’adversaire de la tête aux pieds.',
        en: 'He studies his opponent from head to toe.',
      },
    },
    {
      slot: 3,
      name: { fr: 'Analyse en cours', en: 'Analysis in progress' },
      frames: 180,
      hint: {
        fr: 'Laisser son monologue intérieur aller au bout.',
        en: 'Let his internal monologue finish.',
      },
    },
    {
      slot: 4,
      name: { fr: 'Informations insuffisantes', en: 'Insufficient information' },
      frames: 210,
      hint: {
        fr: 'Terminer « Analyse en cours » dans cette manche.',
        en: 'Finish “Analysis in progress” in this round.',
      },
    },
  ],
}

export function easterEggsFor(id: FighterId): readonly EasterEggDefinition[] {
  return Object.hasOwn(EASTER_EGGS, id) ? EASTER_EGGS[id as EasterEggFighter] : []
}

export function easterEggDefinition(id: FighterId, slot: EasterEggSlot) {
  return easterEggsFor(id).find((egg) => egg.slot === slot)
}

export const eggBit = (slot: EasterEggSlot) => 1 << (slot - 1)
