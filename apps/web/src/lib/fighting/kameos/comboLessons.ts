import type { CombatRoute } from '../combatRoutes'
import { EMPTY_INPUT, type FightInput, type FightState } from '../types'
import type { KameoCallId, KameoId } from './types'

export interface KameoComboLesson {
  id: KameoId
  call: KameoCallId
  /** Call after this many confirmed attack commands, while continuing the route. */
  afterStep: number
  /** Let the support land and the leader recover before this attack. */
  waitBeforeStep?: number
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

export const KAMEO_COMBO_LESSONS: readonly CombatRoute[] = (
  ['luzurus', 'zhanglei', 'marayam', 'tubeppa', 'morena', 'salesale'] as const
).map((id) => ({
  id: `${id === 'luzurus' ? 'hisoka' : 'franklin'}:kameo-${id}`,
  fighter: id === 'luzurus' ? 'hisoka' : 'franklin',
  kind: 'confirm',
  title: (
    {
      luzurus: ['Luzurus · prolonger au sol', 'Luzurus · grounded extension'],
      zhanglei: ['Zhang Lei · renforcer la rafale', 'Zhang Lei · boost the barrage'],
      marayam: ['Marayam · couvrir la récupération', 'Marayam · cover recovery'],
      tubeppa: ['Tubeppa · soigner pendant le combo', 'Tubeppa · heal during the combo'],
      morena: ['Morena · affaiblir pendant le combo', 'Morena · weaken during the combo'],
      salesale: ['Salé-salé · couvrir la zone', 'Sale-sale · zone support'],
    } as const
  )[id],
  moves: ['standingLight', 'standingHeavy', id === 'luzurus' ? 'forwardLight' : 'forwardSpecial'],
  hits: id === 'luzurus' ? undefined : [1, 1, 10],
  requirement: REQUIREMENTS[id],
  kameo: {
    id,
    call: ['luzurus', 'morena', 'salesale'].includes(id) ? 'forward' : 'back',
    afterStep: 1,
    ...(id === 'luzurus' ? { waitBeforeStep: 2 } : {}),
  },
}))

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
    (!comboSupportLanded(state, lesson.id) || state.player.attack),
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
