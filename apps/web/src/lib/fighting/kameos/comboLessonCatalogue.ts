import type { CombatRoute, CombatFighter } from '../combatRoutes'
import { FIGHTING_ROSTER } from '../roster'
import type { MoveSlot } from '../types'
import { KAMEO_IDS } from './catalogue'
import { KAMEO_ROSTER_ROUTES } from './comboRosterRoutes'
import type { KameoCallId, KameoId } from './types'

export interface KameoComboLesson {
  id: KameoId
  call: KameoCallId
  /** Call after this many confirmed attack commands, while continuing the route. */
  afterStep: number
  /** Let the support land and the leader recover before this attack. */
  waitBeforeStep?: number
  /** A confirmed native cancel may follow the effect without waiting for recovery. */
  allowCancel?: boolean
  /** Stage this native attack so the effect arrives no later than its contact. */
  landBeforeStep?: number
}

const REQUIREMENTS: Record<KameoId, readonly [string, string]> = {
  luzurus: [
    'Appelle Luzurus vers l’avant après la première touche. Après le lourd, attends le piège et la fin de ton geste, puis place le léger avant. Le piège ne saisit qu’une cible au sol.',
    'Call Luzurus forward after the first hit. After the heavy, wait for the trap and your recovery, then use forward light. The trap only catches a grounded target.',
  ],
  zhanglei: [
    'Appelle Zhang Lei en arrière après la première touche. Sa pièce renforce la fin de la rafale ; elle ne compte pas comme une touche.',
    'Call Zhang Lei back after the first hit. His coin strengthens the end of the barrage; it does not count as a hit.',
  ],
  marayam: [
    'Appelle Marayam en arrière après la première touche pour protéger la fin de la rafale. Le soutien ne prolonge pas le hitstun adverse.',
    'Call Marayam back after the first hit to protect the end of the barrage. The support does not extend enemy hitstun.',
  ],
  tubeppa: [
    'Appelle Tubeppa en arrière après la première touche pour récupérer des PV pendant la rafale. Le soin ne compte pas comme une touche.',
    'Call Tubeppa back after the first hit to recover health during the barrage. Healing does not count as a hit.',
  ],
  morena: [
    'Appelle Morena vers l’avant après la première touche. Contagion doit atteindre sa cible à portée pendant la rafale ; une garde ou un évitement peut empêcher son effet.',
    'Call Morena forward after the first hit. Contagion must reach its target during the barrage; a block or avoidance can stop its effect.',
  ],
  salesale: [
    'Appelle Salé-salé vers l’avant après la première touche. Sa brume affaiblit la cible à portée pendant la rafale, sans ajouter de touche.',
    'Call Sale-sale forward after the first hit. His smoke weakens a target in range during the barrage without adding a hit.',
  ],
}

const TITLES = {
  luzurus: ['Luzurus · prolonger au sol', 'Luzurus · grounded extension'],
  zhanglei: ['Zhang Lei · renforcer la suite', 'Zhang Lei · boost the follow-up'],
  marayam: ['Marayam · couvrir la récupération', 'Marayam · cover recovery'],
  tubeppa: ['Tubeppa · soigner pendant le combo', 'Tubeppa · heal during the combo'],
  morena: ['Morena · affaiblir pendant le combo', 'Morena · weaken during the combo'],
  salesale: ['Salé-salé · couvrir la zone', 'Sale-sale · zone support'],
} as const

function comboPlan(fighter: CombatFighter, id: KameoId) {
  const barrage = fighter === 'franklin' && id !== 'luzurus'
  const native = KAMEO_ROSTER_ROUTES[fighter]
  const preCall = !barrage && id !== 'luzurus' && native.preCall === true
  const moves: readonly MoveSlot[] = barrage
    ? ['standingLight', 'standingHeavy', 'forwardSpecial']
    : id === 'luzurus'
      ? native.ground
      : native.support
  return { barrage, native, preCall, moves }
}

function lesson(fighter: CombatFighter, id: KameoId): CombatRoute {
  const { barrage, native, preCall, moves } = comboPlan(fighter, id)
  return {
    id: `${fighter}:kameo-${id}`,
    fighter,
    kind: 'confirm',
    title:
      barrage && id === 'zhanglei'
        ? ['Zhang Lei · renforcer la rafale', 'Zhang Lei · boost the barrage']
        : TITLES[id],
    moves,
    hits: barrage ? [1, 1, 10] : undefined,
    requirement: barrage ? REQUIREMENTS[id] : physicalRequirement(id, preCall),
    kameo: {
      id,
      call: ['luzurus', 'morena', 'salesale'].includes(id) ? 'forward' : 'back',
      afterStep: preCall ? 0 : 1,
      ...(id === 'luzurus' ? { waitBeforeStep: moves.length - 1 } : {}),
      ...(native.align && id !== 'luzurus' ? { landBeforeStep: moves.length - 1 } : {}),
    },
  }
}

function physicalRequirement(id: KameoId, preCall: boolean): readonly [string, string] {
  const effect = {
    luzurus: [
      'Le piège doit saisir la cible au sol avant le dernier coup.',
      'The trap must catch a grounded target before the final strike.',
    ],
    zhanglei: [
      'Le bonus de pièce doit être actif au contact de la dernière frappe.',
      'The coin bonus must be active when the final strike connects.',
    ],
    marayam: [
      'L’isolement couvre la fin de la route et ta récupération.',
      'Isolation covers the end of the route and your recovery.',
    ],
    tubeppa: [
      'Le soin doit atteindre ton combattant ; l’exercice commence avec 40 PV manquants.',
      'Healing must reach your fighter; the exercise starts with 40 missing health.',
    ],
    morena: [
      'Contagion doit toucher à portée ; garde et évitements conservent leurs effets.',
      'Contagion must reach its target; blocking and avoidance keep their effects.',
    ],
    salesale: ['La cible doit être à portée de la brume.', 'The target must be in smoke range.'],
  } as const
  const direction = ['luzurus', 'morena', 'salesale'].includes(id)
  return [
    `Appelle le kaméo ${preCall ? 'avec la première attaque' : 'après la première touche'} ${direction ? 'vers l’avant' : 'en arrière'} et continue la route. ${effect[id][0]} Le kaméo doit être prêt, vivant et avoir 20 aura.`,
    `Call support ${preCall ? 'with the opening attack' : 'after the first hit'} ${direction ? 'forward' : 'back'} and continue the route. ${effect[id][1]} Support must be ready, alive and have 20 aura.`,
  ]
}

export const KAMEO_COMBO_LESSONS: readonly CombatRoute[] = FIGHTING_ROSTER.flatMap(({ id }) =>
  KAMEO_IDS.map((support) => lesson(id as CombatFighter, support)),
)
