import { scenarioOito } from './dolphinPeopleWorld'
import { scenarioPaperKit } from './kallutoMaterials'
import { scenarioWeakSpirit } from './bashoWard'
import { scenarioWritingKit } from './bashoMaterials'
import { scenarioDevices } from './physicalDevices'
import type { FightEnvironment } from './fightEnvironment'
import type {
  FightBattlefield,
  FightEquipment,
  PreparedEntity,
  PreparedEntityKind,
  FightPreparation,
} from './preparationTypes'
import type { FightSide, FightState, FighterId } from './types'

export const EMPTY_PREPARATION: FightPreparation = { mode: 'duel', resources: [], cohorts: [] }
export const PREPARATION_REACH = 8

export function personalEquipment(id: FighterId): FightEquipment[] {
  if (id === 'hinrigh') return ['tracker-receiver']
  if (id === 'illumi') return ['needles']
  if (id === 'zakuro') return ['blood-infusion']
  if (id === 'melody') return ['flute']
  return id === 'chrollo' ? ['book'] : []
}

export function createBattlefield(environment: FightEnvironment): FightBattlefield {
  const preparation = environment.preparation ?? EMPTY_PREPARATION
  const entities: PreparedEntity[] = []
  if (environment.arenaInteractions)
    for (const x of [34, 66])
      entities.push({
        ...entity('crate', 'neutral', x),
        id: `arena:crate:${x}`,
        health: 40,
        arena: { width: 3, height: 8 },
      })
  if (environment.morenaPresent && environment.stageId === 'heilly-hideout')
    entities.push(entity('morena', 'neutral', 50))
  if (preparation.mode === 'scenario') installScenario(entities, preparation)
  return {
    entities,
    interactionHeld: { player: false, opponent: false },
    completed: { player: 0, opponent: 0 },
  }
}

function installScenario(entities: PreparedEntity[], preparation: FightPreparation) {
  const resources = new Set(preparation.resources)
  if (resources.has('people')) entities.push(scenarioOito())
  for (const side of ['player', 'opponent'] as const) {
    const x = side === 'player' ? 25 : 75
    installProps(entities, { resources, side, x })
    if (resources.has('birds')) entities.push(entity('delivery', side, side === 'player' ? 85 : 15))
    if (resources.has('rooms')) installRooms(entities, side)
    if (preparation.cohorts.includes(side)) installCohort(entities, side)
  }
}

function installProps(
  entities: PreparedEntity[],
  context: { resources: Set<string>; side: FightSide; x: number },
) {
  const { resources, side, x } = context
  installSupplyProps(entities, context)
  installLegacyProps(entities, context)
  if (resources.has('animals'))
    entities.push({ ...entity('animal', side, x + 2), animalSize: 'mouse', health: 1 })
  if (resources.has('birds'))
    entities.push({ ...entity('bird', side, x + 3), animalSize: 'larger' })
  if (resources.has('plants')) entities.push(entity('seed', side, x))
  if (resources.has('objects')) entities.push(entity('crate', side, x + 4))
  if (resources.has('needles')) entities.push(entity('needles', side, x - 2))
  if (resources.has('flutes')) entities.push(entity('flute', side, x - 1))
}

function installSupplyProps(
  entities: PreparedEntity[],
  context: { resources: Set<string>; side: FightSide },
) {
  const { resources, side } = context
  if (resources.has('spirits')) entities.push(scenarioWeakSpirit(side))
  if (resources.has('writing')) entities.push(scenarioWritingKit(side))
  if (resources.has('paper')) entities.push(scenarioPaperKit(side))
  if (resources.has('devices')) entities.push(...scenarioDevices(side))
}

function installRooms(entities: PreparedEntity[], side: FightSide) {
  const room = {
    ...entity('room', side, side === 'player' ? 20 : 80),
    sealed: true,
    singleDoor: true,
    invalidated: false,
  }
  const destination = {
    ...entity('destination', side, side === 'player' ? 85 : 15),
    visitedBy: [side],
    linkedTo: room.id,
  }
  entities.push({ ...room, linkedTo: destination.id }, destination)
}

function installCohort(entities: PreparedEntity[], side: FightSide) {
  for (let index = 0; index < 3; index++)
    entities.push({
      ...entity(
        'supporter',
        side,
        (side === 'player' ? 5 : 95) + (side === 'player' ? index : -index) * 6,
      ),
      id: `${side}:supporter:${index}`,
      consenting: true,
      feather: true,
    })
}

function entity(
  kind: PreparedEntityKind,
  owner: PreparedEntity['owner'],
  x: number,
): PreparedEntity {
  return {
    id: `${owner}:${kind}`,
    kind,
    owner,
    x,
    y: 0,
    present: true,
    material: 'real',
    health: 100,
  }
}

export function liveEntity(entity: PreparedEntity): boolean {
  return entity.present && entity.health > 0
}

export function entitiesFor(
  state: FightState,
  side: FightSide,
  kind: PreparedEntityKind,
): PreparedEntity[] {
  return (state.battlefield?.entities ?? []).filter(
    (entry) =>
      entry.kind === kind &&
      liveEntity(entry) &&
      (entry.owner === side || entry.owner === 'neutral'),
  )
}

export function nearEntity(
  state: FightState,
  side: FightSide,
  kind: PreparedEntityKind,
): PreparedEntity | undefined {
  const fighter = state[side]
  return entitiesFor(state, side, kind)
    .filter((entry) => Math.hypot(entry.x - fighter.x, entry.y - fighter.y) <= PREPARATION_REACH)
    .sort(
      (a, b) => Math.abs(a.x - fighter.x) - Math.abs(b.x - fighter.x) || a.id.localeCompare(b.id),
    )[0]
}

export function updateEntity(
  state: FightState,
  id: string,
  change: Partial<PreparedEntity>,
): FightState {
  if (!state.battlefield) return state
  return {
    ...state,
    battlefield: {
      ...state.battlefield,
      entities: state.battlefield.entities.map((entry) =>
        entry.id === id ? changedEntity(entry, change) : entry,
      ),
    },
  }
}

export function hasEquipment(fighter: FightState['player'], equipment: FightEquipment): boolean {
  if (equipment === 'flute' && fighter.melodyFlute !== undefined) return fighter.melodyFlute
  return (fighter.equipment ?? personalEquipment(fighter.nenOwner ?? fighter.id)).includes(
    equipment,
  )
}

export function readyCohort(state: FightState, side: FightSide): PreparedEntity[] {
  return entitiesFor(state, side, 'supporter').filter(
    (entry) => entry.consenting && entry.feather && !entry.sleepingFrames,
  )
}

/** Once opened, a room cannot be made reusable by closing or restoring its flags. */
function changedEntity(entry: PreparedEntity, change: Partial<PreparedEntity>): PreparedEntity {
  const next = { ...entry, ...change }
  return entry.kind === 'room'
    ? { ...next, invalidated: entry.invalidated || next.invalidated || next.sealed === false }
    : next
}

function installLegacyProps(
  entities: PreparedEntity[],
  c: { resources: Set<string>; side: FightSide; x: number },
) {
  if (c.resources.has('cameras')) entities.push(entity('camera', c.side, c.x + 1))
  if (c.resources.has('hostages'))
    entities.push({ ...entity('hostage', c.side, c.x + 3), captiveOf: c.side })
  if (c.resources.has('corpses'))
    entities.push({
      ...entity('corpse', c.side, c.x + 1),
      health: 60,
      arena: { width: 1, height: 3 },
    })
}
