import { describe, expect, it } from 'vitest'
import { BODY_KINDS, PERSON_HATSU_KINDS, reachesABody } from '../bodyKinds'
import { CHAIN_JAIL_FACTION, reachBody, type ReachInput } from './reach'
import type { CastDossier } from './dossier'
import type { CastMember, Post } from './types'

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
    now: NOW,
    ...overrides,
  })

describe('the list of what reaches a body is closed', () => {
  it('holds the five that had nowhere to land until the walk was peopled', () => {
    for (const kind of PERSON_HATSU_KINDS) expect(reachesABody(kind)).toBe(true)
  })

  it('refuses a technique that has nothing to say to a person, out loud', () => {
    const answer = reach({ kind: 'blast' })
    expect(answer).toEqual({ outcome: 'refused', kind: 'blast', reason: 'not-a-body' })
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
    expect(reach({ kind: 'disguise' })).toMatchObject({ hold: { mark: 'masked' } })
    expect(reach({ kind: 'melody' })).toMatchObject({ hold: { mark: 'soothed' } })
    expect(reach({ kind: 'damage-transfer' })).toMatchObject({ hold: { mark: 'linked' } })
    expect(reach({ kind: 'curse' })).toMatchObject({ hold: { mark: 'marked' } })
  })

  it('dates every hold it lays from the walk’s own clock', () => {
    const answer = reach({ kind: 'elastic' })
    expect(answer.outcome === 'held' && answer.hold.since).toBe(NOW)
    expect(answer.outcome === 'held' && answer.hold.until > NOW).toBe(true)
    expect(answer.outcome === 'held' && answer.hold.characterId).toBe('sakata')
  })
})
