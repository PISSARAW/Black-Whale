import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAttack, performMove, tickFight } from './engine'
import { createFightEnvironment } from './fightEnvironment'
import { preparationCheck } from './preparationRequirements'
import { enContacts } from './nenPerception'
import { interactWithPreparation, advancePreparation } from './preparationSimulation'
import { controlledEntities, preparedActionReady } from './preparationActions'
import { createBattlefield, readyCohort, updateEntity } from './preparationWorld'
import { canActivateLsdf, advanceLsdf } from './lsdf'
import { toggleEmperorTime } from './kurapikaActions'
import { dolphinCanUse, withDolphinIdentity } from './kurapikaDolphin'
import { resolveSweetHomeImpact } from './sweetHomeImpact'
import { attackData } from './frameData'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'
import type { PreparationResource } from './preparationTypes'

function duel(
  player: FighterId,
  resources: PreparationResource[] = [],
  opponent: FighterId = 'hisoka',
): FightState {
  const environment = createFightEnvironment({
    preparation: { mode: resources.length ? 'scenario' : 'duel', resources, cohorts: [] },
  })
  const state = beginFight(createFight(player, opponent, { mode: 'versus-local', environment }))
  return {
    ...state,
    player: { ...state.player, aura: 100 },
    opponent: { ...state.opponent, aura: 100 },
  }
}

function frames(state: FightState, count: number): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

function page(state: FightState, source: Exclude<FighterId, 'chrollo'>) {
  return {
    ...state,
    player: {
      ...state.player,
      chrolloBook: { pages: [source], page: 0, open: true, bookmark: null },
    },
  }
}

function dolphin(state: FightState, source: FighterId, moveId: string) {
  const active = toggleEmperorTime(state, 'player')
  active.player.kurapika = {
    ...active.player.kurapika!,
    held: { source, victim: 'opponent', moveId, loaded: true, used: false, sustainedKeys: [] },
  }
  return active
}

