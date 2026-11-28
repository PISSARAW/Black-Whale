import { KNOCKDOWN_KNOCKBACK } from './knockdownRules'
import { linkWindow, moveFrameAdvantage } from './moveFrameAdvantage'
import type { ComboMove, DuelComboProfile } from './duelComboTypes'
import type { FighterMove, FighterMoveset, MoveTuning } from './movesetTypes'
import type { MoveSlot } from './types'

/** Highest on-hit advantage a derived normal keeps (COMBO_GRAMMAR.md § 3.3). */
export const DERIVED_MAX_ADVANTAGE = 4

const GROUND_NORMALS: ReadonlySet<FighterMove['category']> = new Set(['normal', 'command'])
const SUPER_CATEGORIES: ReadonlySet<FighterMove['category']> = new Set(['special', 'finisher'])

interface Derivation {
  moveset: FighterMoveset
  profile: DuelComboProfile
}

function tuned(move: FighterMove, spec: ComboMove | undefined): MoveTuning {
  return { ...move.tuning, ...spec?.tuning }
}

function groundNormals({ moveset, profile }: Derivation): FighterMove[] {
  return moveset.moves.filter(
    (move) =>
      GROUND_NORMALS.has(move.category) &&
      move.variant !== 'air' &&
      tuned(move, profile.moves[move.slot]).damage > 0,
  )
}

/** A knockdown normal that the authored profile never continues from. */
function isEnder(move: FighterMove, profile: DuelComboProfile): boolean {
  const spec = profile.moves[move.slot]
  return (spec?.into ?? []).length === 0 && tuned(move, spec).knockback >= KNOCKDOWN_KNOCKBACK
}

/** Paid techniques the authored profile already placed in combos. */
const TECHNIQUE_SLOTS: ReadonlySet<MoveSlot> = new Set([
  'throw',
  'neutralSpecial',
  'forwardSpecial',
  'downSpecial',
  'backSpecial',
  'finisher',
])

function authoredSupers({ moveset, profile }: Derivation): MoveSlot[] {
  // Only the normals' routes name supers; a technique's own chains (a capture into Perfect Ken)
  // stay target combos and never open that technique to every normal.
  const named = new Set(
    Object.entries(profile.moves)
      .filter(([slot]) => !TECHNIQUE_SLOTS.has(slot as MoveSlot))
      .flatMap(([, spec]) => [...(spec?.into ?? []), ...(spec?.links ?? [])]),
  )
  return moveset.moves
    .filter((move) => SUPER_CATEGORIES.has(move.category) && named.has(move.slot))
    .map((move) => move.slot)
}

/** Caps hitstun so the normal never links into any ground normal of the fighter. */
function cappedHitstun(tuning: MoveTuning, cap: number): number {
  const busy = tuning.active + tuning.recovery
  return Math.min(tuning.hitstun, busy + cap)
}

type ChainGraph = Map<MoveSlot, MoveSlot[]>

function reaches(graph: ChainGraph, from: MoveSlot, target: MoveSlot): boolean {
  const seen = new Set<MoveSlot>()
  const stack = [from]
  while (stack.length) {
    const slot = stack.pop()!
    if (slot === target) return true
    if (seen.has(slot)) continue
    seen.add(slot)
    stack.push(...(graph.get(slot) ?? []))
  }
  return false
}

/** Physical tuning can change startup and recovery after the cancel graph was authored. */
export function capGroundedLinkLoops(moveset: FighterMoveset): FighterMoveset {
  const normals = moveset.moves.filter((move) => moveFrameAdvantage(move) !== null)
  const byId = new Map(normals.map((move) => [move.id, move.slot]))
  const graph: ChainGraph = new Map(
    normals.map((move) => [
      move.slot,
      move.cancelInto.flatMap((id) => {
        const slot = byId.get(id)
        return slot ? [slot] : []
      }),
    ]),
  )
  return {
    ...moveset,
    moves: moveset.moves.map((move) => capLoopingAdvantage(move, normals, graph)),
  }
}

function capLoopingAdvantage(
  move: FighterMove,
  normals: readonly FighterMove[],
  graph: ChainGraph,
): FighterMove {
  const advantage = moveFrameAdvantage(move)
  if (!advantage) return move
  const excess = Math.max(
    0,
    ...normals
      .filter((next) => reaches(graph, next.slot, move.slot))
      .map((next) => linkWindow(advantage, next.tuning)),
  )
  return excess
    ? { ...move, tuning: { ...move.tuning, hitstun: move.tuning.hitstun - excess } }
    : move
}

/**
 * Profiles whose Academy teaches heavy → back heavy after recovery as their identity:
 * that former link wins over the authored forward-light chain when both close a loop.
 */
const LINK_FIRST: ReadonlySet<string> = new Set(['bonolenov', 'hinrigh'])

/**
 * Chains between ground normals, never closing a loop: authored chains first (former
 * recovery links first for LINK_FIRST), then the rest. An edge closing a cycle is dropped.
 */
function acyclicChains(options: {
  fighter: string
  chainers: readonly FighterMove[]
  profile: DuelComboProfile
}): ChainGraph {
  const { fighter, chainers, profile } = options
  const chainable = new Set(chainers.map((move) => move.slot))
  const graph: ChainGraph = new Map(chainers.map((move) => [move.slot, []]))
  const candidates = (field: 'into' | 'links') =>
    chainers.flatMap((move) =>
      (profile.moves[move.slot]?.[field] ?? []).map((next) => [move.slot, next] as const),
    )
  const ordered = LINK_FIRST.has(fighter)
    ? [...candidates('links'), ...candidates('into')]
    : [...candidates('into'), ...candidates('links')]
  for (const [from, to] of ordered) {
    const edges = graph.get(from)!
    if (!chainable.has(to) || edges.includes(to) || reaches(graph, to, from)) continue
    edges.push(to)
  }
  return graph
}

function chainedMove(move: FighterMove, spec: ComboMove | undefined, cap: number): ComboMove {
  const tuning = tuned(move, spec)
  return { ...spec, tuning: { ...spec?.tuning, hitstun: cappedHitstun(tuning, cap) }, into: [] }
}

/**
 * Tiered grammar derived from an authored profile, with no new move or power: knockdown
 * normals become the specials, authored combo Hatsu the supers, and former recovery links
 * become chains, because the advantage cap removes every link between ground normals.
 */
export function deriveGrammarProfile(moveset: FighterMoveset, profile: DuelComboProfile) {
  const normals = groundNormals({ moveset, profile })
  const enders = normals.filter((move) => isEnder(move, profile))
  const chainers = normals.filter((move) => !enders.includes(move))
  const cap = Math.min(
    DERIVED_MAX_ADVANTAGE,
    ...normals.map((move) => tuned(move, profile.moves[move.slot]).startup),
  )
  const chains = acyclicChains({ fighter: moveset.fighterId, chainers, profile })
  const moves = { ...profile.moves }
  for (const move of chainers)
    moves[move.slot] = {
      ...chainedMove(move, profile.moves[move.slot], cap),
      into: chains.get(move.slot)!,
      links: [],
    }
  const specials = enders.map((move) => move.slot)
  return {
    ...profile,
    moves,
    grammar: {
      specials,
      supers: authoredSupers({ moveset, profile }),
      ...(profile.relance ? { accel: true as const } : {}),
    },
  } satisfies DuelComboProfile
}
