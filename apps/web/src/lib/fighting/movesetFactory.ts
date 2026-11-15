import type { FighterMoveset, MoveCategory, MoveTuning } from './movesetTypes'
import type { AttackKind, AttackVariant, FighterId, MoveSlot } from './types'

export const MOVE_SLOTS: readonly MoveSlot[] = [
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'airLight',
  'airHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
  'neutralSpecial',
  'forwardSpecial',
  'downSpecial',
  'backSpecial',
  'throw',
  'finisher',
]

export interface MovesetSpec {
  fighterId: FighterId
  mechanic: readonly [string, string]
  finisherCondition: readonly [string, string]
  labels: readonly string[]
  speed: number
  power: number
  reach: number
  combos: readonly (readonly MoveSlot[])[]
}

interface MoveTemplate {
  category: MoveCategory
  kind: AttackKind
  variant: AttackVariant
  input: string
  auraCost: number
  tuning: MoveTuning
}

export function buildMoveset(spec: MovesetSpec): FighterMoveset {
  if (spec.labels.length !== MOVE_SLOTS.length)
    throw new Error(`Invalid moveset: ${spec.fighterId}`)
  const routes = cancelRoutes(spec.combos)
  const moves = MOVE_SLOTS.map((slot, index) => {
    const template = TEMPLATES[slot]
    const [nameFr, nameEn] = splitLabel(spec.labels[index])
    return {
      id: moveId(spec.fighterId, slot),
      slot,
      ...template,
      nameFr,
      nameEn,
      tuning: tune(template.tuning, spec),
      cancelInto: (routes.get(slot) ?? []).map((target) => moveId(spec.fighterId, target)),
    }
  })
  return {
    fighterId: spec.fighterId,
    mechanicFr: spec.mechanic[0],
    mechanicEn: spec.mechanic[1],
    finisherConditionFr: spec.finisherCondition[0],
    finisherConditionEn: spec.finisherCondition[1],
    moves,
    combos: spec.combos.map((route) => route.map((slot) => moveId(spec.fighterId, slot))),
  }
}

export const moveId = (fighterId: FighterId, slot: MoveSlot): string => `${fighterId}:${slot}`

function splitLabel(label: string): [string, string] {
  const [nameFr, nameEn] = label.split('|')
  return [nameFr, nameEn ?? nameFr]
}

function tune(base: MoveTuning, spec: MovesetSpec): MoveTuning {
  return {
    ...base,
    startup: Math.max(2, Math.round(base.startup * spec.speed)),
    recovery: Math.max(4, Math.round(base.recovery * spec.speed)),
    damage: Math.round(base.damage * spec.power * 10) / 10,
    reach: base.reach + spec.reach,
  }
}

function cancelRoutes(combos: MovesetSpec['combos']): Map<MoveSlot, MoveSlot[]> {
  const routes = new Map<MoveSlot, MoveSlot[]>()
  for (const combo of combos) {
    combo.slice(0, -1).forEach((slot, index) => {
      const targets = routes.get(slot) ?? []
      const target = combo[index + 1]
      if (!targets.includes(target)) targets.push(target)
      routes.set(slot, targets)
    })
  }
  return routes
}

const box = (reach: number, bottom: number, top: number) => ({ reach, bottom, top })
type TuningArgs = [
  readonly [number, number, number],
  number,
  readonly [number, number, number],
  ReturnType<typeof box>,
  readonly [MoveTuning['targetZone'], MoveTuning['auraZone']],
]
const tuning = (...args: TuningArgs): MoveTuning => {
  const [frames, damage, impact, shape, zones] = args
  return {
    startup: frames[0],
    active: frames[1],
    recovery: frames[2],
    damage,
    hitstun: impact[0],
    blockstun: Math.max(5, impact[0] - 5),
    hitstop: impact[1],
    knockback: impact[2],
    lunge: Math.min(1.8, shape.reach / 10),
    ...shape,
    targetZone: zones[0],
    auraZone: zones[1],
  }
}

