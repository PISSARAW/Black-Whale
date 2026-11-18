import type { CombatRouteSetup } from './combatRouteSetup'
import type { FighterId, MoveSlot } from './types'

interface WhiffPunishVariant {
  slot: Extract<MoveSlot, 'neutralSpecial' | 'forwardSpecial' | 'downSpecial' | 'finisher'>
  via?: 'forwardHeavy'
  setup?: CombatRouteSetup
  requirement: readonly [string, string]
}

// These moves hit from the lesson spacing with their native timing and permissions.
export const WHIFF_PUNISH_VARIANTS: Partial<Record<FighterId, WhiffPunishVariant>> = {
  chrollo: {
    slot: 'neutralSpecial',
    via: 'forwardHeavy',
    requirement: [
      'Après être revenu au jab, confirme la frappe lourde. La marque Soleil exige le livre ouvert sur Sun and Moon, une main libre et 24 points d’aura.',
      'Step back in with a jab and confirm the heavy. The Sun mark requires Sun and Moon open in the book, a free hand and 24 aura.',
    ],
  },
  benjamin: {
    slot: 'neutralSpecial',
    requirement: [
      'Air Blow exige son héritage actif, le Nen disponible et 40 points d’aura.',
      'Air Blow requires its active inheritance, usable Nen and 40 aura.',
    ],
  },
  feitan: {
    slot: 'forwardSpecial',
    requirement: [
      'Confirme le léger avant de dépenser 24 points d’aura pour l’estoc du parapluie.',
      'Confirm the light before spending 24 aura on the umbrella thrust.',
    ],
  },
  saiyu: {
    slot: 'forwardSpecial',
    requirement: [
      'Kikazaru coûte 24 points d’aura et retire l’ouïe à la touche.',
      'Kikazaru costs 24 aura and removes hearing on hit.',
    ],
  },
  theta: {
    slot: 'downSpecial',
    requirement: [
      'Confirme le léger pour placer un vrai tir aux jambes. Theta doit disposer de son arme.',
      'Confirm the light to land an actual shot to the legs. Theta must have her weapon.',
    ],
  },
  biscuit: {
    slot: 'finisher',
    setup: 'true-form',
    requirement: [
      'Biscuit révèle son corps naturel avant l’exercice. Le coup final exige cette forme et 55 points d’aura.',
      'Biscuit reveals her natural body before the drill. The finisher requires that form and 55 aura.',
    ],
  },
  machi: {
    slot: 'forwardSpecial',
    requirement: [
      'L’aiguille de pistage coûte 24 points d’aura. Elle prépare la suite après ce combo.',
      'The tracking needle costs 24 aura. It sets up another exchange after this combo.',
    ],
  },
  kalluto: {
    slot: 'forwardSpecial',
    setup: 'paper',
    requirement: [
      'L’exercice commence avec un fragment déjà posé au torse. La frappe exige ce fragment et 24 points d’aura.',
      'The drill starts with a paper fragment already on the torso. The strike requires that fragment and 24 aura.',
    ],
  },
  shizuku: {
    slot: 'forwardSpecial',
    requirement: [
      'Confirme le léger puis dépense 24 points d’aura dans une frappe de Blinky.',
      'Confirm the light, then spend 24 aura on a Blinky strike.',
    ],
  },
  gel: {
    slot: 'forwardSpecial',
    requirement: [
      'La frappe du bras étendu coûte 24 points d’aura. Profite de son allonge pendant la confirmation.',
      'The extended-arm strike costs 24 aura. Use its reach while the hit is confirmed.',
    ],
  },
  beyond: {
    slot: 'forwardSpecial',
    requirement: [
      'Confirme avant de dépenser 24 points d’aura dans une frappe physique renforcée au Ren.',
      'Confirm the hit before spending 24 aura on a Ren-powered physical strike.',
    ],
  },
}
