import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { NEN_CANON } from './nenCanon'
import { FIGHT_ABILITY_CATEGORIES } from './nenCatalogue.gen'
import { movesetFor } from './movesets'
import { fightAbility } from './nenAbility'
import { forceZetsu } from './nen'
import { benjaminNenActive } from './benjaminBaton'
import { lynchNenAvailable } from './lynchRules'
import { sweetHomeAvailable } from './sweetHomeContacts'
import { doorNenAvailable, advanceVoconteDoors } from './voconteDoors'
import { hasMoonlightAuthority, offerMoonlightContract } from './moonlightContract'
import { gyoSight, insideEn } from './nenPerception'
import { witnessedHatsu } from './nenWitness'
import { createKurapika } from './kurapika'
import { createPainPacker } from './feitanPain'
import { canUseFightHatsu, hatsuFor } from './hatsu'
import { type ArcadeFighter, type FighterId, type FightSide, type FightState } from './types'

function duel(id: FighterId, side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(side === 'player' ? id : 'hisoka', side === 'opponent' ? id : 'hisoka', {
      mode: 'versus-local',
      environment: { preparation: { mode: 'scenario', resources: [], cohorts: [side] } },
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 45, aura: 100 },
    opponent: { ...state.opponent, x: 50, aura: 100 },
  }
}

const LOCKS: Array<[string, (fighter: ArcadeFighter) => ArcadeFighter]> = [
  ['death', (fighter) => ({ ...fighter, health: 0 })],
  ['voluntary Zetsu', forceZetsu],
  ['exhaustion before the next frame', (fighter) => ({ ...fighter, auraExhausted: true })],
  [
    'forced Zetsu before the next frame',
    (fighter) => ({ ...fighter, hatsuEffects: { ...fighter.hatsuEffects, forcedZetsuFrames: 30 } }),
  ],
  [
    'Chain Jail before the next frame',
    (fighter) => ({ ...fighter, chainJail: { owner: 'opponent', x: fighter.x, y: 0 } }),
  ],
  ['Moonlight sanction', (fighter) => ({ ...fighter, moonlightZetsu: true })],
  [
    'Predator price',
    (fighter) => ({
      ...fighter,
      predator: {
        watching: false,
        known: [],
        analysis: null,
        hunt: null,
        sealFrames: 30,
        successes: 0,
      },
    }),
  ],
  [
    'Emperor Time blackout',
    (fighter) => ({ ...fighter, kurapika: { ...createKurapika(), blackoutFrames: 30 } }),
  ],
  ['On seal', (fighter) => ({ ...fighter, on: { grudge: 0, sealFrames: 30 } })],
  ['active On', (fighter) => ({ ...fighter, nen: { ...fighter.nen, on: true } })],
]

describe('current Nen reference for all forty playable fighters', () => {
  it('covers the exact roster, explicit conditions and only existing catalogue abilities', () => {
    expect(FIGHTING_ROSTER).toHaveLength(40)
    expect(Object.keys(NEN_CANON).sort()).toEqual(FIGHTING_ROSTER.map(({ id }) => id).sort())
    for (const { id } of FIGHTING_ROSTER) {
      const profile = NEN_CANON[id]!
      expect(profile.condition, id).not.toBe('')
      expect(profile.prohibition, id).not.toBe('')
      expect(profile.adaptation, id).not.toBe('')
      for (const ability of profile.abilities)
        expect(FIGHT_ABILITY_CATEGORIES, `${id}: ${ability}`).toHaveProperty(ability)
      for (const move of movesetFor(id)!.moves.filter((entry) =>
        ['special', 'finisher'].includes(entry.category),
      )) {
        expect(move.canon.source, move.id).not.toBe('Black Whale: Clash combat interpretation')
        expect(move.canon.conditions, move.id).not.toContain(
          'Standard combat and aura rules apply.',
        )
      }
    }
  })

  it('keeps unknown personal Hatsu, bodily forms and prepared support separate', () => {
    expect(NEN_CANON.theta!.abilities).toEqual([])
    expect(hatsuFor('theta').martialOnly).toBe(true)
    expect(hatsuFor('biscuit').martialOnly).toBe(true)
    expect(hatsuFor('camilla').onDeath).toBeTypeOf('function')
    expect(hatsuFor('sayird').stealableOutsideDuel?.id).toBe('sayird:littleEye')
    expect(hatsuFor('cluck').stealableOutsideDuel?.id).toBe('cluck:birdManipulation')
    for (const id of ['theta', 'biscuit', 'camilla', 'beyond'] as const)
      expect(fightAbility(duel(id).player)).toBeNull()
  })
})

