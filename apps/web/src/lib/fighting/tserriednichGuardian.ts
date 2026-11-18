import { voluntaryNenAvailable } from './nenAccess'
import { speakPaperWords, voiceAvailable } from './kallutoListening'
import { canHear } from './melodyRules'
import { updateEntity } from './preparationWorld'
import { priorityLineOfSight } from './priorityOptics'
import type { PreparedEntity } from './preparationTypes'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState, ArcadeFighter } from './types'

declare module './types' {
  interface ArcadeFighter {
    guardianWarnings?: { owner: FightSide; count: number; frame: number }
    guardianWords?: { frame: number; text: string }
  }
}
const PRINCES = new Set([
  'benjamin',
  'camilla',
  'halkenburg',
  'tserriednich',
  'zhanglei',
  'tubeppa',
  'tyson',
  'luzurus',
  'salesale',
  'kacho',
  'fugetsu',
  'momoze',
  'marayam',
  'woble',
])
export function guardianActive(actor: ArcadeFighter): boolean {
  return (
    actor.id === 'tserriednich' &&
    voluntaryNenAvailable(actor, { requireHatsu: false, requireReserve: true })
  )
}

/** Only a deliberately supplied lie is known. Free text is never classified by an omniscient parser. */
export function resolveGuardianLie(
  state: FightState,
  speaker: FightSide,
  lie: boolean,
): FightState {
  const owner = speaker === 'player' ? 'opponent' : 'player'
  const target = state[speaker]
  if (!lie || !guardianCanWarn(state, speaker)) return state
  const count = Math.min(2, (target.guardianWarnings?.count ?? 0) + 1)
  return {
    ...state,
    [speaker]: {
      ...target,
      health: count === 1 ? Math.max(1, target.health - 1) : target.health,
      openWounds: count === 1 ? (target.openWounds ?? 0) + 1 : target.openWounds,
      guardianWarnings: { owner, count, frame: state.frame },
      guardianWords:
        count === 2
          ? {
              frame: state.frame,
              text: 'Tu as menti une deuxième fois. La prochaine fois, tu ne seras plus humain.',
            }
          : target.guardianWords,
    },
  }
}
function guardianCanWarn(state: FightState, speaker: FightSide): boolean {
  const prince = state[speaker === 'player' ? 'opponent' : 'player'],
    target = state[speaker]
  return (
    guardianActive(prince) &&
    !PRINCES.has(target.id) &&
    canHear(prince) &&
    Math.hypot(prince.x - target.x, prince.y - target.y) <= 6 &&
    priorityLineOfSight(state, {
      x: prince.x,
      y: prince.y + 10,
      targetX: target.x,
      targetY: target.y + 10,
    })
  )
}
export function performGuardianStatement({ state, side, command }: ArsenalInvocation): FightState {
  if (
    command.action !== 'guardian-answer' ||
    !['truth', 'lie'].includes(command.target ?? '') ||
    !voiceAvailable(state, side)
  )
    return state
  if (!guardianActive(state[side === 'player' ? 'opponent' : 'player'])) return state
  const spoken = speakPaperWords(state, side, 'Je compte te protéger.')
  return resolveGuardianLie(spoken, side, command.target === 'lie')
}
export function advanceTserriednichGuardian(state: FightState): FightState {
  for (const side of ['player', 'opponent'] as const) {
    const actor = state[side]
    if (!guardianActive(actor)) continue
    for (const entity of state.battlefield?.entities ?? []) {
      if (!hostileSpy(entity, side)) continue
      if (!guardianReaches(state, actor, entity)) continue
      state = updateEntity(state, entity.id, { present: false, health: 0, controller: undefined })
    }
  }
  return state
}
function hostileSpy(entity: PreparedEntity, side: FightSide): boolean {
  return (
    entity.kind === 'animal' &&
    entity.present &&
    entity.controller?.source === 'sayird' &&
    entity.controller.side !== side
  )
}
function guardianReaches(state: FightState, actor: ArcadeFighter, entity: PreparedEntity): boolean {
  return (
    Math.hypot(entity.x - actor.x, entity.y - actor.y) <= 4 &&
    priorityLineOfSight(state, {
      x: actor.x,
      y: actor.y + 2,
      targetX: entity.x,
      targetY: entity.y + 2,
    })
  )
}
export function guardianStatementOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!guardianActive(state[side === 'player' ? 'opponent' : 'player'])) return []
  return (['truth', 'lie'] as const).map((target) => {
    const command = { action: 'guardian-answer' as const, target }
    return {
      command,
      ready: voiceAvailable(state, side),
      labelFr: target === 'lie' ? 'Promesse volontairement mensongère' : 'Promesse sincère',
      labelEn: target === 'lie' ? 'Deliberately false promise' : 'Sincere promise',
      conditionFr:
        'La bête gardienne est autonome et distincte du futur parallèle. Un mensonge déclaré au contact produit les deux avertissements montrés. Le troisième effet reste inconnu et n’est pas inventé. Sous Zetsu, la bête est absente.',
      conditionEn:
        'The autonomous guardian is separate from Parallel Future. A declared lie at contact produces the two shown warnings. The third effect remains unknown and is not invented. The beast is absent in Zetsu.',
    }
  })
}