describe('Combat preparation and real scenario entities', () => {
  it('En detects the actual prepared matter, excluding destination and objective markers', () => {
    const state = duel('hinrigh', ['rooms', 'objects', 'birds'])
    state.player = { ...state.player, x: 50 }
    state.opponent = { ...state.opponent, x: 55 }
    state.battlefield!.entities = state.battlefield!.entities.map((entity) => ({
      ...entity,
      x: 50,
      y: 0,
    }))
    state.player.nen = { ...state.player.nen, mode: 'ren', en: { radius: 20 } }
    expect(enContacts(state, 'player')).toBe(7) // Opponent, two rooms, two crates, two pigeons.
    const gone = updateEntity(state, 'player:crate', { health: 0 })
    expect(enContacts(gone, 'player')).toBe(6)
  })
  it('provides only personal equipment in a strict duel and installs the selected real resources in a scenario', () => {
    const plain = duel('melody')
    expect(plain.player.equipment).toEqual(['flute'])
    expect(plain.opponent.equipment).toEqual([])
    expect(plain.battlefield!.entities).toEqual([])
    const prepared = duel('sayird', ['animals', 'birds', 'plants', 'objects', 'flutes', 'rooms'])
    for (const kind of ['animal', 'bird', 'seed', 'crate', 'flute', 'room', 'destination'])
      expect(
        prepared.battlefield!.entities.some(
          (entry) => entry.kind === kind && entry.material === 'real',
        ),
      ).toBe(true)
  })

  it('resets resources, control, inventories and irreversible room state for a new round without mutating the preparation settings', () => {
    const state = duel('sayird', ['animals', 'rooms', 'flutes'])
    state.player.x = 20
    const opened = interactWithPreparation(state, 'player')
    expect(
      opened.battlefield!.entities.find((entry) => entry.id === 'player:room')?.invalidated,
    ).toBe(true)
    expect(state.battlefield!.entities.find((entry) => entry.id === 'player:room')?.sealed).toBe(
      true,
    )
    const next = nextRound({ ...opened, phase: 'finished', winner: 'player' })
    expect(next.battlefield!.entities.find((entry) => entry.id === 'player:room')?.sealed).toBe(
      true,
    )
    expect(next.battlefield).not.toBe(state.battlefield)
  })

  it('Little Eye requires a real small animal, produces observation rather than damage and persists while its user is unconscious', () => {
    const plain = duel('sayird')
    expect(performAttack(plain, 'player', 'special')).toBe(plain)
    const state = duel('sayird', ['animals'])
    const controlled = frames(performAttack(state, 'player', 'special'), 8)
    expect(controlledEntities(controlled, 'player')).toHaveLength(1)
    expect(controlled.player.attack).toBeNull()
    expect(controlled.opponent.health).toBe(state.opponent.health)
    expect(controlled.player.aura).toBeGreaterThanOrEqual(98)
    const unconscious = { ...controlled, player: { ...controlled.player, hitStun: 90 } }
    const advanced = advancePreparation(unconscious, { player: EMPTY_INPUT })
    expect(controlledEntities(advanced, 'player')).toHaveLength(1)
    expect(controlledEntities(advanced, 'player')[0].x).toBe(
      controlledEntities(controlled, 'player')[0].x,
    )
    const nenAnimal = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) => ({
          ...entry,
          material: 'nen' as const,
        })),
      },
    }
    expect(performAttack(nenAnimal, 'player', 'special')).toBe(nenAnimal)
  })

  it('allows both players to use a prepared target and releases control when the ability is stolen', () => {
    const state = duel('sayird', ['animals'], 'sayird')
    const controlled = frames(
      performAttack(performAttack(state, 'player', 'special'), 'opponent', 'special'),
      8,
    )
    expect(controlledEntities(controlled, 'player')).toHaveLength(1)
    expect(controlledEntities(controlled, 'opponent')).toHaveLength(1)
    const stolen = {
      ...controlled,
      player: {
        ...controlled.player,
        hatsuEffects: { ...controlled.player.hatsuEffects, hatsuStolen: 1 },
      },
    }
    expect(
      controlledEntities(advancePreparation(stolen, { player: EMPTY_INPUT }), 'player'),
    ).toHaveLength(0)
  })

  it('uses real pigeons to deliver a message, without inventing an offensive swarm', () => {
    const state = duel('cluck', ['birds'])
    const delivered = frames(performAttack(state, 'player', 'special'), 180)
    expect(delivered.battlefield!.completed.player).toBe(1)
    expect(
      delivered.battlefield!.entities.find((entry) => entry.id === 'player:bird')?.delivered,
    ).toBe(true)
    expect(delivered.opponent.health).toBe(state.opponent.health)
    expect(delivered.impact).toBeNull()
  })

  it('Erigeron germinates a contacted living seed without healing or buffing its user', () => {
    const state = duel('bill', ['plants'])
    state.player.health = 30
    const grown = performAttack(state, 'player', 'special')
    expect(grown.battlefield!.entities.find((entry) => entry.id === 'player:seed')?.growth).toBe(1)
    expect(grown.player.health).toBe(30)
    expect(grown.opponent.health).toBe(state.opponent.health)
    expect(grown.player.attack).toBeNull()
    expect(grown.battlefield!.completed.player).toBe(1)
    expect(preparedActionReady(grown, 'player')).toBe(false)
    expect(preparedActionReady({ ...state, player: { ...state.player, x: 60 } }, 'player')).toBe(
      false,
    )
  })

  it('a flute must actually be picked up, with one pickup per key press and no remote teleport into the inventory', () => {
    const state = duel('kurapika', ['flutes'])
    const pickup = interactWithPreparation(state, 'player')
    expect(pickup.player.equipment).toContain('flute')
    expect(state.player.equipment).not.toContain('flute')
    expect(pickup.battlefield!.entities.find((entry) => entry.id === 'player:flute')?.present).toBe(
      false,
    )
    const distant = { ...state, player: { ...state.player, x: 50 } }
    expect(interactWithPreparation(distant, 'player')).toBe(distant)
    const keyboard = tickFight(
      state,
      { ...EMPTY_INPUT, interact: true },
      { dt: 1 / 60, opponentInput: EMPTY_INPUT },
    )
    expect(keyboard.player.equipment).toContain('flute')
  })

  it('Melody stops playing immediately when her physical flute is no longer present', () => {
    const state = duel('melody')
    const playing = performAttack(state, 'player', 'special')
    expect(playing.player.melodyPerformance).toBeDefined()
    const disarmed = { ...playing, player: { ...playing.player, equipment: [] } }
    expect(frames(disarmed, 1).player.melodyPerformance).toBeUndefined()
  })

  it('Luini moves through a prepared anchor instead of gaining an evasion charge; opening it permanently invalidates that room', () => {
    const state = duel('luini', ['rooms'])
    const anchored = performAttack(state, 'player', 'special')
    expect(anchored.player.x).toBe(state.player.x)
    const moved = performAttack(frames(anchored, 18), 'player', 'special')
    expect(moved.player.x).toBe(85)
    expect(moved.player.hatsuEffects.teleportDodges).toBe(0)
    const returned = performAttack(frames(moved, 18), 'player', 'special')
    expect(returned.player.x).toBe(20)
    const opened = interactWithPreparation(state, 'player')
    expect(preparationCheck(opened, 'player').ready).toBe(false)
    const reclosed = updateEntity(opened, 'player:room', { sealed: true })
    expect(preparationCheck(reclosed, 'player').ready).toBe(false)
    expect(performAttack(reclosed, 'player', 'special')).toBe(reclosed)
  })

  it('keeps Luini’s visited-exit condition separate from Voconte’s directional frames', () => {
    const state = duel('luini', ['rooms'])
    const unvisited = updateEntity(state, 'player:destination', { visitedBy: ['opponent'] })
    const anchored = frames(performAttack(unvisited, 'player', 'special'), 18)
    expect(performAttack(anchored, 'player', 'special')).toBe(anchored)
    const voconte = duel('voconte')
    const setup = performAttack(voconte, 'player', 'special')
    expect(setup.player.x).toBe(voconte.player.x)
    expect(setup.voconteDoors?.networks.player?.pending?.open).toBe(true)
  })

  it('LSDF requires the actual Morena entity, correct jurisdiction and an unlawful intruder throughout the escort', () => {
    const environment = createFightEnvironment({
      stageId: 'heilly-hideout',
      morenaPresent: true,
      unlawfulIntruders: { player: false, opponent: true },
    })
    const state = beginFight(createFight('yokotani', 'hisoka', { environment }))
    expect(canActivateLsdf(state, 'player')).toBe(true)
    const summoned = performAttack(state, 'player', 'special')
    expect(summoned.lsdf?.player).toBeDefined()
    const absent = updateEntity(summoned, 'neutral:morena', { present: false })
    expect(canActivateLsdf(absent, 'player')).toBe(false)
    expect(advanceLsdf(absent).lsdf?.player).toBeUndefined()
  })

  it('Halkenburg cannot charge from an empty background or from unmarked/nonconsenting supporters', () => {
    const plain = frames(duel('halkenburg'), 500)
    expect(plain.player.hatsuEffects.cohortWillFrames).toBe(0)
    const state = duel('halkenburg', ['objects'])
    state.environment.preparation!.cohorts = ['player']
    state.battlefield = createBattlefield(state.environment)
    expect(readyCohort(state, 'player')).toHaveLength(3)
    const charged = frames(state, 480)
    expect(charged.player.hatsuEffects.cohortWillFrames).toBe(480)
    expect(performAttack(charged, 'player', 'special').player.hatsuEffects.arrowNocked).toBe(1)
    const refused = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) => ({ ...entry, consenting: false })),
      },
    }
    expect(frames(refused, 480).player.hatsuEffects.cohortWillFrames).toBe(0)
  })

  it('Sweet Home transfers a wound to a real contacted crate, and cannot reuse a destroyed receiver', () => {
    const state = duel('terebellum', ['objects'])
    state.player.x = 25
    state.opponent.x = 80
    let active = performAttack(state, 'player', 'special')
    active = {
      ...active,
      player: {
        ...active.player,
        attack: { ...active.player.attack!, frame: attackData('special', active.player).startup },
      },
    }
    const impact = {
      sequence: 1,
      attacker: 'opponent' as const,
      kind: 'heavy' as const,
      damage: 20,
      blocked: false,
      parried: false,
      critical: false,
      knockdown: false,
      counterHit: false,
      punish: false,
      antiAir: false,
      wallSplat: false,
      invulnerable: false,
      comboHits: 1,
      damageScale: 1,
      points: 1,
      zone: 'torso' as const,
      concealed: false,
      avoided: false,
      projectileId: null,
      position: { x: 25, y: 6 },
    }
    const wounded = {
      ...active,
      player: { ...active.player, health: active.player.health - 20 },
      impact,
    }
    const transferred = resolveSweetHomeImpact({
      before: active,
      after: wounded,
      damagedSide: 'player',
    })
    expect(transferred.player.health).toBe(active.player.health)
    expect(
      transferred.battlefield!.entities.find((entry) => entry.id === 'player:crate')?.health,
    ).toBe(80)
    expect(transferred.impact?.objectTransfer?.objectId).toBe('player:crate')
    const broken = updateEntity(active, 'player:crate', { health: 0 })
    expect(
      resolveSweetHomeImpact({
        before: broken,
        after: { ...wounded, battlefield: broken.battlefield },
        damagedSide: 'player',
      }).player.health,
    ).toBe(wounded.player.health)
  })
})

