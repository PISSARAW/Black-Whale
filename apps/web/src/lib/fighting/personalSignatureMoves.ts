import type { FighterMove, MoveTuning } from './movesetTypes'

export const FEITAN_FINAL_REVERSAL = 'feitan:scabbard-reversal'

interface PersonalSignatureMove {
  tuning: Partial<MoveTuning>
  cancelWindow?: FighterMove['cancelWindow']
  material?: 'blade' | 'chain' | 'boot'
  chainTarget?: 'ankle' | 'torso'
}

export const PERSONAL_SIGNATURE_MOVES: Readonly<Record<string, PersonalSignatureMove>> = {
  'feitan:scabbard-reversal-opening': {
    tuning: { startup: 7, active: 4, reach: 15.5, bottom: 3, top: 9, lunge: 2.8, hitstop: 4 },
    cancelWindow: { start: 2, end: 10 },
    material: 'blade',
  },
  'feitan:scabbard-reversal-transition': {
    tuning: {
      startup: 6,
      active: 4,
      reach: 14,
      bottom: 1.8,
      top: 7.2,
      lunge: 2.1,
      hitstun: 18,
      hitstop: 5,
    },
    cancelWindow: { start: 2, end: 10 },
    material: 'blade',
  },
  [FEITAN_FINAL_REVERSAL]: {
    tuning: {
      startup: 12,
      active: 5,
      recovery: 24,
      reach: 16,
      bottom: 2.8,
      top: 13,
      lunge: 3.4,
      knockback: 7.2,
      hitstop: 1,
    },
    material: 'blade',
  },
  'kurapika:chain-heel-opening': {
    tuning: {
      startup: 10,
      active: 4,
      recovery: 13,
      reach: 23,
      lunge: 0,
      hitstun: 23,
      hitstop: 4,
      knockback: 0.45,
    },
    cancelWindow: { start: 2, end: 11 },
    material: 'chain',
    chainTarget: 'ankle',
  },
  'kurapika:chain-heel-transition': {
    tuning: {
      startup: 8,
      active: 3,
      recovery: 16,
      reach: 23,
      lunge: 0,
      hitstun: 24,
      hitstop: 5,
      knockback: -4.8,
    },
    cancelWindow: { start: 2, end: 11 },
    material: 'chain',
    chainTarget: 'torso',
  },
  'kurapika:chain-heel': {
    tuning: {
      startup: 10,
      active: 5,
      recovery: 21,
      reach: 13,
      lunge: 1.8,
      knockback: 4.6,
      hitstop: 10,
    },
    material: 'boot',
  },
}