describe('maintained and direct actions obey every shared Nen lock', () => {
  for (const side of ['player', 'opponent'] as const) {
    it.each(LOCKS)(`${side}: local ability checks reject %s immediately`, (_name, lock) => {
      expect(canUseFightHatsu(lock(duel('hisoka', side)[side]))).toBe(false)
      expect(benjaminNenActive(lock(duel('benjamin', side)[side]))).toBe(false)
      expect(lynchNenAvailable(lock(duel('lynch', side)[side]))).toBe(false)
      const sweet = duel('terebellum', side)
      sweet[side] = lock(sweet[side])
      expect(sweetHomeAvailable(sweet, side)).toBe(false)
      expect(doorNenAvailable(lock(duel('voconte', side)[side]))).toBe(false)
      const pact = duel('longhi', side)
      pact[side] = lock(pact[side])
      expect(offerMoonlightContract({ state: pact, side })).toBe(pact)
      const bow = duel('halkenburg', side)
      bow[side] = lock({
        ...bow[side],
        hatsuEffects: { ...bow[side].hatsuEffects, cohortWillFrames: 20 },
      })
      expect(hatsuFor('halkenburg').onFrame(bow)[side].hatsuEffects.cohortWillFrames).toBe(0)
    })
  }

  it('a stolen Sweet Home or Door cannot persist while the victim recovers aura', () => {
    const sweet = duel('terebellum')
    sweet.player.stolenChainAbility = { owner: 'opponent', moveId: 'terebellum:neutralSpecial' }
    expect(sweetHomeAvailable(sweet, 'player')).toBe(false)
    const door = duel('voconte')
    door.player.stolenChainAbility = { owner: 'opponent', moveId: 'voconte:neutralSpecial' }
    door.voconteDoors = { networks: { player: { active: true } }, transported: [], lastTransit: {} }
    const next = advanceVoconteDoors(door)
    expect(next.voconteDoors!.networks.player).toBeUndefined()
  })

  it('does not let an exhausted signatory make a new pact with recovered aura', () => {
    const state = duel('longhi')
    state.player.auraExhausted = true
    expect(offerMoonlightContract({ state, side: 'player' })).toBe(state)
  })

  it('retains an earned independent Moonlight loan when the personal Hatsu is stolen', () => {
    const fighter = duel('hisoka').player
    fighter.moonlightLoan = 1
    fighter.hatsuEffects.hatsuStolen = 1
    expect(hasMoonlightAuthority(fighter)).toBe(true)
  })

  it('never advances shared will from a sealed arrow ability', () => {
    const state = duel('halkenburg')
    state.player.stolenChainAbility = { owner: 'opponent', moveId: 'halkenburg:neutralSpecial' }
    expect(hatsuFor('halkenburg').onFrame(state).player.hatsuEffects.cohortWillFrames).toBe(0)
  })
})

describe('perception uses actual Nen access without taking basic Nen away with a Hatsu', () => {
  function observer(): ArcadeFighter {
    const fighter = duel('hinrigh').player
    return { ...fighter, nen: { ...fighter.nen, mode: 'ren', gyo: true, en: { radius: 20 } } }
  }

  it.each(LOCKS)('%s cannot identify In through stale Gyo or En state', (_name, lock) => {
    const fighter = lock(observer())
    expect(gyoSight(fighter)).toBe(false)
    expect(insideEn(fighter, { x: fighter.x, y: fighter.y })).toBe(false)
    const state = duel('hisoka')
    state.opponent = fighter
    expect(witnessedHatsu(state, { side: 'player', source: 'hisoka', concealed: true })).toBeNull()
  })

  it('basic Gyo and En survive theft; blindness prevents Gyo but not En localization', () => {
    const fighter = observer()
    fighter.hatsuEffects.hatsuStolen = 1
    expect(gyoSight(fighter)).toBe(true)
    expect(insideEn(fighter, fighter)).toBe(true)
    fighter.hatsuEffects.senseSeals = 1
    expect(gyoSight(fighter)).toBe(false)
    expect(insideEn(fighter, fighter)).toBe(true)
    fighter.hatsuEffects.senseSeals = 0
    fighter.parallelEyesClosed = true
    expect(gyoSight(fighter)).toBe(false)
  })
})

describe('actual techniques select their own Nen categories', () => {
  it.each([
    ['bonolenov', 'downSpecial', 'battle-cantabile-metamorphosen'],
    ['bonolenov', 'finisher', 'battle-cantabile-jupiter'],
    ['bonolenov', 'backSpecial', null],
    ['feitan', 'neutralSpecial', 'pain-packer'],
    ['feitan', 'finisher', 'rising-sun'],
    ['feitan', 'forwardSpecial', null],
    ['kalluto', 'backSpecial', 'surveillance-paper-dolls'],
    ['saiyu', 'finisher', 'saiyu-priest-staff'],
    ['benjamin', 'forwardSpecial', 'secret-window'],
    ['benjamin', 'backSpecial', null],
    ['chrollo', 'forwardSpecial', 'skill-hunter'],
  ] as const)('%s:%s resolves to %s', (id, slot, ability) => {
    expect(fightAbility(duel(id).player, `${id}:${slot}`)).toBe(ability)
  })

  it('a copied Pain Packer page resolves the actual preparation or solar release', () => {
    const fighter = duel('chrollo').player
    fighter.chrolloBook = { pages: ['feitan'], page: 0, open: true, bookmark: null }
    fighter.hatsuEffects.painPacker = { ...createPainPacker(), injuries: 20 }
    expect(fightAbility(fighter)).toBe('pain-packer')
    fighter.hatsuEffects.painPacker = { ...createPainPacker(), armour: true, packedDamage: 20 }
    expect(fightAbility(fighter)).toBe('rising-sun')
  })

  it('a copied Benjamin attack is Air Blow, not a generic enhancement from the archive', () => {
    const fighter = duel('chrollo').player
    fighter.chrolloBook = { pages: ['benjamin'], page: 0, open: true, bookmark: null }
    expect(fightAbility(fighter)).toBe('air-blow')
  })

  it('a maintained stolen ability never replaces another chain’s own identity', () => {
    const fighter = duel('kurapika').player
    fighter.kurapika = {
      ...createKurapika(),
      held: {
        source: 'hisoka',
        victim: 'opponent',
        moveId: 'hisoka:neutralSpecial',
        loaded: true,
        used: true,
        sustainedKeys: ['gum'],
      },
    }
    expect(fightAbility(fighter, 'hisoka:neutralSpecial')).toBe('bungee-gum')
    expect(fightAbility(fighter, 'kurapika:forwardSpecial')).toBe('dowsing-chain')
    expect(fightAbility(fighter, 'kurapika:downSpecial')).toBe('holy-chain')
  })
})
