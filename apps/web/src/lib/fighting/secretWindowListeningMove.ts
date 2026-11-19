import type { FighterMove } from './movesetTypes'

/** Chapter 366 establishes remote eavesdropping, not a ranged damaging attack. */
export function windowListeningMove(move: FighterMove): FighterMove {
  return {
    ...move,
    nameFr: 'Secret Window · Écoute',
    nameEn: 'Secret Window · Eavesdrop',
    auraCost: 16,
    canon: {
      source: 'Hunter × Hunter — chapter 366, Secret Window shoulder owl',
      evidence: 'manga-shown',
      conditions: [
        'Summon the shoulder bird; it relays actual nearby spoken words through barriers.',
      ],
      prohibitions: ['No damage, aura reading, thoughts, images or future knowledge.'],
      narrativeCost:
        'The 16 aura cost, startup and voice radius are scenario tuning, not manga conditions.',
      narrativeEffect:
        'A shoulder owl provides an eavesdropping application distinct from the contact owl.',
    },
    tuning: {
      ...move.tuning,
      startup: 12,
      active: 4,
      recovery: 18,
      damage: 0,
      lunge: 0,
      reach: 0,
      hitstun: 0,
      blockstun: 0,
      hitstop: 0,
      knockback: 0,
    },
  }
}
