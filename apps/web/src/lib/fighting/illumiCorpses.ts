import { withDolphinSupply } from './dolphinSupply'
import { corpseCollider } from './preparedCorpseBody'
import { canAct } from './fightActorState'
import { illumiAvailable } from './illumiAccess'
import { ownsCorpseTechnique, corpseNenReady } from './illumiCorpseAccess'
import { beginCorpseImplant, advanceCorpseImplant, usableCorpse } from './illumiCorpseImplant'
import { corpseControlLive, corpseControllerBody } from './illumiCorpseMatter'
import { removeCorpsePins } from './illumiCorpsePins'
import { sameGumSource, newGumSource } from './bungeeSource'
import { releasePreparedEntity } from './preparedCorpseBody'
import { updateEntity, liveEntity } from './preparationWorld'
import { speakThroughCorpse } from './illumiCorpseSpeech'
import type { ArsenalInvocation, ArsenalOption, ArsenalCommand } from './retrospectiveTypes'
import type { PreparedEntity } from './preparationTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

type CorpseOrder = 'stay' | 'approach' | 'retreat'
declare module './preparationTypes' {
  interface PreparedEntity {
    corpseOrder?: CorpseOrder
  }
}

export function performCorpseCommand({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side]
  if (!corpseCommandsOpen(state)) return state
  const [id, argument] = (command.target ?? '').split('|')
  const corpse = state.battlefield?.entities.find(
    (entry) => entry.id === id && entry.kind === 'corpse',
  )
  if (!corpse) return state
  if (command.action === 'illumi-corpse-release') return removeCorpsePins(state, side, corpse)
  if (!corpseCommandReady(actor, corpse)) return state
  if (command.action === 'illumi-corpse') return beginCorpseImplant(state, side, corpse)
  return commandControlledCorpse({ state, side, command }, corpse, argument)
}
function commandControlledCorpse(
  { state, side, command }: ArsenalInvocation,
  corpse: PreparedEntity,
  argument?: string,
): FightState {
  if (corpse.controller?.side !== side || corpse.controller.source !== 'illumi') return state
  if (!corpseCommandScope(state, side, corpse)) return state
  if (command.action === 'illumi-corpse-speak')
    return speakThroughCorpse(state, corpse, 'Je vais bien. Tout est sous contrôle.')
  if (command.action === 'illumi-corpse-order') return setOrder(state, corpse, argument)
  return state
}

function canCommand(actor: ArcadeFighter): boolean {
  return canAct(actor) && !actor.attack
}
function setOrder(state: FightState, corpse: PreparedEntity, order?: string): FightState {
  if (!['stay', 'approach', 'retreat'].includes(order ?? '')) return state
  if (order === corpse.corpseOrder) return state
  return updateEntity(state, corpse.id, { corpseOrder: order as CorpseOrder })
}

export function advanceCorpseControls(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) next = advanceCorpseImplant(next, side)
  for (const corpse of next.battlefield?.entities ?? []) {
    const pose = corpseCollider(corpse)
    if (pose !== corpse) next = updateEntity(next, pose.id, pose)
    next = advanceControlledCorpse(next, pose)
  }
  return next
}
function advanceControlledCorpse(state: FightState, corpse: PreparedEntity): FightState {
  if (corpse.kind !== 'corpse' || corpse.controller?.source !== 'illumi') return state
  const owner = corpseControllerBody(state, corpse) ?? state[corpse.controller.side]
  const available = corpse.corpseControl ? corpseControlLive(state, corpse) : illumiAvailable(owner)
  if (!available || !usableCorpse(corpse))
    return updateEntity(state, corpse.id, {
      ...releasePreparedEntity(corpse),
      corpseControl: undefined,
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

function corpsePosition(corpse: PreparedEntity, owner: ArcadeFighter): number {
  const order = corpse.corpseOrder
  if (!order || order === 'stay') return corpse.x
  const gap = owner.x - corpse.x
  if (order === 'approach' && Math.abs(gap) <= 6) return corpse.x
  const direction = Math.sign(gap) * (order === 'retreat' ? -1 : 1)
  return Math.max(7, Math.min(93, corpse.x + direction * 0.15))
}

export function corpseOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!ownsCorpseTechnique(state[side])) return []
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
        ready: previewCorpseCommand(state, side, command) !== state,
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
  ]
}

function corpseCommandScope(state: FightState, side: FightSide, corpse: PreparedEntity): boolean {
  const control = corpse.corpseControl
  if (!control) return true
  return (
    control.owner.owner === side &&
    control.owner.member === (state.teamMatch?.seats[side].active ?? 0) &&
    sameGumSource(control.origin ?? {}, newGumSource(state[side])) &&
    corpseControlLive(state, corpse)
  )
}

function corpseCommandsOpen(state: FightState): boolean {
  return state.phase === 'fighting' && !state.catsName
}
function corpseCommandReady(actor: ArcadeFighter, corpse: PreparedEntity): boolean {
  return canCommand(actor) && corpseNenReady(actor) && usableCorpse(corpse)
}

function previewCorpseCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  return state[side].id === 'kurapika'
    ? withDolphinSupply(state, side, (supplied) =>
        performCorpseCommand({ state: supplied, side, command }),
      )
    : performCorpseCommand({ state, side, command })
}
