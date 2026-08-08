/**
 * How an ability presents itself on the site.
 *
 * These six fields used to live in `apps/web/src/lib/nen/hatsuRegistry.ts`, a
 * hand-kept table of eighty-two entries parallel to the modules — the third
 * declaration of the catalogue ADR-001 set out to remove. They are declared
 * here instead, beside the code that enforces the very limits `rule` states,
 * so the sentence shown to a visitor and the predicate that gates the action
 * can no longer drift apart. `hatsuProfiles.gen.ts` is compiled from them.
 *
 * What is *not* here: the ability's name and its owner. Those are canon, they
 * live in `data/`, and the compiler reads them from there.
 */

export type HatsuInteractionKind =
  | 'elastic'
  | 'disguise'
  | 'scarlet'
  | 'chain-rule'
  | 'chain-bind'
  | 'dowsing'
  | 'enhance'
  | 'growth'
  | 'vehicle'
  | 'scout'
  | 'tribunal'
  | 'curse'
  | 'inherit'
  | 'blast'
  | 'surveillance'
  | 'capture'
  | 'future'
  | 'arrow'
  | 'guardian'
  | 'portal'
  | 'resurrection'
  | 'poetry'
  | 'restoration'
  | 'transformation'
  | 'rhythm'
  | 'impact'
  | 'mimicry'
  | 'theft'
  | 'bookmark'
  | 'devour'
  | 'pocket'
  | 'teleport'
  | 'polarity'
  | 'command'
  | 'identity-swap'
  | 'divination'
  | 'prophecy'
  | 'clone'
  | 'puppet'
  | 'barrage'
  | 'projection'
  | 'animate'
  | 'needle'
  | 'paper-spy'
  | 'shred'
  | 'remote-strike'
  | 'spatial'
  | 'stitch'
  | 'melody'
  | 'infection'
  | 'windup'
  | 'predator'
  | 'staff'
  | 'senses'
  | 'vacuum'
  | 'snakes'
  | 'training-shot'
  | 'serpent'
  | 'flock'
  | 'relay'
  | 'postmortem-curse'
  | 'postmortem-host-succession'
  | 'healing'
  | 'heart-vow'
  | 'ability-loan'
  | 'ability-lending'
  | 'contract'
  | 'truth-punch'
  | 'blood-search'
  | 'legal-defense'
  | 'damage-transfer'
  | 'door-network'
  | 'weapon-body'
  | 'coercive-beast'
  | 'coin-growth'
  | 'lie-marks'
  | 'drug-synthesis'
  | 'aura-levy'
  | 'desire-trap'
  | 'diffusive-smoke'
  | 'solicitation'
  | 'room-isolation'
  | 'pain-armour'
  | 'sun-flare'
  | 'decipher'

/**
 * The interaction grammar of one ability, one entry per ability by
 * construction: the kind is what the DOM and 3D renderers switch on to pick a
 * behaviour, so two abilities sharing one would be two abilities the site
 * cannot tell apart.
 */
export interface AbilitySitePresentation {
  kind: HatsuInteractionKind
  /** What the visitor is told to do, in the imperative. */
  instruction: string
  /** The canon limit the module enforces, in one sentence. */
  rule: string
  /** What it costs its user — aura, life, a condition given up. */
  cost: string
  /** The ability's own colour, used by every renderer that draws it. */
  color: string
  /** Label of the first action offered, on the wheel and in the HUD. */
  action: string
}

/**
 * One entry of the site's hatsu registry: a module's presentation, joined to
 * the two facts the module has no say over — the ability's name and whose it
 * is. The compiler reads those from `data/`, which is why they are separate
 * fields here rather than more presentation.
 */
export interface HatsuProfile extends AbilitySitePresentation {
  id: string
  name: string
  /** The owner's canonical name, as `data/characters/characters.json` spells it. */
  owner: string
}
