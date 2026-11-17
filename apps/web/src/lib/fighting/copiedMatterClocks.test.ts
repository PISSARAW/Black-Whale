import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight, performAuraAttack } from './engine'
import { copyHistoricalObject, GALLERY_FAKE_LIFETIME } from './chrolloHistoricalObjects'
import { interactWithPreparation } from './preparationSimulation'
import { performArsenalCommand } from './retrospectiveArsenal'
import { composeBashoPoem } from './bashoAction'
import { BASHO_ATTESTED_POEMS, type BashoEffect } from './bashoPoem'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { CAT_CAPTURE_END } from './camillaCat'
import { expireHistoricalMatter } from './historicalMatterClock'
import { updateEntity } from './preparationWorld'
import { captureCuldceptProjectile } from './benjaminCuldcept'
import { attackData } from './frameData'
import { catchBungeeObject } from './hisokaCatch'
import { EMPTY_INPUT, type FightState } from './types'

function frames(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function book(state: FightState): FightState {
  return {
    ...state,
    player: {
      ...state.player,
      x: 25,
      aura: 100,
      chrolloBook: {
        pages: ['gallery-fake'],
        page: 0,
        open: false,
        bookmark: 'gallery-fake',
      },
    },
  }
}

describe('material lifetime survives paused combat and maintained effects', () => {
  it('does not make a copied projectile permanent by storing it in Culdcept', () => {
    const start = book(
      beginFight(
        createFight('chrollo', 'benjamin', {
          mode: 'versus-local',
          environment: {
            preparation: { mode: 'scenario', resources: ['devices'], cohorts: [] },
          },
        }),
      ),
    )
    const made = frames(copyHistoricalObject(start, 'player', 'player:device:firearm'), 19)
    const replica = made.battlefield!.entities.find((e) => e.copy)!
    let state = { ...made, player: { ...made.player, x: replica.x } }
    state = performArsenalCommand(state, 'player', { action: 'device-pickup', target: replica.id })
    state = performArsenalCommand(state, 'player', { action: 'device-fire', target: replica.id })
    const projectile = { ...state.projectiles[0], x: state.opponent.x - 1 }
    const armed = performAuraAttack({
      state,
      side: 'opponent',
      kind: 'special',
      moveId: 'benjamin:downSpecial',
      auraCharged: false,
    })
    const active = {
      ...armed,
      projectiles: [],
      opponent: {
        ...armed.opponent,
        attack: { ...armed.opponent.attack!, frame: attackData('special', armed.opponent).startup },
      },
    }
    const caught = captureCuldceptProjectile(active, {
      projectile,
      defenderSide: 'opponent',
      position: { x: projectile.x, y: projectile.y },
    })!
    expect(caught.opponent.hatsuEffects.baton?.card?.materialCopyId).toBe(replica.id)
    const lost = expireHistoricalMatter({
      ...caught,
      player: { ...caught.player, chrolloBook: { ...caught.player.chrolloBook!, bookmark: null } },
    })
    expect(lost.opponent.hatsuEffects.baton?.card).toBeNull()
  })
  it('keeps a fired copied bullet after damage to its gun, but expires the detached matter with Gallery Fake', () => {
    const start = book(
      beginFight(
        createFight('chrollo', 'hisoka', {
          mode: 'versus-local',
          environment: {
            preparation: { mode: 'scenario', resources: ['devices'], cohorts: [] },
          },
        }),
      ),
    )
    const made = frames(copyHistoricalObject(start, 'player', 'player:device:firearm'), 19)
    const replica = made.battlefield!.entities.find((e) => e.copy)!
    let held = { ...made, player: { ...made.player, x: replica.x } }
    held = performArsenalCommand(held, 'player', { action: 'device-pickup', target: replica.id })
    const fired = performArsenalCommand(held, 'player', {
      action: 'device-fire',
      target: replica.id,
    })
    expect(fired.projectiles).toHaveLength(1)
    expect(fired.projectiles[0].materialCopyId).toBe(replica.id)
    const prepared = performArsenalCommand({ ...fired, projectiles: [] }, 'opponent', {
      action: 'gum-catch',
    })
    const shot = { ...fired.projectiles[0], x: prepared.opponent.x - 1 }
    const caught = catchBungeeObject(prepared, {
      projectile: shot,
      defenderSide: 'opponent',
      position: { x: shot.x, y: shot.y },
    })!
    expect(caught.opponent.gumCatch?.projectile?.materialCopyId).toBe(replica.id)
    const catchLost = expireHistoricalMatter({
      ...caught,
      player: { ...caught.player, chrolloBook: { ...caught.player.chrolloBook!, bookmark: null } },
    })
    expect(catchLost.opponent.gumCatch).toBeUndefined()
    const broken = expireHistoricalMatter(updateEntity(fired, replica.id, { health: 0 }))
    expect(broken.projectiles).toHaveLength(1)
    const lost = expireHistoricalMatter({
      ...broken,
      player: { ...broken.player, chrolloBook: { ...broken.player.chrolloBook!, bookmark: null } },
    })
    expect(lost.projectiles).toHaveLength(0)
  })
  it('expires carried matter when Cat’s Name kills the living source, without waiting for the sequence to end', () => {
    const start = book(
      beginFight(
        createFight('chrollo', 'camilla', {
          mode: 'versus-local',
          formatId: 'knockout',
          environment: {
            preparation: { mode: 'scenario', resources: ['needles'], cohorts: [] },
          },
        }),
      ),
    )
    const made = frames(copyHistoricalObject(start, 'player', 'player:needles'), 19)
    const id = made.battlefield!.entities.find((e) => e.copy)!
    const held = interactWithPreparation({ ...made, player: { ...made.player, x: id.x } }, 'player')
    expect(held.player.equipmentProps?.needles?.copyId).toBe(id.id)
    const dead = { ...held, opponent: { ...held.opponent, health: 0 } }
    const cat = resolveFightOutcome(
      recordFightDeath(dead, { victimSide: 'opponent', killerSide: 'player', cause: 'strike' }),
    )
    const beforeDeath = frames(cat, CAT_CAPTURE_END - 1)
    expect(beforeDeath.player.equipment).toContain('needles')
    const captured = frames(beforeDeath, 1)
    expect(captured.catsName).toBeTruthy()
    expect(captured.player.health).toBe(0)
    expect(captured.player.equipment).not.toContain('needles')
    expect(captured.time).toBe(cat.time)
  })
  it('removes an expired copied kit, archived poems and worn charm even during hitstop', () => {
    const start = book(
      beginFight(
        createFight('chrollo', 'basho', {
          mode: 'versus-local',
          formatId: 'knockout',
          environment: {
            preparation: { mode: 'scenario', resources: ['writing'], cohorts: [] },
          },
        }),
      ),
    )
    let state = frames(copyHistoricalObject(start, 'player', 'player:writing-kit'), 19)
    const replica = state.battlefield!.entities.find((e) => e.copy)!
    state = performArsenalCommand(state, 'opponent', { action: 'writing-drop' })
    state = {
      ...state,
      player: { ...state.player, x: 40 },
      opponent: { ...state.opponent, x: replica.x, aura: 100 },
    }
    state = performArsenalCommand(state, 'opponent', { action: 'writing-take', target: replica.id })
    expect(state.opponent.writingKit?.copyId).toBe(replica.id)
    for (const effect of Object.keys(BASHO_ATTESTED_POEMS) as BashoEffect[]) {
      state = composeBashoPoem(
        { state, side: 'opponent', text: BASHO_ATTESTED_POEMS[effect].fr },
        performAuraAttack,
      )
      state = frames(state, 60)
      expect(state.opponent.bashoPoem?.ready).toBe(true)
    }
    state = performArsenalCommand(state, 'opponent', { action: 'basho-ward', target: 'opponent' })
    expect(state.opponent.bashoWard?.remainingFrames).toBeGreaterThan(0)
    expect(state.opponent.bashoArchive).toHaveLength(2)
    const separated = expireHistoricalMatter(updateEntity(state, replica.id, { health: 0 }))
    expect(separated.opponent.writingKit).toBeUndefined()
    expect(separated.opponent.bashoArchive).toHaveLength(2)
    expect(separated.opponent.bashoWard?.remainingFrames).toBeGreaterThan(0)
    const expired = frames(
      { ...separated, frame: replica.copy!.createdAt + GALLERY_FAKE_LIFETIME - 1, hitstop: 1 },
      1,
    )
    expect(expired.opponent.writingKit).toBeUndefined()
    expect(expired.opponent.bashoArchive).toBeUndefined()
    expect(expired.opponent.bashoWard).toBeUndefined()
  })
})
