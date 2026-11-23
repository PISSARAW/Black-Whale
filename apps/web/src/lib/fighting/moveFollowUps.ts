import type {
  FighterMove,
  FighterMoveset,
  MoveFollowUp,
  MoveFollowUpCondition,
  MoveFollowUpInput,
} from './movesetTypes'
import type { ArcadeFighter, FightInput, FighterId, MoveAction, MoveSlot } from './types'
import { LATE_WAVE_FOLLOW_UPS } from './moveFollowUpSpecsLate'

export interface FollowUpSpec {
  id: string
  sourceSlot: MoveSlot
  baseSlot: MoveSlot
  input: MoveFollowUpInput
  condition: MoveFollowUpCondition
}

const PRIORITY_SPECS: Partial<Record<FighterId, readonly FollowUpSpec[]>> = {
  kurapika: [
    {
      id: 'kurapika:five-finger-cross',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'kurapika:scarlet-verdict-followup',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  chrollo: [
    {
      id: 'chrollo:deceptive-bookmark',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'chrollo:final-chapter',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  benjamin: [
    {
      id: 'benjamin:ascending-air-blow',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'benjamin:absolute-command-followup',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  tserriednich: [
    {
      id: 'tserriednich:princely-blind-spot',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'tserriednich:ten-seconds-ahead-followup',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  theta: [
    {
      id: 'theta:rising-stock',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'theta:impossible-decision',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  biscuit: [
    {
      id: 'biscuit:rising-palm',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'biscuit:absolute-correction',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  phinks: [
    {
      id: 'phinks:false-release',
      sourceSlot: 'forwardLight',
      baseSlot: 'backHeavy',
      input: 'heavy',
      condition: 'on-block',
    },
    {
      id: 'phinks:no-return-fist',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  franklin: [
    {
      id: 'franklin:anti-air-curtain',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'franklin:last-round',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  illumi: [
    {
      id: 'illumi:displaced-joint',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'illumi:funeral-procession',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  bonolenov: [
    {
      id: 'bonolenov:vertical-crescendo',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'bonolenov:jupiter-finale',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  shizuku: [
    {
      id: 'shizuku:dust-uprise',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'shizuku:vacuumed-hemorrhage',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  hinrigh: [
    {
      id: 'hinrigh:barrel-serpent',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'hinrigh:urban-biohazard',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  mizaistom: [
    {
      id: 'mizaistom:apprehension',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'mizaistom:hearing-closed',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  leorio: [
    {
      id: 'leorio:under-bridge-fist',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'leorio:operating-room',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  hanzo: [
    {
      id: 'hanzo:shinobi-lock',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'hanzo:silent-execution',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  feitan: [
    {
      id: 'feitan:pain-stairway',
      sourceSlot: 'forwardLight',
      baseSlot: 'forwardHeavy',
      input: 'heavy',
      condition: 'on-hit',
    },
    {
      id: 'feitan:execution-rain',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'feitan:shadowless-blade',
      sourceSlot: 'forwardLight',
      baseSlot: 'backHeavy',
      input: 'heavy',
      condition: 'crossed',
    },
  ],
  machi: [
    {
      id: 'machi:seam-cross',
      sourceSlot: 'forwardLight',
      baseSlot: 'forwardHeavy',
      input: 'heavy',
      condition: 'on-hit',
    },
    {
      id: 'machi:broken-puppet',
      sourceSlot: 'forwardLight',
      baseSlot: 'backHeavy',
      input: 'heavy',
      condition: 'on-block',
    },
  ],
  hisoka: [
    {
      id: 'hisoka:deadly-trapeze',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'hisoka:elastic-embrace',
      sourceSlot: 'backHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  kalluto: [
    {
      id: 'kalluto:ascending-serpent',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'kalluto:hundred-scale-bite',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  saiyu: [
    {
      id: 'saiyu:pilgrim-leap',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'saiyu:three-monkeys-cage',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
}

export function attachMoveFollowUps(moveset: FighterMoveset): FighterMoveset {
  const specs = PRIORITY_SPECS[moveset.fighterId] ?? LATE_WAVE_FOLLOW_UPS[moveset.fighterId]
  if (!specs?.length) return moveset
  const bySlot = new Map(moveset.moves.map((move) => [move.slot, move]))
  const followUps: MoveFollowUp[] = specs.flatMap((spec) => {
    const source = bySlot.get(spec.sourceSlot)
    const base = bySlot.get(spec.baseSlot)
    if (!source || !base) return []
    const move: FighterMove = { ...base, id: spec.id }
    return [
      {
        id: spec.id,
        sourceMoveId: source.id,
        input: spec.input,
        condition: spec.condition,
        move,
      },
    ]
  })
  const moves = moveset.moves.map((move) => {
    const onHitTargets = followUps
      .filter((entry) => entry.sourceMoveId === move.id && entry.condition !== 'on-block')
      .map((entry) => entry.id)
    const onBlockTargets = followUps
      .filter((entry) => entry.sourceMoveId === move.id && entry.condition === 'on-block')
      .map((entry) => entry.id)
    return {
      ...move,
      cancelInto: [...new Set([...move.cancelInto, ...onHitTargets])],
      cancelOnBlockInto: [...new Set([...move.cancelOnBlockInto, ...onBlockTargets])],
    }
  })
  return { ...moveset, moves, followUps }
}

export function resolveMoveFollowUp(options: {
  fighter: ArcadeFighter
  action: MoveAction
  input: FightInput
  followUps?: readonly MoveFollowUp[]
}): FighterMove | null {
  const { fighter, action, input, followUps } = options
  if (!followUps?.length || !isFollowUpAction(action) || !hasConfirmedAttack(fighter)) return null
  const currentId = fighter.attack?.moveId
  const candidates = followUps.filter(
    (entry) => entry.input === action && entry.sourceMoveId === currentId,
  )
  const matched = candidates.find((entry) => conditionSatisfied(fighter, entry, input))
  return matched?.move ?? null
}

function isFollowUpAction(action: MoveAction): action is MoveFollowUpInput {
  return action === 'light' || action === 'heavy' || action === 'special'
}

function hasConfirmedAttack(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.attack?.confirmedHit || fighter.attack?.confirmedBlock)
}

function conditionSatisfied(
  fighter: ArcadeFighter,
  entry: MoveFollowUp,
  input: FightInput,
): boolean {
  const attack = fighter.attack!
  if (entry.condition === 'on-block') return Boolean(attack.confirmedBlock && isNeutral(input))
  if (!attack.confirmedHit) return false
  if (entry.condition === 'crossed') return isBackInput(fighter, input)
  if (entry.condition === 'airborne') return fighter.y > 0
  if (entry.condition === 'counter') return fighter.reversalWindow > 0
  return isNeutral(input)
}

function isBackInput(fighter: ArcadeFighter, input: FightInput): boolean {
  if (input.down) return false
  return fighter.facing === 1 ? input.left && !input.right : input.right && !input.left
}

function isNeutral(input: FightInput): boolean {
  return !input.left && !input.right && !input.down
}
