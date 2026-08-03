/**
 * What an ability costs and risks when it is cast in a duel.
 *
 * These six fields used to live in `apps/web/src/lib/arena/hatsu/`, in two
 * hand-kept tables — twenty-four contracts for the Black Whale roster and four
 * more written inline — which ADR-001 counted as the *sixth* declaration of the
 * catalogue: a `cost` and a `condition` stated there, and again in the module
 * that enforces them, with nothing making the two agree. They are declared here
 * instead, beside that module, and `contracts.gen.ts` is compiled from them.
 *
 * The arena's own vocabulary stays in the arena: terrain, aura pools, zones and
 * counters are the duel's business, not the catalogue's. What moves here is
 * only what the ability itself decides — what it does, what it takes, what has
 * to hold, and what its user exposes by casting it.
 */

/** What the duel does with the ability, once the fighter has paid for it. */
export type ArenaEffect = 'bind' | 'impact' | 'barrage' | 'restore' | 'enhance'

/**
 * The tactic the ability contributes to the roster, one per ability by
 * construction: two abilities sharing a mechanic would be two abilities a
 * fighter has no reason to choose between, so the compiler refuses them.
 */
export type ArenaMechanic =
  | 'terrain'
  | 'analysis'
  | 'forecast'
  | 'post-mortem'
  | 'inheritance'
  | 'progression'
  | 'tracking'
  | 'truth'
  | 'transfer'
  | 'jurisdiction'
  | 'space'
  | 'surveillance'
  | 'growth'
  | 'projection'
  | 'recovery'
  | 'ambush'
  | 'theft'
  | 'loan'
  | 'healing'
  | 'loadout'
  | 'retaliation'
  | 'vacuum'
  | 'threads'
  | 'manipulation'

export interface AbilityArenaContract {
  effect: ArenaEffect
  /** Aura spent to cast it, on the fighter's pool of a hundred. */
  cost: number
  /** Whether the effect outlives the cast, or resolves within it. */
  persistent: boolean
  /** What the canon requires before the cast is legal, in one hyphenated key. */
  condition: string
  /** What the caster exposes by casting it — the price the duel exacts back. */
  risk: string
  /**
   * The tactic it brings to the Black Whale roster. Absent for the abilities
   * the arena inherited from the earlier arcs: they are cast in the duel, but
   * they are not part of the roster the mode is built around.
   */
  mechanic?: ArenaMechanic
}

/**
 * One entry of the arena's contract table: a module's duel contract joined to
 * the id it is chosen by. Same shape as `HatsuProfile` and for the same reason
 * — the renderer looks it up by the id of the profile the visitor picked.
 */
export interface ArenaContract extends AbilityArenaContract {
  id: string
}