type TemplateArgs = [MoveCategory, AttackKind, AttackVariant, string, number, MoveTuning]
const template = (...args: TemplateArgs): MoveTemplate => {
  const [category, kind, variant, input, auraCost, data] = args
  return { category, kind, variant, input, auraCost, tuning: data }
}

const TEMPLATES: Record<MoveSlot, MoveTemplate> = {
  standingLight: template(
    'normal',
    'light',
    'standing',
    'J',
    0,
    tuning([4, 3, 8], 6, [14, 3, 1.2], box(7, 5, 11), ['head', 'hands']),
  ),
  standingHeavy: template(
    'normal',
    'heavy',
    'standing',
    'K',
    0,
    tuning([9, 4, 15], 11, [19, 6, 2.6], box(9, 2, 10), ['torso', 'hands']),
  ),
  lowLight: template(
    'normal',
    'light',
    'low',
    '↓ + J',
    0,
    tuning([5, 3, 10], 5, [13, 3, 1], box(7, 0, 4.5), ['feet', 'feet']),
  ),
  lowHeavy: template(
    'normal',
    'heavy',
    'low',
    '↓ + K',
    0,
    tuning([10, 4, 18], 9, [20, 6, 3.2], box(10, 0, 4.5), ['feet', 'feet']),
  ),
  airLight: template(
    'normal',
    'light',
    'air',
    'air + J',
    0,
    tuning([4, 4, 9], 6, [15, 3, 1.4], box(7, -5, 5), ['head', 'hands']),
  ),
  airHeavy: template(
    'normal',
    'heavy',
    'air',
    'air + K',
    0,
    tuning([8, 5, 17], 12, [22, 7, 3.8], box(9, -5, 5), ['head', 'feet']),
  ),
  forwardLight: template(
    'command',
    'light',
    'standing',
    '→ + J',
    0,
    tuning([7, 3, 12], 8, [17, 4, 1.8], box(9, 3, 10), ['hands', 'hands']),
  ),
  forwardHeavy: template(
    'command',
    'heavy',
    'standing',
    '→ + K',
    0,
    tuning([14, 5, 20], 15, [24, 8, 4.2], box(12, 2, 11), ['torso', 'feet']),
  ),
  backHeavy: template(
    'command',
    'heavy',
    'standing',
    '← + K',
    0,
    tuning([11, 4, 16], 10, [21, 6, 3], box(8, 4, 12), ['head', 'hands']),
  ),
  neutralSpecial: template(
    'special',
    'special',
    'standing',
    'L',
    40,
    tuning([13, 5, 22], 16, [25, 9, 4], box(16, 3, 11), ['torso', 'hands']),
  ),
  forwardSpecial: template(
    'special',
    'special',
    'standing',
    '→ + L',
    24,
    tuning([10, 5, 19], 13, [22, 7, 3.5], box(19, 2, 11), ['torso', 'hands']),
  ),
  downSpecial: template(
    'special',
    'special',
    'low',
    '↓ + L',
    20,
    tuning([8, 4, 18], 11, [20, 6, 2.8], box(13, 0, 5), ['feet', 'feet']),
  ),
  backSpecial: template(
    'special',
    'special',
    'standing',
    '← + L',
    28,
    tuning([16, 6, 20], 14, [24, 8, 3], box(14, 3, 12), ['head', 'hands']),
  ),
  throw: template(
    'throw',
    'heavy',
    'throw',
    'O',
    0,
    tuning([7, 2, 24], 14, [30, 8, 7], box(6, 0, 10), ['torso', 'hands']),
  ),
  finisher: template(
    'finisher',
    'special',
    'standing',
    'H',
    55,
    tuning([24, 8, 34], 34, [38, 14, 8], box(23, 0, 12), ['torso', 'hands']),
  ),
}
