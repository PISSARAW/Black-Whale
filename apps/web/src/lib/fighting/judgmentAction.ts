import { performJudgmentExtra, judgmentExtraOptions, judgmentHostage } from './judgmentHostages'
import { troupeMember } from './troupeMembership'
import { fighterDefinition } from './roster'
import { usesVoluntaryNen } from './nenActionRules'
import { chainRuleDeath } from './kurapikaActions'
import { judgmentForbidsNen } from './judgmentRules'
import type { AuraAttackOptions } from './auraAttackAction'
import { canAct } from './fightActorState'
import { voluntaryNenAvailable } from './nenAccess'
import { chainAbilitySealed } from './kurapika'
import { forceZetsu } from './nen'
import { createJudgmentSeal, JUDGMENT_PRESETS, selectedJudgmentClauses } from './judgmentRules'
import { speakPaperWords } from './kallutoListening'
import { speechRecipient, recipientBody, recipientHears } from './fightSpeechRecipient'
import { canSpeak } from './saiyuSenses'
import type { JudgmentPreset } from './judgmentRules'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function declareJudgment(state: FightState, side: FightSide, moveId?: string): FightState {
  if (moveId !== 'kurapika:finisher') return state
  return {
    ...state,
    [side]: {
      ...state[side],
      judgmentDeclaration: {
        frame: state.frame,
        hostageId: judgmentHostage(state, side === 'player' ? 'opponent' : 'player')?.id,
        clauses: [...selectedJudgmentClauses(state[side])],
      },
    },
  }
}
export function implantJudgment(state: FightState, side: FightSide, target: FightSide): FightState {
  const initial = createJudgmentSeal(state[side], side, state.teamMatch?.seats[side].active ?? 0)
  const seal = withHostageDeadline(initial, state, side)
  const forbidsNen = (seal.clauses ?? [seal.rule]).includes('zetsu')
  const body = forbidsNen ? forceZetsu(state[target]) : state[target]
  return {
    ...state,
    [target]: {
      ...body,
      judgmentChain: seal,
      attack: forbidsNen ? null : body.attack,
      bufferedAttack: forbidsNen ? null : body.bufferedAttack,
    },
  }
}
export function performJudgmentCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (['judgment-reveal', 'judgment-return-hostage'].includes(command.action))
    return performJudgmentExtra({ state, side, command })
  return performJudgmentBase(state, side, command)
}
function performJudgmentBase(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  const fighter = state[side]
  if (command.action === 'judgment-call') return speakToReserve(state, side, command.target)
  if (!judgmentActorReady(fighter)) return state
  if (command.action === 'judgment-release') return releaseJudgment(state, side)
  if (!validJudgmentPreset(command)) return state
  if (chainAbilitySealed(fighter, 'kurapika:finisher')) return state
  if (
    command.target === 'hostage-secret' &&
    !judgmentHostage(state, side === 'player' ? 'opponent' : 'player')
  )
    return state
  return { ...state, [side]: { ...fighter, judgmentPreset: command.target as JudgmentPreset } }
}
function releaseJudgment(state: FightState, side: FightSide): FightState {
  const other = side === 'player' ? 'opponent' : 'player'
  if (state[other].judgmentChain?.owner !== side || !voluntaryNenAvailable(state[side]))
    return state
  if (chainAbilitySealed(state[side], 'kurapika:finisher')) return state
  return { ...state, [other]: { ...state[other], judgmentChain: undefined } }
}
function speakToReserve(state: FightState, side: FightSide, target?: string): FightState {
  const recipient = speechRecipient(state, side, target)
  if (!target || !recipient || recipient.reserve === undefined) return state
  if (!canSpeak(state[side]) || !recipientHears(state, side, recipient)) return state
  return speakPaperWords(state, side, { text: 'Je suis ici.', recipient: target })
}

