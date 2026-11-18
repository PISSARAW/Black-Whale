import { corpseCollider } from './preparedCorpseBody'
import { triggerHatsu } from './hatsu'
import { canAct } from './fightActorState'
import { illumiAvailable } from './illumiAccess'
import { updateEntity, liveEntity } from './preparationWorld'
import { speakThroughCorpse } from './illumiCorpseSpeech'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { PreparedEntity } from './preparationTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

type CorpseOrder = 'stay' | 'approach' | 'retreat'
declare module './types' {
  interface ArcadeFighter {
    corpsePreparation?: { target: string; frames: number; x: number; y: number }
  }
}
declare module './preparationTypes' {
  interface PreparedEntity {
    corpseOrder?: CorpseOrder
  }
}
const PREPARE_FRAMES = 60

export function performCorpseCommand({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side]
  if (state.phase !== 'fighting' || state.catsName) return state
  if (!canCommand(actor) || !illumiAvailable(actor)) return state
  const [id, argument] = (command.target ?? '').split('|')
  const corpse = state.battlefield?.entities.find((entry) => entry.id === id && usableCorpse(entry))
  if (!corpse) return state
  if (command.action === 'illumi-corpse') return beginCorpseControl(state, side, corpse)
  return commandControlledCorpse({ state, side, command }, corpse, argument)
}
function commandControlledCorpse(
  { state, side, command }: ArsenalInvocation,
  corpse: PreparedEntity,
  argument?: string,
): FightState {
  const actor = state[side]
  if (corpse.controller?.side !== side || corpse.controller.source !== 'illumi') return state
  if (command.action === 'illumi-corpse-speak')
    return speakThroughCorpse(state, corpse, 'Je vais bien. Tout est sous contrôle.')
  if (command.action === 'illumi-corpse-order') return setOrder(state, corpse, argument)
  if (command.action !== 'illumi-corpse-release' || distance(actor, corpse) > 6) return state
  return updateEntity(state, corpse.id, {
    controller: undefined,
    corpseOrder: undefined,
    arena: corpse.arena ? { ...corpse.arena, height: 3 } : undefined,
  })
}

function usableCorpse(entry: PreparedEntity): boolean {
  return entry.kind === 'corpse' && entry.material === 'real' && liveEntity(entry)
}
function canCommand(actor: ArcadeFighter): boolean {
  return canAct(actor) && !actor.attack
}
function distance(actor: { x: number; y: number }, target: { x: number; y: number }): number {
  return Math.hypot(actor.x - target.x, actor.y - target.y)
}
function beginCorpseControl(
  state: FightState,
  side: FightSide,
  corpse: PreparedEntity,
): FightState {
  const actor = state[side]
  if (corpse.controller || actor.aura < 30 || distance(actor, corpse) > 6) return state
  return {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - 30,
      corpsePreparation: { target: corpse.id, frames: PREPARE_FRAMES, x: actor.x, y: actor.y },
    },
  }
}
function setOrder(state: FightState, corpse: PreparedEntity, order?: string): FightState {
  if (!['stay', 'approach', 'retreat'].includes(order ?? '')) return state
  if (order === corpse.corpseOrder) return state
  return updateEntity(state, corpse.id, { corpseOrder: order as CorpseOrder })
}

export function advanceCorpseControls(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) next = advanceImplant(next, side)
  for (const corpse of next.battlefield?.entities ?? []) {
    const pose = corpseCollider(corpse)
    if (pose !== corpse) next = updateEntity(next, pose.id, pose)
    next = advanceControlledCorpse(next, pose)
  }
  return next
}
function advanceControlledCorpse(state: FightState, corpse: PreparedEntity): FightState {
  if (corpse.kind !== 'corpse' || corpse.controller?.source !== 'illumi') return state
  const owner = state[corpse.controller.side]
  if (!illumiAvailable(owner) || !usableCorpse(corpse))
    return updateEntity(state, corpse.id, {
      controller: undefined,
      corpseOrder: undefined,
      arena: corpse.arena ? { ...corpse.arena, height: 3 } : undefined,
    })
  const x = corpsePosition(corpse, owner)
  return x !== corpse.x && corpsePathClear(state, corpse, x)
    ? updateEntity(state, corpse.id, { x })
    : state
}

