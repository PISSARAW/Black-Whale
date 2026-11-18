import { canHear, soundDistance } from './melodyRules'
import { voiceAvailable } from './kallutoListening'
import { canAct } from './fightActorState'
import { halkenburgMode } from './halkenburgSoulTypes'
import { reconcileHalkenburgSouls } from './halkenburgSouls'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

/** Explicit compressed duel clocks; the chapter's sedative result is ten hours. */
export const SOUL_SLEEP_FRAMES = 180
export const SOUL_SEDATIVE_FRAMES = 600
export function performHalkenburgSoulCommand(options: ArsenalInvocation): FightState {
  const { state, side, command } = options
  if (command.action === 'halkenburg-mode') return selectMode(options)
  if (!soulCommandReady(state, side)) return state
  const mind = state[side].halkSoul?.mind
  const index = soulCommandIndex(options)
  if (index < 0) return state
  const link = state.halkSoulLinks![index]
  if (command.action === 'halkenburg-sedative') return prepareSedative(state, side, index)
  if (command.action !== 'halkenburg-sleep') return state
  const source = Boolean(command.target?.startsWith('ally:')) || link.sourceMind.key === mind!.key
  const changed = { ...link, [source ? 'sourceSleep' : 'targetSleep']: SOUL_SLEEP_FRAMES }
  return reconcileHalkenburgSouls({
    ...state,
    halkSoulLinks: state.halkSoulLinks!.map((item, i) => (i === index ? changed : item)),
  })
}
function soulCommandIndex({ state, side, command }: ArsenalInvocation): number {
  const mind = state[side].halkSoul?.mind
  if (command.target?.startsWith('ally:')) return allySleepIndex(state, side, command.target)
  return (
    state.halkSoulLinks?.findIndex(
      (link) => link.sourceMind.key === mind?.key || link.targetMind.key === mind?.key,
    ) ?? -1
  )
}
function allySleepIndex(state: FightState, side: FightSide, target: string): number {
  if (!voiceAvailable(state, side)) return -1
  return (
    state.halkSoulLinks?.findIndex((link) => {
      if (target !== `ally:${link.id}` || link.owner !== side || link.sourceMind.principal)
        return false
      const bodies = [
        state.player,
        state.opponent,
        ...(state.rosterGuests ?? []).map((guest) => guest.fighter),
      ]
      const body = bodies.find((actor) => actor.halkSoul?.mind?.key === link.sourceMind.key)
      return Boolean(
        body && !body.halkSoulSleep && canHear(body) && soundDistance(state[side], body) <= 18,
      )
    }) ?? -1
  )
}
function soulCommandReady(state: FightState, side: FightSide): boolean {
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    canAct(state[side]) &&
    !state[side].attack &&
    !state[side].halkSoulSleep
  )
}
function selectMode({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side]
  if (
    actor.id !== 'halkenburg' ||
    actor.halkCohortBody ||
    !['roster', 'souls'].includes(command.target ?? '')
  )
    return state
  if (!modeChangeReady(state, side) || halkenburgMode(state, side) === command.target) return state
  return { ...state, halkenburgModes: { ...state.halkenburgModes, [side]: command.target } }
}
function modeChangeReady(state: FightState, side: FightSide): boolean {
  return (
    soulCommandReady(state, side) &&
    !state.teamMatch &&
    !state.halkSoulLinks?.length &&
    !state.projectiles.some((shot) => shot.owner === side && shot.halkenburgArrow)
  )
}
function prepareSedative(state: FightState, side: FightSide, index: number): FightState {
  const actor = state[side],
    link = state.halkSoulLinks![index]
  if (
    state.environment.preparation?.mode !== 'scenario' ||
    !state.environment.preparation.resources.includes('sedatives')
  )
    return state
  if (
    link.phase !== 'swapped' ||
    link.sourceMind.key !== actor.halkSoul?.mind?.key ||
    actor.halkSoul.key !== link.targetBody ||
    actor.halkSedativeSpent
  )
    return state
  const changed = { ...link, preparedSedative: SOUL_SEDATIVE_FRAMES }
  return {
    ...state,
    [side]: { ...actor, halkSedativeSpent: true, arenaRecovery: 18 },
    halkSoulLinks: state.halkSoulLinks!.map((item, i) => (i === index ? changed : item)),
  }
}
export function halkenburgSoulOptions(state: FightState, side: FightSide): ArsenalOption[] {
  return [...modeOptions(state, side), ...mindOptions(state, side), ...allyOptions(state, side)]
}
function modeOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const actor = state[side],
    entries: ArsenalOption[] = []
  if (actor.id === 'halkenburg' && !actor.halkCohortBody)
    for (const target of ['roster', 'souls'] as const) {
      const command = { action: 'halkenburg-mode' as const, target }
      entries.push({
        command,
        ready: performHalkenburgSoulCommand({ state, side, command }) !== state,
        labelFr:
          target === 'roster'
            ? 'Halkenburg · Variante du roster'
            : 'Halkenburg · Transfert de conscience',
        labelEn: target === 'roster' ? 'Halkenburg · Roster variant' : 'Halkenburg · Mind transfer',
        conditionFr:
          'Choix avant le tir, en duel. La variante conserve le tirage de corps et ses techniques ; le transfert déplace deux consciences entre les corps réellement présents, sans soin ni Hatsu du corps obtenu. Un seul échange par corps à la fois. Le mode ne change pas un projectile déjà lancé.',
        conditionEn:
          'Choose before firing, in a duel. The variant keeps random roster casting and its techniques; mind transfer swaps two minds between present bodies, without healing or acquiring the host’s Hatsu. One exchange per body at a time. Mode changes cannot rewrite a released arrow.',
      })
    }
  return entries
}
function mindOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const actor = state[side],
    entries: ArsenalOption[] = []
  if (actor.halkSoul?.mind)
    for (const action of ['halkenburg-sleep', 'halkenburg-sedative'] as const) {
      const command = { action }
      entries.push({
        command,
        ready: performHalkenburgSoulCommand({ state, side, command }) !== state,
        labelFr:
          action === 'halkenburg-sleep'
            ? 'Conscience · S’endormir volontairement'
            : 'Scénario · Préparer le sommeil au retour',
        labelEn:
          action === 'halkenburg-sleep'
            ? 'Mind · Fall asleep voluntarily'
            : 'Scenario · Prepare sleep upon return',
        conditionFr:
          'Une seule conscience éveillée dans la paire. Le sommeil volontaire cède la priorité ; le scénario avec sédatif adapte la préparation du ch. 404 avant la mort du corps d’origine. Durées comprimées : 3 s et 10 s. Aucun réveil par simple retrait d’aiguille, aucune résurrection et aucun mécanisme chimique simulé.',
        conditionEn:
          'Only one linked mind is awake. Voluntary sleep yields priority; the sedative scenario adapts ch. 404 preparation before the original body dies. Compressed durations: 3 s and 10 s. No wake by needle removal, resurrection or chemical simulation.',
      })
    }
  return entries
}
function allyOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const entries: ArsenalOption[] = []
  for (const link of state.halkSoulLinks ?? []) {
    if (link.owner !== side || link.sourceMind.principal) continue
    const command = { action: 'halkenburg-sleep' as const, target: `ally:${link.id}` }
    entries.push({
      command,
      ready: performHalkenburgSoulCommand({ state, side, command }) !== state,
      labelFr: 'Partisan · Donner l’ordre de dormir',
      labelEn: 'Supporter · Order voluntary sleep',
      conditionFr:
        'Le partisan consentant doit être éveillé dans le corps occupé, entendre Halkenburg et rester à portée de voix. Sa conscience cède alors la place à celle de la cible.',
      conditionEn:
        'The consenting supporter must be awake in the occupied body, hear Halkenburg and be within voice range. Its mind then yields to the target’s mind.',
    })
  }
  return entries
}