export function judgmentOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const options: ArsenalOption[] = []
  if (state[side].id === 'kurapika') {
    for (const [preset, names] of Object.entries(PRESET_NAMES))
      options.push({
        command: { action: 'judgment-preset', target: preset },
        labelFr: `Judgment · ${names[0]}`,
        labelEn: `Judgment · ${names[1]}`,
        ready: judgmentCommandReady(state, side, { action: 'judgment-preset', target: preset }),
        conditionFr:
          'Choisir avant l’implantation ; les clauses déjà implantées ne sont pas modifiées.',
        conditionEn: 'Choose before implantation; existing implanted clauses are unchanged.',
      })
    options.push({
      command: { action: 'judgment-release' },
      labelFr: 'Judgment · Retirer ma chaîne',
      labelEn: 'Judgment · Remove my chain',
      ready: judgmentCommandReady(state, side, { action: 'judgment-release' }),
      conditionFr: 'Retirer volontairement sa propre chaîne ; aucune amnésie ni soin de la cible.',
      conditionEn: 'Voluntarily remove your own chain; no amnesia or healing of the target.',
    })
  }
  return [...options, ...judgmentExtraOptions(state, side), ...reserveSpeechOptions(state, side)]
}
function judgmentCommandReady(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): boolean {
  return performJudgmentCommand(state, side, command) !== state
}
const PRESET_NAMES: Record<JudgmentPreset, [string, string]> = {
  secret: ['Conserver le secret', 'Keep the secret'],
  'hostage-secret': [
    'Restituer l’otage et conserver le secret',
    'Return hostage and keep the secret',
  ],
  answers: ['Répondre sincèrement à mes questions', 'Answer my questions truthfully'],
  nen: ['Ne pas utiliser de Nen', 'Do not use Nen'],
  contact: ['Ne pas communiquer avec la Brigade', 'Do not contact the Troupe'],
  'nen-contact': [
    'Nen interdit + aucun contact avec la Brigade',
    'No Nen + no contact with the Troupe',
  ],
}
function reserveSpeechOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!state.teamMatch) return []
  return (['player', 'opponent'] as const).flatMap((seat) =>
    state.teamMatch!.seats[seat].members.flatMap((member, reserve) => {
      if (reserve === state.teamMatch!.seats[seat].active || member.health <= 0) return []
      const target = `reserve:${seat}:${reserve}`,
        recipient = speechRecipient(state, side, target)!
      return [
        {
          command: { action: 'judgment-call' as const, target },
          labelFr: `Parler à ${fighterDefinition(recipientBody(state, recipient).id).name} en réserve`,
          labelEn: `Speak to reserve ${fighterDefinition(member.id).name}`,
          ready: judgmentCommandReady(state, side, { action: 'judgment-call', target }),
          conditionFr:
            'Contact vocal réel au portique, à portée d’audition. Une clause interdisant la communication reste fatale.',
          conditionEn:
            'Real voice contact at the gate, within hearing range. A communication prohibition remains fatal.',
        },
      ]
    }),
  )
}

export function judgmentActionBreach(options: AuraAttackOptions): FightState | null {
  const { state, side } = options,
    fighter = state[side]
  if (!judgmentForbidsNen(fighter) || !canAct(fighter) || fighter.attack) return null
  const usesHatsu = usesVoluntaryNen(fighter, options)
  if (!usesHatsu && !options.auraCharged) return null
  if (
    !voluntaryNenAvailable(fighter, {
      allowVoluntaryZetsu: true,
      requireHatsu: usesHatsu,
      requireReserve: true,
    })
  )
    return null
  return chainRuleDeath(state, side)
}

/** The second demonstrated clause is useful when real Troupe recipients can be contacted. */
export function judgmentAiPreset(state: FightState): FightState | null {
  const actor = state.opponent
  if (actor.id !== 'kurapika' || !actor.kurapika?.emperorTime || state.player.judgmentChain)
    return null
  const desired = opposingTroupeReserve(state) ? 'nen-contact' : ordinaryAiPreset(state)
  if (actor.judgmentPreset === desired) return null
  const next = performJudgmentCommand(state, 'opponent', {
    action: 'judgment-preset',
    target: desired,
  })
  return next === state ? null : next
}
function ordinaryAiPreset(state: FightState): JudgmentPreset {
  return state.rng % 3 === 1 ? 'answers' : 'nen'
}
function opposingTroupeReserve(state: FightState): boolean {
  const seat = state.teamMatch?.seats.player
  return Boolean(
    seat?.members.some(
      (body, index) => index !== seat.active && body.health > 0 && troupeMember(body.id),
    ),
  )
}

function validJudgmentPreset(command: ArsenalCommand): boolean {
  return Boolean(
    command.action === 'judgment-preset' &&
    command.target &&
    Object.hasOwn(JUDGMENT_PRESETS, command.target),
  )
}

function judgmentActorReady(fighter: FightState['player']): boolean {
  return fighter.id === 'kurapika' && canAct(fighter) && !fighter.attack
}

function withHostageDeadline(
  seal: import('./judgmentRules').JudgmentSeal,
  state: FightState,
  side: FightSide,
) {
  if (!(seal.clauses ?? [seal.rule]).includes('return-hostage')) return seal
  return {
    ...seal,
    hostageId: state[side].judgmentDeclaration?.hostageId,
    deadlineFrame: state.frame + 1800,
  }
}
