import type { CombatRoute, CombatFighter } from '../combatRoutes'
import { FIGHTING_ROSTER } from '../roster'
import type { MoveSlot } from '../types'
import { KAMEO_IDS } from './catalogue'
import { EMPTY_INPUT, type FightInput, type FightState } from '../types'
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

// Authored from the leaders' native cancels, links, recovery and reach. No move tuning is changed.
const ROUTES: Partial<Record<CombatFighter, readonly MoveSlot[]>> = {
  kurapika: ['standingLight', 'backHeavy', 'forwardLight'],
  benjamin: ['standingLight', 'backHeavy', 'forwardLight'],
  hisoka: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardLight'],
  chrollo: ['standingLight', 'standingHeavy', 'backHeavy', 'forwardLight'],
  feitan: ['standingLight', 'forwardLight', 'backHeavy', 'standingLight'],
  hanzo: ['standingLight', 'forwardLight', 'backHeavy', 'standingLight'],
  saiyu: ['standingLight', 'standingHeavy', 'standingLight'],
  biscuit: ['standingLight', 'standingHeavy', 'standingLight'],
  franklin: ['standingLight', 'standingHeavy', 'standingLight'],
  machi: ['standingLight', 'standingHeavy', 'standingLight'],
  illumi: ['standingLight', 'standingHeavy', 'standingLight'],
  kalluto: ['standingLight', 'standingHeavy', 'standingLight'],
  shizuku: ['standingLight', 'forwardLight', 'standingHeavy', 'standingLight'],
  leorio: ['standingLight', 'forwardLight', 'standingHeavy', 'standingLight'],
}

function physicalRoute(fighter: CombatFighter, id: KameoId): readonly MoveSlot[] {
  if (id === 'luzurus' && fighter === 'hisoka')
    return ['standingLight', 'standingHeavy', 'forwardLight']
  if (id === 'luzurus' && fighter === 'chrollo')
    return ['standingLight', 'standingHeavy', 'standingLight']
  return ROUTES[fighter] ?? ['standingLight', 'standingHeavy', 'forwardLight']
}

function lesson(fighter: CombatFighter, id: KameoId): CombatRoute {
  const barrage = fighter === 'franklin' && id !== 'luzurus'
  const moves: readonly MoveSlot[] = barrage
    ? ['standingLight', 'standingHeavy', 'forwardSpecial']
    : physicalRoute(fighter, id)
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
    requirement: barrage ? REQUIREMENTS[id] : physicalRequirement(id),
    kameo: {
      id,
      call: ['luzurus', 'morena', 'salesale'].includes(id) ? 'forward' : 'back',
      afterStep: 1,
      ...(barrage ? {} : { waitBeforeStep: moves.length - 1 }),
      allowCancel: fighter === 'chrollo',
    },
  }
}

function physicalRequirement(id: KameoId): readonly [string, string] {
  const effect = {
    luzurus: [
      'Le piège doit saisir la cible au sol avant le dernier coup.',
      'The trap must catch a grounded target before the final strike.',
    ],
    zhanglei: [
      'Attends la pièce avant la dernière frappe pour la renforcer.',
      'Wait for the coin before the final strike to boost it.',
    ],
    marayam: [
      'Attends l’isolement avant la dernière frappe pour couvrir ta récupération.',
      'Wait for isolation before the final strike to cover recovery.',
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
    `Après la première touche, appelle le kaméo ${direction ? 'vers l’avant' : 'en arrière'} et continue la route. ${effect[id][0]} Le kaméo doit être prêt, vivant et avoir 20 aura.`,
    `After the first hit, call support ${direction ? 'forward' : 'back'} and continue the route. ${effect[id][1]} Support must be ready, alive and have 20 aura.`,
  ]
}

export const KAMEO_COMBO_LESSONS: readonly CombatRoute[] = FIGHTING_ROSTER.flatMap(({ id }) =>
  KAMEO_IDS.map((support) => lesson(id as CombatFighter, support)),
)

/** Observe the actual Hatsu on its recipient, rather than treating a paid call as a hit. */
export function comboSupportLanded(state: FightState, id: KameoId): boolean {
  switch (id) {
    case 'luzurus':
      return state.opponent.hatsuEffects.desireFrames > 0
    case 'zhanglei':
      return state.player.hatsuEffects.coinCharges > 0
    case 'marayam':
      return state.player.hatsuEffects.isolationFrames > 0
    case 'tubeppa':
      return state.player.health > state.player.maxHealth - 40
    case 'morena':
      return state.opponent.hatsuEffects.contagionStacks > 0
    case 'salesale':
      return state.opponent.hatsuEffects.smokeFrames > 0
  }
}

export function waitingForComboSupport(state: FightState, route: CombatRoute, step: number) {
  const lesson = route.kameo
  return Boolean(
    lesson &&
    lesson.waitBeforeStep === step &&
    (!comboSupportLanded(state, lesson.id) || (state.player.attack && !lesson.allowCancel)),
  )
}

/** Uses the same input bit and relative directions as a manual call, including hitstop. */
export function comboSupportInput(
  state: FightState,
  lesson: KameoComboLesson,
  step: number,
): FightInput {
  const slot = state.kameos?.player
  if (step < lesson.afterStep || slot?.phase !== 'reserve' || slot.cooldownFrames > 0)
    return EMPTY_INPUT
  const facing = state.player.facing
  return {
    ...EMPTY_INPUT,
    kameo: true,
    right: lesson.call === 'forward' ? facing === 1 : lesson.call === 'back' && facing === -1,
    left: lesson.call === 'forward' ? facing === -1 : lesson.call === 'back' && facing === 1,
  }
}