function corpsePathClear(state: FightState, corpse: PreparedEntity, x: number): boolean {
  return !(state.battlefield?.entities ?? []).some(
    (entry) =>
      entry.id !== corpse.id &&
      entry.arena &&
      liveEntity(entry) &&
      Math.abs(entry.x - x) < entry.arena.width + 1,
  )
}

function advanceImplant(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    preparation = actor.corpsePreparation
  if (!preparation) return state
  const corpse = state.battlefield?.entities.find((entry) => entry.id === preparation.target)
  const clear = { ...state, [side]: { ...actor, corpsePreparation: undefined } }
  if (!implantContinues({ actor, corpse, preparation })) return clear
  if (preparation.frames > 1)
    return {
      ...state,
      [side]: { ...actor, corpsePreparation: { ...preparation, frames: preparation.frames - 1 } },
    }
  return updateEntity(triggerHatsu(clear, side, 'illumi'), corpse!.id, {
    controller: { side, source: 'illumi' },
    corpseOrder: 'stay',
    arena: { ...corpse!.arena!, height: 12 },
  })
}
function implantContinues(context: {
  actor: ArcadeFighter
  corpse?: PreparedEntity
  preparation: NonNullable<ArcadeFighter['corpsePreparation']>
}): boolean {
  const { actor, corpse, preparation } = context
  if (!corpse || !usableCorpse(corpse) || corpse.controller) return false
  return (
    canActDuringImplant(actor) &&
    illumiAvailable(actor) &&
    distance(actor, preparation) < 0.1 &&
    distance(actor, corpse) <= 6
  )
}
function canActDuringImplant(actor: ArcadeFighter): boolean {
  return canAct({ ...actor, corpsePreparation: undefined }) && !actor.attack
}

function corpsePosition(corpse: PreparedEntity, owner: ArcadeFighter): number {
  const order = corpse.corpseOrder
  if (!order || order === 'stay') return corpse.x
  const gap = owner.x - corpse.x
  if (order === 'approach' && Math.abs(gap) <= 6) return corpse.x
  const direction = Math.sign(gap) * (order === 'retreat' ? -1 : 1)
  return Math.max(7, Math.min(93, corpse.x + direction * 0.15))
}

export function corpseOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'illumi') return []
  return (state.battlefield?.entities ?? []).filter(usableCorpse).flatMap((corpse) => {
    const items = !corpse.controller
      ? [
          {
            action: 'illumi-corpse' as const,
            target: corpse.id,
            fr: 'Implanter un cadavre réel',
            en: 'Implant a real corpse',
          },
        ]
      : corpseOrders(corpse)
    return items.map(({ action, target, fr, en }) => {
      const command = { action, target }
      return {
        command,
        labelFr: `Illumi · ${fr}`,
        labelEn: `Illumi · ${en}`,
        ready: performCorpseCommand({ state, side, command }) !== state,
        conditionFr:
          'Cadavre matériel présent, aiguilles réelles et Nen requis. Implantation au contact, lente et interruptible. Les ordres déplacent le même corps ; les paroles sont un texte imposé, sans résurrection ni souvenirs de la victime.',
        conditionEn:
          'A real corpse, physical needles and Nen are required. Close implantation is slow and interruptible. Orders move the same body; speech is scripted, without revival or access to memories.',
      }
    })
  })
}
function corpseOrders(corpse: PreparedEntity) {
  return [
    ...(['stay', 'approach', 'retreat'] as const).map((order, index) => ({
      action: 'illumi-corpse-order' as const,
      target: `${corpse.id}|${order}`,
      fr: ['Rester', 'Approcher', 'Reculer'][index],
      en: order,
    })),
    {
      action: 'illumi-corpse-speak' as const,
      target: corpse.id,
      fr: 'Faire parler le cadavre',
      en: 'Make the corpse speak',
    },
    {
      action: 'illumi-corpse-release' as const,
      target: corpse.id,
      fr: 'Retirer les aiguilles du cadavre',
      en: 'Remove the corpse’s needles',
    },
  ]
}
