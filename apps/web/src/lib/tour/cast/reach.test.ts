import { describe, expect, it } from 'vitest'
import { BODY_KINDS, PERSON_HATSU_KINDS, reachesABody } from '../bodyKinds.js'
import { CHAIN_JAIL_FACTION, FLOCK_ADDRESSEES, reachBody, type ReachInput } from './reach.js'
import type { CastDossier } from './dossier.js'
import type { CastMember, Post } from './types.js'

const ROOM = 'tier-1-royal-residential-sector-room-1014'
const NOW = 1_000_000

function post(overrides: Partial<CastMember> = {}): Post {
  const member: CastMember = {
    characterId: 'sakata',
    name: 'Sakata',
    locations: [ROOM],
    role: 'Royal Bodyguard for Prince Woble Hui Guo Rou',
    since: 'ch-358',
    nen: true,
    hatsu: [],
    beast: null,
    ...overrides,
  }
  return { member, spaceId: ROOM, tierId: 'tier-1', at: [0, 0], costume: { role: 'guard' } }
}

const dossier = (overrides: Partial<CastDossier> = {}): CastDossier => ({
  characterId: 'sakata',
  role: 'Royal Bodyguard',
  faction: null,
  factionId: null,
  category: null,
  techniques: [],
  route: [],
  withheld: 0,
  sealed: null,
  ...overrides,
})

const reach = (overrides: Partial<ReachInput> = {}) =>
  reachBody({
    kind: 'elastic',
    target: post(),
    dossier: dossier(),
    aura: 'ten',
    book: null,
    speaking: false,
    throughMatter: true,
    decipherDays: 10,
    now: NOW,
    ...overrides,
  })

describe('the list of what reaches a body is closed', () => {
  it('holds the five that had nowhere to land until the walk was peopled', () => {
    for (const kind of PERSON_HATSU_KINDS) expect(reachesABody(kind)).toBe(true)
  })

  it('refuses a technique that has nothing to say to a person, out loud', () => {
    // Air Blow used to be the example here, and is not any more: it reaches a
    // body now, in order to refuse it out loud. A room technique is one that
    // has genuinely nothing to say to a person.
    const answer = reach({ kind: 'teleport' })
    expect(answer).toEqual({ outcome: 'refused', kind: 'teleport', reason: 'not-a-body' })
    expect(reachesABody(null)).toBe(false)
  })

  it('refuses when nobody is down the reticle', () => {
    expect(reach({ target: null })).toMatchObject({ outcome: 'refused', reason: 'no-target' })
  })

  it('leaves nothing in the list without a hold or an answer of its own', () => {
    for (const kind of BODY_KINDS) {
      const answer = reach({ kind, dossier: dossier({ factionId: CHAIN_JAIL_FACTION }) })
      expect(answer.outcome === 'refused' && answer.reason === 'not-a-body').toBe(false)
    }
  })
})

describe('the refusals, which are canon conditions and not budgets', () => {
  it('holds Kurapika to his vow: the Troupe, and nobody else', () => {
    expect(reach({ kind: 'chain-bind' })).toMatchObject({ outcome: 'refused', reason: 'oath' })
    const member = reach({
      kind: 'chain-bind',
      dossier: dossier({ factionId: CHAIN_JAIL_FACTION }),
    })
    expect(member.outcome).toBe('held')
  })

  /** Theta fires to test a Zetsu. Inventing an aura to test would invent a user. */
  it('has nothing to test on a body the archive gives no Nen', () => {
    expect(reach({ kind: 'training-shot', target: post({ nen: false }) })).toMatchObject({
      outcome: 'refused',
      reason: 'no-aura',
    })
  })

  it('will not claim a needle goes into a body holding its aura up', () => {
    expect(reach({ kind: 'needle', aura: 'ren' })).toMatchObject({
      outcome: 'refused',
      reason: 'resisted',
    })
    expect(reach({ kind: 'needle', aura: 'ten' }).outcome).toBe('held')
  })

  it('refuses the rite whose cost is the death of whoever performs it', () => {
    expect(reach({ kind: 'postmortem-curse' })).toMatchObject({
      outcome: 'refused',
      reason: 'suicide',
    })
  })

  /** §2.3: the walk records no wounds, so there is never anything to close. */
  it('has nothing for a healing chain to work on', () => {
    expect(reach({ kind: 'healing' })).toMatchObject({ outcome: 'refused', reason: 'unhurt' })
  })
})

