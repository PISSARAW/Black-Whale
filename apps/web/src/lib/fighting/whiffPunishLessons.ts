import type { CombatRoute } from './combatRoutes'

export const WHIFF_PUNISH_LESSONS: readonly CombatRoute[] = [
  {
    id: 'kurapika:whiff-chain',
    fighter: 'kurapika',
    kind: 'punish',
    title: ['Faire manquer puis reprendre la distance', 'Make it miss and reclaim space'],
    moves: ['forwardLight', 'forwardSpecial'],
    requirement: [
      'Recule pendant le coup lourd, puis avance et frappe léger. Le fouet divinatoire requiert le Ten et 24 points d’aura.',
      'Back away from the heavy, then press forward and light. Dowsing Whip requires Ten and 24 aura.',
    ],
    whiff: { opponent: 'chrollo', gap: 10.5 },
  },
  {
    id: 'hisoka:whiff-gum',
    fighter: 'hisoka',
    kind: 'punish',
    title: ['Faire manquer puis poser un lien', 'Make it miss and attach a tether'],
    moves: ['forwardLight', 'neutralSpecial'],
    requirement: [
      'Recule pendant le coup lourd, puis avance et frappe léger. La pose de Bungee Gum requiert le Ten et 40 points d’aura.',
      'Back away from the heavy, then press forward and light. Attaching Bungee Gum requires Ten and 40 aura.',
    ],
    whiff: { opponent: 'benjamin', gap: 10, retreatFrames: 12 },
  },
  {
    id: 'hisoka:whiff-tether',
    fighter: 'hisoka',
    kind: 'punish',
    title: ['Faire manquer puis exploiter le lien', 'Make it miss and use the tether'],
    moves: ['forwardLight', 'forwardHeavy', 'finisher'],
    requirement: [
      'Le Bungee Gum est déjà attaché au début de cet exercice. Le coup final requiert un lien actif et 55 points d’aura.',
      'Bungee Gum is already attached for this drill. The finisher requires an active tether and 55 aura.',
    ],
    setup: 'bungee',
    whiff: { opponent: 'benjamin', gap: 10, retreatFrames: 12 },
  },
  {
    id: 'franklin:whiff-low',
    fighter: 'franklin',
    kind: 'punish',
    title: ['Faire manquer puis tirer au ras du sol', 'Make it miss and fire low'],
    moves: ['forwardLight', 'downSpecial'],
    hits: [1, 10],
    requirement: [
      'Recule pendant le coup lourd, puis avance et frappe léger. La rafale basse touche une cible accroupie et requiert 20 points d’aura.',
      'Back away from the heavy, then press forward and light. Low fire hits a crouching target and requires 20 aura.',
    ],
    whiff: { opponent: 'benjamin', gap: 12.5 },
  },
]
