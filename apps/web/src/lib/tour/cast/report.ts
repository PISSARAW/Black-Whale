/**
 * What a technique did, as data.
 *
 * Split out of `types.ts` under ADR-002; the façade there still re-exports it,
 * so no import outside this folder changes.
 */
import type { Vec2, StructureKind } from '../types'
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import type { TourEyeMode, TourDoubleMode, TourOwlMode, TourTune } from './modes'

/**
 * What the technique did, as data. The component turns it into a sentence in
 * the visitor's language; nothing here knows English from French.
 */
export type TourReport =
  | { kind: 'no-target' }
  | { kind: 'inert' }
  | { kind: 'teleported'; spaceId: string }
  | { kind: 'door-armed'; spaceId: string }
  | { kind: 'doors-paired'; spaceId: string; otherId: string }
  | { kind: 'doors-rearmed'; spaceId: string }
  | { kind: 'phasing'; on: boolean }
  | { kind: 'eye-sent'; spaceId: string }
  | { kind: 'eye-recalled'; rooms: number }
  | { kind: 'eye-mode-changed'; mode: TourEyeMode }
  | { kind: 'eye-piloted'; spaceId: string }
  | { kind: 'eye-flown'; spaceId: string }
  | { kind: 'eye-filmed'; spaceId: string; seen: number }
  | { kind: 'sealed'; stage: number }
  | { kind: 'dowsed'; spaceId: string; distance: number; decks: number }
  | { kind: 'watching'; spaceId: string }
  | { kind: 'isolated'; spaceId: string; occupant: boolean }
  | { kind: 'stripped'; spaceId: string; count: number }
  /**
   * Air Blow, held on a thing to chain the gusts, and refused.
   *
   * The archive gives this ability no rate and no reach — its own entry says
   * the precise functioning remains unknown — so a walk that let a reader hold
   * the key down and watch a bar fill would be inventing the one number the
   * catalogue is explicit about not having.
   */
  | { kind: 'blast-solid-refused'; solidId: string }
  // ── Combo Master ─────────────────────────────
  /** The console is out, and pointed at somebody. `left` is what the screen says. */
  | { kind: 'decipher-opened'; characterId: string; reading: string; left: number }
  /** Another day banked beside them, and what the screen reads now. */
  | { kind: 'decipher-advanced'; characterId: string; left: number }
  /** The reading is finished: what it decoded is on the console. */
  | { kind: 'deciphered'; characterId: string; days: number }
  /** SELECT, then one of the three slots. The bench is loaded. */
  | { kind: 'fabrication-started'; slot: string; days: number }
  /** And the walk out of the door, which costs every day of it. */
  | { kind: 'fabrication-lost'; slot: string; days: number }
  /** The tool comes off the bench, against what the reading decoded. */
  | { kind: 'fabricated'; slot: string }
  /**
   * The console has the whole of his aura, so nothing else may be cast.
   *
   * A permanent refusal for as long as the work runs, and the last arc's own
   * picture of the man rather than a gap in the walk: he is three hundred and
   * sixty-five days into somebody else's curse and casting nothing.
   */
  | { kind: 'console-locked'; left: number }
  /** The alert triangle: a concealed attack, and whoever else carries it. */
  | { kind: 'affected-users'; attack: string; affected: number; unreadable: number }
  | { kind: 'laid-open'; spaces: number; decks: number }
  | { kind: 'emptied'; spaceId: string; structures: number }
  | { kind: 'swallowed'; solidId: string; held: number }
  | { kind: 'coughed-up'; solidId: string; spaceId: string; held: number }
  | { kind: 'bag-empty' }
  | { kind: 'refused'; spaceId: string }
  | { kind: 'dispatched'; spaceId: string }
  /** The birds converge on the room the visitor is standing in. */
  | { kind: 'flock-gathered'; spaceId: string; birds: number }
  /** They were already here: the flock is told to disperse instead. */
  | { kind: 'flock-dispersed'; spaceId: string }
  /**
   * What the flock sees below it is not filed.
   *
   * The one use of this ability the walk shows itself refusing. Cluck's birds
   * carry — that is every panel there is of them — and a reconstruction that
   * quietly began sourcing rooms from a survey nobody drew would be inventing
   * evidence under a real person's name. So the refusal is shown, which is the
   * only honest form the use can take here.
   */
  | { kind: 'flock-survey-refused' }
  | { kind: 'double-mode-changed'; mode: TourDoubleMode }
  | { kind: 'owl-mode-changed'; mode: TourOwlMode }
  | { kind: 'owl-flown'; spaceId: string }
  | { kind: 'owl-expired'; rooms: number }
  // On the solids.
  | { kind: 'no-solid' }
  | { kind: 'bound-fast'; solidId: string }
  /**
   * A solid taken hold of, waiting for the second one the technique joins it to.
   *
   * Gallery Fake's swap and Convert Hands' relay both work on a pair, and
   * neither of them is gum: they get their own word so the panel does not
   * announce a filament the visitor has not cast.
   */
  | { kind: 'solid-paired'; solidId: string }
  /** The filament went out and took hold, at the metres it reached to do it. */
  | { kind: 'gum-set'; solidId: string; metres: number }
  | { kind: 'gum-pulled'; solidId: string; otherId: string }
  | { kind: 'forged'; solidId: string; as: StructureKind }
  /**
   * The mask tried on something round, and refused with the limit that refuses
   * it. Carried as a report rather than swallowed, because the condition is
   * half of what the catalogue says about the technique.
   */
  | { kind: 'mask-refused'; solidId: string }
  /** The eyes turning, and whose they are: `null` for the visitor's own. */
  | { kind: 'eyes-turned'; by: string | null }
  /** The eyes let go, and the hours it cost — never given back. */
  | { kind: 'eyes-out'; hours: number }
  /** One more second held: the hour it took, and the hours still to the year. */
  | { kind: 'eyes-held'; hours: number; until: number }
  /** The year gone, and the five minutes without Nen that ch. 380 pairs with it. */
  | { kind: 'zetsu-forced'; seconds: number }
  /** A cast attempted during those five minutes. Nothing goes out, including this. */
  | { kind: 'in-forced-zetsu'; left: number }
  /** A door's plaque made to read another room's number, or given back its own. */
  | { kind: 'sign-forged'; spaceId: string; asId: string }
  | { kind: 'sign-restored'; spaceId: string }
  /** A guard who would have put the visitor out, looking at somebody else's face. */
  | { kind: 'unrecognised'; spaceId: string; asId: string }
  | { kind: 'wrapped'; solidId: string }
  | { kind: 'unwrapped'; solidId: string; spaceId: string }
  | { kind: 'pushed'; solidId: string; metres: number }
  // Order Stamp, which is three states rather than one: stamped, locked, told.
  | { kind: 'stamped'; solidId: string; puppets: number }
  | { kind: 'stamp-locked'; solidId: string; locked: boolean; locks: number }
  | { kind: 'ordered'; spaceId: string; puppets: number }
  | { kind: 'no-lock'; stamped: number }
  | { kind: 'copied'; solidId: string; hours: number }
  /** Copies whose day was up. Nothing is left behind: a fake that left something
   * behind would have left something real. */
  | { kind: 'copies-faded'; solids: number }
  | { kind: 'crushed'; solidId: string }
  | { kind: 'volley'; solidId: string; hits: number }
  /**
   * A thing come apart, and what came apart on it.
   *
   * Three techniques arrive at this one word and they do not sound or look
   * alike: a third burst of ten barrels, a fist with fifteen rotations behind
   * it, and paper confetti finishing what it started. The report used to say
   * only that the thing was gone, so the walk had one answer for all three and
   * therefore gave none of them — `by` is what lets the scene and the speaker
   * play the blow that was actually thrown.
   */
  | { kind: 'shattered'; solidId: string; by: 'barrage' | 'windup' | 'shred' }
  | { kind: 'wound-up'; turns: number; by: string | null }
  /** The arm released with nothing in it. Calibration is the stated weak point. */
  | { kind: 'not-wound'; solidId: string }
  /** A limb became a tool. Which one answered was drawn, not chosen. */
  | { kind: 'limb-armed'; tool: string }
  /** The fight is over: the tool goes back into the body of its own accord. */
  | { kind: 'limb-human' }
  /** The barrage swept across a room: how many things stood in it, how many fell. */
  | { kind: 'swept'; spaceId: string; solids: number; broken: number }
  /** A sweep across a room with nothing standing in it. */
  | { kind: 'nothing-there'; spaceId: string }
  /**
   * The shot tried without the mutilation.
   *
   * The restriction is not a cost paid for the ability — it *is* the ability,
   * and Franklin is the archive's own worked example of a vow. So the walk
   * offers the ungated shot and refuses it with the reason, which teaches the
   * rule; hiding the key would only have hidden the rule with it.
   */
  | { kind: 'fingers-intact-refused' }
  /** Rising Sun raised with no wrapping on: the two abilities go together. */
  | { kind: 'no-packet' }
  /** Pain Packer tried before any physical injury was available to commit. */
  | { kind: 'no-injury' }
  /** A physical injury chosen by the visitor, outside Nen. */
  | {
      kind: 'self-injured'
      severity: 'light' | 'medium' | 'severe'
      damage: number
      total: number
      packed: boolean
    }
  /** A blow aimed at something folded away. Everything comes out of the cloth whole. */
  | { kind: 'in-the-cloth'; solidId: string }
  /** The cloth opened with nothing folded into it. */
  | { kind: 'nothing-in-the-cloth' }
  | { kind: 'launched'; solidId: string; metres: number }
  | { kind: 'struck'; solidId: string }
  /** The ball on the end of the Dowsing Chain, brought down on a thing. */
  | { kind: 'lashed'; solidId: string; hits: number }
  | { kind: 'bound'; solidId: string }
  | { kind: 'released'; solidId: string }
  /** Both arms are already round something, so there is nothing to catch with. */
  | { kind: 'arms-full'; solidIds: string[] }
  /**
   * The fist came out under what was aimed at, and the line it took to get there.
   *
   * `through` is the ability rather than decoration: ch. 385's whole substance
   * is aura running *in* a surface from the impact to the exit, and Gyo is what
   * shows it. A report that only said where the fist arrived would be reporting
   * a projectile. `throughDoor` is the exit chosen on a leaf that is shut — the
   * panel the technique is drawn in — which the walk names rather than lets
   * pass as an ordinary strike.
   */
  | {
      kind: 'came-up-under'
      solidId: string
      otherId: string
      through: Vec2[]
      throughDoor: boolean
    }
  | { kind: 'came-up-empty'; spaceId: string; through: Vec2[] }
  /**
   * There was nothing between here and there to run through.
   *
   * The refusal ch. 385 makes by construction: the blow passes through matter,
   * and an open well over the promenade is not matter. Shown with its rule,
   * because a cast that silently did nothing would read as the walk being
   * broken when it is the technique being itself.
   */
  | { kind: 'punch-refused'; spaceId: string }
  | { kind: 'stitched'; solidId: string }
  | { kind: 'nothing-to-stitch'; solidId: string }
  | { kind: 'animated'; solidId: string }
  | { kind: 'shred-stuck'; solidId: string }
  | { kind: 'shred-cut'; solidId: string; left: number }
  // Padaille's three, which are three reports rather than one with a tool on
  // it: what the visitor wants to read is what happened, and finding out which
  // tool it was is the same sentence.
  | { kind: 'hammered'; solidId: string }
  | { kind: 'bored'; solidId: string }
  | { kind: 'halved'; solidId: string; apart: boolean }
  | { kind: 'grown'; solidId: string }
  | { kind: 'growth-refused'; solidId: string }
  | { kind: 'marked'; solidId: string; mark: 'sun' | 'moon' }
  | { kind: 'detonated'; solidId: string; otherId: string }
  | { kind: 'swapped'; solidId: string; otherId: string }
  | { kind: 'cargo-taken'; solidId: string }
  | { kind: 'cargo-landed'; solidId: string; spaceId: string }
  | { kind: 'puppeted'; solidId: string }
  | { kind: 'puppet-released'; solidId: string }
  | { kind: 'autopilot-started' }
  // On the doors.
  | { kind: 'jailed'; spaceId: string; doors: number }
  | { kind: 'jail-refused'; spaceId: string }
  | { kind: 'fish-loosed'; spaceId: string }
  | { kind: 'fish-fed'; spaceId: string; solidId: string }
  | { kind: 'guards-posted'; spaceId: string }
  | { kind: 'expelled'; spaceId: string; toId: string }
  | { kind: 'card-blue'; spaceId: string }
  | { kind: 'card-yellow'; spaceId: string }
  | { kind: 'card-red'; spaceId: string }
  | { kind: 'vow-declared'; subjectId: string; rules: string[] }
  | { kind: 'vow-broken'; subjectId: string }
  | { kind: 'vow-locked'; subjectId: string }
  | { kind: 'pact-taken'; spaceId: string }
  | { kind: 'pact-met'; spaceId: string; released: number }
  | { kind: 'bait-set'; spaceId: string }
  | { kind: 'trapped'; spaceId: string }
  | { kind: 'held-fast'; spaceId: string }
  | { kind: 'snakes-loosed'; rooms: number }
  | { kind: 'snakes-fed'; spaceId: string }
  | { kind: 'snakes-rebound' }
  | { kind: 'worm-set'; spaceId: string }
  | { kind: 'worm-open'; a: string; b: string }
  | { kind: 'worm-crossed'; spaceId: string; crossings: number }
  | { kind: 'worm-spent' }
  | { kind: 'double-posted'; spaceId: string }
  | { kind: 'double-spent'; spaceId: string }
  // The Guardian Spirit Beasts.
  | { kind: 'beast-raised'; spaceId: string; solids: number }
  | { kind: 'beast-dismissed'; spaceId: string; solids: number }
  | { kind: 'wheel-raised'; spaceId: string; coin: number }
  | { kind: 'wheel-dismissed'; spaceId: string }
  | { kind: 'coin-taken'; spaceId: string; value: number; gilded: number }
  | { kind: 'lie-pushed'; solidId: string; metres: number }
  | { kind: 'lie-greened'; solidId: string }
  | { kind: 'lie-transformed'; solidId: string }
  | { kind: 'gas-loosed'; spaceId: string; solids: number }
  | { kind: 'gas-lifted'; spaceId: string }
  | { kind: 'melted'; spaceId: string; melting: number; gone: number }
  | { kind: 'room-brightened'; spaceId: string; levied: number }
  | { kind: 'halo-raised'; spaceId: string; levied: number; halo: number }
  | { kind: 'reeled'; spaceId: string; pulled: number; eaten: number }
  | { kind: 'smoke-loosed'; spaceId: string }
  | { kind: 'smoke-lifted'; spaceId: string; filled: number }
  | { kind: 'smoke-spread'; spaceId: string; filled: number; full: boolean }
  | { kind: 'flock-loosed'; rooms: number; beasts: number }
  | { kind: 'flock-called-in'; rooms: number }
  | { kind: 'isolation-lifted'; spaceId: string }
  | { kind: 'crushed-one'; spaceId: string; solidId: string; left: number }
  // On the visitor.
  | { kind: 'reinforced'; committed: number }
  | { kind: 'boarded'; passengers: number }
  | { kind: 'alighted'; spaceId: string | null; passengers: number }
  | { kind: 'loaded'; solidId: string; passengers: number }
  | { kind: 'hold-full' }
  | { kind: 'projected'; spaceId: string }
  | { kind: 'returned'; spaceId: string }
  | { kind: 'body-disturbed'; spaceId: string }
  | { kind: 'reshaped'; metres: number }
  | { kind: 'rested'; hours: number }
  | { kind: 'mended'; spaceId: string | null; solids: number }
  | { kind: 'dance-played'; bars: number }
  | { kind: 'dance-needed' }
  | { kind: 'mimicked'; solidId: string }
  | { kind: 'unmimicked' }
  | { kind: 'soothed'; opened: boolean }
  /**
   * One air played into one room. `on` is false when the same air was played
   * into the same room again, which is what takes the piece back off it, and
   * `solids` is what the lively one got moving — nought for the other two.
   */
  | { kind: 'tune-played'; tune: TourTune; spaceId: string; on: boolean; solids: number }
  /**
   * The flute comes down and the piece stops where it stood.
   *
   * Its own word rather than `tune-played` with `on: false`, because what it
   * reports is not that an air ended: it is that Melody stopped playing, and
   * the senses the music was holding open close over again with it.
   */
  | { kind: 'flute-lowered'; tune: TourTune; spaceId: string }
  /**
   * The ear turned on the next compartment, and told no.
   *
   * Attested that it reaches further than this — she hears through walls, and
   * that is why the answer is a refusal rather than silence — but a room the
   * visitor is not standing in is a room the walk would be sourcing off a sense
   * nobody can check.
   */
  | { kind: 'ear-refused'; spaceId: string }
  | { kind: 'deduced'; what: string; strength: number }
  | { kind: 'nothing-to-deduce' }
  | { kind: 'armour-worn'; packed: number }
  | { kind: 'armour-holding'; packed: number }
  | { kind: 'sun-risen'; metres: number; solids: number }
  // On the record.
  | { kind: 'owl-attached'; rooms: number }
  | { kind: 'owl-recalled'; rooms: number }
  | { kind: 'foreseen'; spaceId: string }
  | { kind: 'vision-ended' }
  | { kind: 'diverged'; spaceId: string; wentTo: string }
  | { kind: 'written'; spaceId: string }
  | { kind: 'line-taken'; spaceId: string; lines: number }
  | { kind: 'poem-read'; strength: number }
  | { kind: 'dial-set'; spaceId: string }
  | { kind: 'dial-read'; spaceId: string; reading: number }
  | { kind: 'droplet-sent'; spaceId: string; left: number }
  | { kind: 'droplets-dry' }
  | { kind: 'droplet-expired'; spaceId: string }
  | { kind: 'name-taken'; spaceId: string }
  | { kind: 'counterattack'; spaceId: string; released: number }
  | { kind: 'marked-victim'; spaceId: string }
  | { kind: 'sacrifice-found'; spaceId: string }
  | { kind: 'curse-fell'; victim: string; sacrifice: string }
  | { kind: 'souls-swapped'; a: string; b: string }
  | { kind: 'arrow-drawn'; spaceId: string }
  // On the techniques.
  | { kind: 'nothing-to-steal'; spaceId: string }
  | { kind: 'taken-into-the-book'; spaceId: string; technique: HatsuInteractionKind }
  | { kind: 'needs-two-pages' }
  | { kind: 'bookmarked'; technique: HatsuInteractionKind }
  | { kind: 'acquisition-failed'; spaceId: string }
  | { kind: 'carded'; spaceId: string; technique: HatsuInteractionKind }
  | { kind: 'not-eligible'; spaceId: string }
  | { kind: 'inherited'; spaceId: string; technique: HatsuInteractionKind }
  | { kind: 'drained'; spaceId: string; technique: HatsuInteractionKind }
  | { kind: 'needs-emperor-time' }
  | { kind: 'nothing-to-lend' }
  | { kind: 'lent'; technique: HatsuInteractionKind }
  | { kind: 'page-spent'; technique: HatsuInteractionKind }
  | { kind: 'in-zetsu'; spaceId: string }
  // Bungee Gum
  | { kind: 'gum-trap-set'; spaceId: string }
  | { kind: 'gum-rebound'; spaceId: string }
  | { kind: 'gum-healed'; healed: number }
  /**
   * The strand contracted, and what it was stuck to came across the room.
   *
   * `tension` rides along because the force is the whole ability — the panel
   * reads the gauge off the report rather than recomputing a stretch nobody
   * else kept — and `metres` is how far the thing actually travelled.
   */
  | { kind: 'gum-reeled'; solidId: string; metres: number; tension: number }
  /** Cast across a bulkhead: the filament holds, and nothing moves. */
  | { kind: 'gum-taut'; solidId: string; tension: number }
  /** The filament let go of the wrist and out onto somebody walking past. */
  | { kind: 'gum-stuck-on'; characterId: string }
  /** The visitor anchored above the gap and pulled themselves across it. */
  | { kind: 'gum-propulsion'; tension: number }
  | { kind: 'jail-self-refused' }