describe('the three that ask rather than hold', () => {
  it('reports a Zetsu that held under the shot, and an aura that did not', () => {
    expect(reach({ kind: 'training-shot', aura: 'zetsu' })).toMatchObject({
      outcome: 'told',
      tells: ['holds-zetsu'],
    })
    expect(reach({ kind: 'training-shot', aura: 'ten' })).toMatchObject({
      outcome: 'told',
      tells: ['declares-aura'],
    })
  })

  it('swings the dowsing chain at what the archive holds without a date', () => {
    const sealed = dossier({ sealed: { allegiance: 'Heil-Ly', identity: null } })
    expect(reach({ kind: 'dowsing', dossier: sealed })).toMatchObject({
      outcome: 'told',
      tells: ['holds-sealed', 'declares-aura'],
    })
    expect(reach({ kind: 'dowsing' })).toMatchObject({
      outcome: 'told',
      tells: ['holds-plain', 'declares-aura'],
    })
  })

  it('unseals with Body and Soul only where something is sealed', () => {
    const sealed = dossier({ sealed: { allegiance: null, identity: 'a dead man’s name' } })
    expect(reach({ kind: 'truth-punch', dossier: sealed })).toMatchObject({
      outcome: 'told',
      tells: ['unsealed'],
    })
    expect(reach({ kind: 'truth-punch' })).toMatchObject({
      outcome: 'told',
      tells: ['holds-plain'],
    })
  })

  /** Their whole output is what the visitor now knows: no thread is laid. */
  it('lays nothing on anybody', () => {
    for (const kind of ['dowsing', 'truth-punch', 'training-shot'] as const) {
      expect(reach({ kind }).outcome).not.toBe('held')
    }
  })
})

describe('what a hold looks like', () => {
  it('draws the thread, the order and the mark by what they do', () => {
    expect(reach({ kind: 'elastic' })).toMatchObject({ outcome: 'held', hold: { mark: 'bound' } })
    expect(reach({ kind: 'needle' })).toMatchObject({ hold: { mark: 'controlled' } })
    expect(reach({ kind: 'damage-transfer' })).toMatchObject({ hold: { mark: 'linked' } })
    expect(reach({ kind: 'curse' })).toMatchObject({ hold: { mark: 'marked' } })
  })

  /** Ch. 357 draws Hisoka wearing a face that is not his — not a guard wearing
   * one. So the body aimed at is read and given back, and the layer is on the
   * visitor: nothing is laid, and nothing expires off anybody. */
  it('takes a face off the body in front of it, and holds nobody', () => {
    const answer = reach({ kind: 'disguise' })
    expect(answer).toEqual({ outcome: 'worn', kind: 'disguise', characterId: 'sakata' })
  })

  /**
   * Ch. 320 is a pigeon putting a ballot in a Zodiac's hand, and it is the only
   * errand the archive draws this flock running. Both answers below are true
   * statements about the ability; the refusal is the more instructive of them,
   * because it is the walk saying out loud what the manipulation takes.
   */
  describe('the flock, which carries rather than holds', () => {
    it('puts what a bird carried into a Zodiac’s hand, and holds nobody', () => {
      const answer = reach({
        kind: 'flock',
        dossier: dossier({ factionId: FLOCK_ADDRESSEES }),
      })
      expect(answer).toEqual({ outcome: 'delivered', kind: 'flock', characterId: 'sakata' })
    })

    it('refuses the sentry in the corridor: the manipulation takes birds', () => {
      const answer = reach({ kind: 'flock', dossier: dossier({ factionId: 'kakin-royal-guard' }) })
      expect(answer).toEqual({ outcome: 'refused', kind: 'flock', reason: 'only-birds' })
    })

    it('refuses just as plainly when the archive gives them no faction at all', () => {
      expect(reach({ kind: 'flock', dossier: null })).toMatchObject({ reason: 'only-birds' })
    })
  })

  /**
   * Ch. 45 is a heart heard while its owner talks, and that is the whole of the
   * condition: a heart under no question is a heart. What the skip is projected
   * off is the archive withholding something this entry would otherwise date —
   * the same evidence the dowsing chain swings on, heard rather than felt.
   */
  describe('the ear on a heart, which asks rather than holds', () => {
    const listen = (over: Partial<ReachInput> = {}) => reach({ kind: 'melody', ...over })

    it('hears nothing worth reporting while nobody is saying anything', () => {
      expect(listen({ speaking: false })).toMatchObject({
        outcome: 'told',
        tells: ['not-speaking'],
      })
    })

    it('hears the beat skip under an answer the archive is withholding', () => {
      expect(
        listen({
          speaking: true,
          dossier: dossier({ sealed: { allegiance: 'heil-ly', identity: null } }),
        }),
      ).toMatchObject({ outcome: 'told', tells: ['heart-skips'] })
      expect(listen({ speaking: true, dossier: dossier({ withheld: 2 }) })).toMatchObject({
        tells: ['heart-skips'],
      })
    })

    it('hears it keep time when there is nothing being kept back', () => {
      expect(listen({ speaking: true })).toMatchObject({ tells: ['heart-steady'] })
    })

    // Asking is not holding: the music soothes a room and the visitor, and the
    // ear on one person leaves them exactly as it found them.
    it('lays no hold on the person it listened to', () => {
      expect(listen({ speaking: true }).outcome).not.toBe('held')
    })
  })

  /**
   * Ch. 385 is Leorio hitting a man he cannot see: the blow crosses a bulkhead
   * from the sick bay and catches somebody in the next compartment. What it
   * will not cross is an open well, and that rule follows it onto a body.
   */
  describe('the blow that comes out of the deck, aimed at a person', () => {
    it('takes a man off his feet through the bulkhead between you', () => {
      const answer = reach({ kind: 'remote-strike', throughMatter: true })
      expect(answer).toMatchObject({ outcome: 'held', hold: { mark: 'struck' } })
    })

    // A blow and not a wound: §2.3 keeps the walk from recording injuries, and
    // what is left is a man on the deck who gets up.
    it('lays a hold that lifts on its own, and records no injury', () => {
      const answer = reach({ kind: 'remote-strike', throughMatter: true })
      expect(answer.outcome === 'held' && answer.hold.until > NOW).toBe(true)
    })

    it('refuses across a well, with the same rule the ship makes for a solid', () => {
      expect(reach({ kind: 'remote-strike', throughMatter: false })).toEqual({
        outcome: 'refused',
        kind: 'remote-strike',
        reason: 'no-matter',
      })
    })
  })

  /**
   * Air Blow aimed at a person, which the archive does not follow that far.
   * Vincent raises his left palm to break a guard and the entry stops there —
   * no reach, no rate, nothing about the man behind the guard. So the walk
   * emits from the palm, because that much is conceded, and refuses the rest.
   */
  it('refuses the sentry rather than inventing what a gust does to a man', () => {
    expect(reach({ kind: 'blast' })).toEqual({
      outcome: 'refused',
      kind: 'blast',
      reason: 'palm-only',
    })
  })

  it('dates every hold it lays from the walk’s own clock', () => {
    const answer = reach({ kind: 'elastic' })
    expect(answer.outcome === 'held' && answer.hold.since).toBe(NOW)
    expect(answer.outcome === 'held' && answer.hold.until > NOW).toBe(true)
    expect(answer.outcome === 'held' && answer.hold.characterId).toBe('sakata')
  })
})

