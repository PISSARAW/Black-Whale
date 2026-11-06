import type { ApparitionKind } from './apparitions'

/** References describe anatomy; dimensions are staging in metres, not manga measurements. */
export const GUARDIAN_PRESENTATION: Partial<
  Record<
    ApparitionKind,
    {
      size: number
      bottom: number
      height: number
      anchor: 'floor' | 'hover' | 'shoulders'
    }
  >
> = {
  'benjamin-guardian': { size: 0.65, bottom: 0, height: 3.2, anchor: 'shoulders' },
  'halkenburg-guardian': { size: 0.7, bottom: -0.3, height: 3.5, anchor: 'shoulders' },
  'nasubi-guardian': { size: 0.95, bottom: -0.3, height: 3.5, anchor: 'floor' },
  medusa: { size: 1, bottom: -1.9, height: 2.9, anchor: 'floor' },
  chimera: { size: 0.9, bottom: 0, height: 3.35, anchor: 'floor' },
  toad: { size: 0.95, bottom: -0.95, height: 2.1, anchor: 'floor' },
  wheel: { size: 0.7, bottom: -1.9, height: 3.8, anchor: 'hover' },
  'tyson-guardian': { size: 0.65, bottom: -1.65, height: 3.15, anchor: 'hover' },
  centipede: { size: 0.6, bottom: -1, height: 2.55, anchor: 'floor' },
  mouths: { size: 0.85, bottom: -1.3, height: 2.6, anchor: 'hover' },
  sprite: { size: 1.15, bottom: 0, height: 3.3, anchor: 'floor' },
  dragon: { size: 0.85, bottom: -0.1, height: 3.2, anchor: 'floor' },
}

/** No placeholder body is allowed for a design the source has not drawn. */
export const UNREVEALED_NEN_APPEARANCES = {
  'prince-woble': 'Only the ominous aura is attested (ch. 358).',
  'third-lie-transformation': 'The warning gives no resulting anatomy (ch. 385).',
  'three-monkeys': 'Saiyu describes their functions, not their designs (ch. 349).',
} as const

export const NEN_MODEL_REFERENCES = {
  double: { chapters: [381, 400], design: 'Kacho: same named human figure, opaque.' },
  fish: { chapters: [97], design: 'Open ribs, spine, skull and fins.' },
  hoover: { chapters: [71, 227], design: 'Blinky: eye stalks, toothed nozzle and tongue.' },
  cat: { chapters: [373], design: 'Black cat with long arms and prehensile hands.' },
  sprite: {
    chapters: [361],
    design: 'Round ears, forehead eye patterns, triangular teeth and heart.',
  },
  chimera: {
    chapters: [362, 384, 385],
    design: 'Human face, ringed arched neck, human forelimbs, heels and flail tail.',
  },
  dolphin: {
    chapters: [361],
    design: 'Ornamented dolphin device, syringes on both pectoral fins.',
  },
  cookie: {
    chapters: [201],
    design: 'Long straight hair, short-sleeved dress, dark apron and bow.',
  },
  'predator-salesale': {
    chapters: [375],
    design: 'Only the shown Salé-salé counter: four-lobed maw, hair and limbs.',
  },
  'tserriednich-second': {
    chapters: [384],
    design: 'Ribbed torso, knotted limbs and 666 abdominal seal.',
  },
  'benjamin-guardian': {
    chapters: [362, 363, 372],
    design: 'Elongated head, two mouths, bead eyes, collar spines and cape wings.',
  },
  'halkenburg-guardian': {
    chapters: [349, 382],
    design: 'Feathered cyclops ogre with horns, perched on shoulders.',
  },
  'nasubi-guardian': {
    chapters: [349],
    design: 'Two lateral masses, fourteen mounds per side, five human-handed limbs per side.',
  },
} as const