describe('Prepared prerequisites survive theft, copying and forecast execution identities', () => {
  it('Skill Hunter copies Little Eye without creating an animal; an active copied page can control a supplied animal', () => {
    const empty = page(duel('chrollo'), 'sayird')
    expect(performAttack(empty, 'player', 'special')).toBe(empty)
    const ready = page(duel('chrollo', ['animals']), 'sayird')
    const cast = frames(performAttack(ready, 'player', 'special'), 8)
    expect(controlledEntities(cast, 'player')[0].controller?.source).toBe('sayird')
    const closed = {
      ...cast,
      player: { ...cast.player, chrolloBook: { ...cast.player.chrolloBook!, open: false } },
    }
    expect(
      controlledEntities(advancePreparation(closed, { player: EMPTY_INPUT }), 'player'),
    ).toHaveLength(0)
  })

  it('a copied flute ability requires the thief’s own flute and free hands; the book must be bookmarked and closed', () => {
    const state = page(duel('chrollo', ['flutes']), 'melody')
    expect(performAttack(state, 'player', 'special')).toBe(state)
    const equipped = interactWithPreparation(state, 'player')
    expect(performAttack(equipped, 'player', 'special')).toBe(equipped)
    const freed = {
      ...equipped,
      player: {
        ...equipped.player,
        chrolloBook: { ...equipped.player.chrolloBook!, open: false, bookmark: 'melody' as const },
      },
    }
    expect(performAttack(freed, 'player', 'special').player.melodyPerformance).toBeDefined()
  })

  it.each([
    ['sayird', 'sayird:littleEye', 'animals'],
    ['cluck', 'cluck:birdManipulation', 'birds'],
    ['bill', 'bill:neutralSpecial', 'plants'],
  ] as const)(
    'Stealth Dolphin retains %s’s target requirements and supports its real utility action',
    (source, moveId, resource) => {
      const empty = dolphin(duel('kurapika'), source, moveId)
      expect(dolphinCanUse(empty, 'player')).toBe(false)
      const state = dolphin(duel('kurapika', [resource]), source, moveId)
      expect(dolphinCanUse(state, 'player')).toBe(true)
      const cast = performMove({
        state,
        side: 'player',
        action: 'special',
        input: { ...EMPTY_INPUT, left: true },
      })
      expect(cast.player.id).toBe('kurapika')
      expect(cast.player.kurapika!.held!.used).toBe(true)
      expect(cast.opponent.health).toBe(state.opponent.health)
      expect(cast.player.attack).toBeNull()
      const sustained = frames(cast, 24)
      if (source !== 'bill') {
        expect(sustained.player.kurapika!.held!.used).toBe(true)
        expect(controlledEntities(sustained, 'player')).toHaveLength(1)
        const released = performMove({
          state: sustained,
          side: 'player',
          action: 'special',
          input: { ...EMPTY_INPUT, left: true },
        })
        expect(controlledEntities(released, 'player')).toHaveLength(0)
      }
    },
  )

  it.each(['kurapika', 'chrollo'] as const)(
    'a %s copy gathers its own cohort instead of inheriting the original supporters',
    (borrower) => {
      const native = duel(borrower)
      const state =
        borrower === 'kurapika'
          ? dolphin(native, 'halkenburg', 'halkenburg:neutralSpecial')
          : page(native, 'halkenburg')
      if (borrower === 'chrollo')
        state.player.chrolloBook = {
          ...state.player.chrolloBook!,
          open: false,
          bookmark: 'halkenburg',
        }
      const prepared = {
        ...state,
        battlefield: createBattlefield({
          ...state.environment,
          preparation: { mode: 'scenario', resources: [], cohorts: ['opponent'] },
        }),
      }
      expect(frames(prepared, 480).player.hatsuEffects.cohortWillFrames).toBe(0)
      const own = {
        ...prepared,
        battlefield: createBattlefield({
          ...state.environment,
          preparation: { mode: 'scenario', resources: [], cohorts: ['player'] },
        }),
      }
      const charged = frames(own, 480)
      expect(charged.player.hatsuEffects.cohortWillFrames).toBe(480)
      const cast =
        borrower === 'kurapika'
          ? performMove({
              state: charged,
              side: 'player',
              action: 'special',
              input: { ...EMPTY_INPUT, left: true },
            })
          : performAttack(charged, 'player', 'special')
      expect(cast.player.hatsuEffects.arrowNocked).toBe(1)
      expect(cast.player.halkenburgSupporter).toMatch(/^player:/)
    },
  )

  it('a borrowed execution identity never grants the owner’s physical flute', () => {
    const state = dolphin(duel('kurapika'), 'melody', 'melody:neutralSpecial')
    state.player.kurapika!.held!.used = true
    withDolphinIdentity(state, (borrowed) => {
      expect(borrowed.player.id).toBe('melody')
      expect(preparationCheck(borrowed, 'player').ready).toBe(false)
      return borrowed
    })
    expect(state.player.equipment).toEqual([])
  })

  it('forecast stepping changes a separate immutable battlefield, not the actual prepared scene', () => {
    const state = duel('cluck', ['birds'])
    const cast = performAttack(state, 'player', 'special')
    const actual = JSON.stringify(cast.battlefield)
    frames({ ...cast, forecastSimulation: true }, 120)
    expect(JSON.stringify(cast.battlefield)).toBe(actual)
  })
})