/**
 * Ch. 369 is the thumb chain on Sayird, Little Eye leaving its bearer, and — the
 * half the walk did not have — Kurapika letting go of it again. A theft with no
 * return is not this ability; it is a permanent maiming, and the chain is
 * explicitly a thing that unwinds.
 */
describe('the thumb, which takes one ability and gives it back', () => {
  // Little Eye, in the vocabulary a repertoire is actually written in: the
  // roster files a body's techniques by the walk's *kind*, never by the
  // catalogue's ability id, and what the chain hands the book has to be a kind
  // or the book has no page to file it under.
  const sayird = post({ characterId: 'sayird', hatsu: ['scout'] })
  const steal = (book: ReachInput['book']) =>
    reach({ kind: 'chain-rule', target: sayird, book })

  it('tears the ability out of whoever has one', () => {
    expect(steal(null)).toMatchObject({
      outcome: 'stolen',
      characterId: 'sayird',
      technique: 'scout',
      hold: { mark: 'drained' },
    })
  })

  it('refuses a second theft while the finger is taken', () => {
    expect(steal({ open: 'scout', pages: ['scout'], stolenFrom: 'someone-else' })).toEqual({
      outcome: 'refused',
      kind: 'chain-rule',
      reason: 'thumb-occupied',
    })
  })

  // The exception that makes the condition a condition rather than a dead end.
  it('gives it back when aimed at the person it was taken from', () => {
    expect(steal({ open: 'scout', pages: ['scout'], stolenFrom: 'sayird' })).toEqual({
      outcome: 'returned',
      kind: 'chain-rule',
      characterId: 'sayird',
      technique: 'scout',
    })
  })

  it('has nothing to take off somebody the archive gives no ability', () => {
    expect(reach({ kind: 'chain-rule', book: null })).toEqual({
      outcome: 'refused',
      kind: 'chain-rule',
      reason: 'no-target-ability',
    })
  })
})
