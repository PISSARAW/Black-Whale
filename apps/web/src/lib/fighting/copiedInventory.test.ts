import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  performAuraAttack,
  performMove,
  tickFight,
} from './engine'
import { copyHistoricalObject, GALLERY_FAKE_LIFETIME } from './chrolloHistoricalObjects'
import { interactWithPreparation } from './preparationSimulation'
import { expireHistoricalMatter } from './historicalMatterClock'
import { reconcileChrolloPages } from './chrolloPageEffects'
import { updateEntity } from './preparationWorld'
import { hasIllumiNeedles } from './illumiEquipment'
import { attackData } from './frameData'
import { resolveFightImpacts } from './combatImpact'
import { createTeamFight, requestTeamAssist } from './teamMatch'
import { performArsenalCommand } from './retrospectiveArsenal'
import { privatePvpState } from './pvp/view'
import { advanceCopiedInventory } from './copiedInventory'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'

function ready(kind: 'flute' | 'needles', opponent: FighterId = 'hisoka'): FightState {
  const base = beginFight(
    createFight('chrollo', opponent, {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: {
          mode: 'scenario',
          resources: [kind === 'flute' ? 'flutes' : 'needles'],
          cohorts: [],
        },
      },
    }),
  )
  return {
    ...base,
    player: {
      ...base.player,
      x: 25,
      aura: 100,
      chrolloBook: {
        pages: ['gallery-fake', 'illumi'],
        page: 0,
        open: false,
        bookmark: 'gallery-fake',
      },
    },
    opponent: { ...base.opponent, x: 75, aura: 100 },
  }
}
function advance(state: FightState, count = 19): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function copied(kind: 'flute' | 'needles', opponent: FighterId = 'hisoka'): FightState {
  return advance(copyHistoricalObject(ready(kind, opponent), 'player', `player:${kind}`))
}
function pickup(state: FightState, side: 'player' | 'opponent' = 'player'): FightState {
  const target = state.battlefield!.entities.find((e) => e.copy)!
  const positioned = { ...state, [side]: { ...state[side], x: target.x } }
  const next = interactWithPreparation(positioned, side)
  expect(next[side].equipmentProps).toBeTruthy()
  return next
}
function losePage(state: FightState): FightState {
  const changed = {
    ...state,
    player: {
      ...state.player,
      chrolloBook: { ...state.player.chrolloBook!, open: false, bookmark: null },
    },
  }
  return reconcileChrolloPages(state, changed, 'player')
}

describe('conjured tools retain their actual material provenance after pickup', () => {
  it('keeps a thrown copied needle’s origin after it leaves the collected stock', () => {
    const made = copied('needles', 'illumi')
    const disarmed = {
      ...made,
      player: { ...made.player, x: 40 },
      opponent: { ...made.opponent, equipment: [] },
    }
    const held = pickup(disarmed, 'opponent')
    const id = held.opponent.equipmentProps!.needles!.copyId!
    let thrown = performAuraAttack({
      state: held,
      side: 'opponent',
      kind: 'ranged',
      auraCharged: false,
    })
    for (let i = 0; i < 30 && !thrown.projectiles.length; i++) thrown = advance(thrown, 1)
    expect(thrown.projectiles[0]).toMatchObject({
      shape: 'needle',
      matter: 'nen',
      materialCopyId: id,
    })
    expect(losePage(thrown).projectiles).toHaveLength(0)
  })
  it.each(['flute', 'needles'] as const)(
    'does not convert a picked-up %s into permanent gear when its source page closes',
    (kind) => {
      const held = pickup(copied(kind))
      const id = held.battlefield!.entities.find((e) => e.copy)!.id
      expect(held.player.equipmentProps?.[kind]).toMatchObject({
        entityId: id,
        copyId: id,
        material: 'nen',
      })
      const lost = losePage(held)
      expect(lost.player.equipment).not.toContain(kind)
      expect(lost.player.equipmentProps?.[kind]).toBeUndefined()
      expect(expireHistoricalMatter(lost)).toBe(lost)
    },
  )
  it('retains an actual ordinary tool and never replaces an existing real stock with a copy', () => {
    const base = ready('needles', 'illumi')
    const near = { ...base, player: { ...base.player, x: 23 } }
    const real = interactWithPreparation(near, 'player')
    expect(real.player.equipmentProps?.needles?.material).toBe('real')
    expect(losePage(real).player.equipment).toContain('needles')
    const made = copied('needles', 'illumi')
    const id = made.battlefield!.entities.find((e) => e.copy)!.id
    const nearby = { ...made, opponent: { ...made.opponent, x: 20 } }
    const untouched = interactWithPreparation(nearby, 'opponent')
    expect(hasIllumiNeedles(untouched.opponent)).toBe(true)
    expect(untouched.opponent.equipmentProps?.needles).toBeUndefined()
    expect(untouched.battlefield!.entities.find((e) => e.id === id)?.present).toBe(true)
  })
  it('cannot launder copied needles into the next round’s real equipment', () => {
    const held = pickup(copied('needles'))
    expect(hasIllumiNeedles(held.player)).toBe(true)
    const next = nextRound({ ...held, phase: 'finished', winner: 'player' })
    expect(hasIllumiNeedles(next.player)).toBe(false)
    expect(next.player.equipmentProps).toBeUndefined()
  })
  it('expires a copied instrument and immediately stops its actual music and pacification', () => {
    const made = copied('flute', 'melody')
    const withoutOriginal = {
      ...made,
      player: { ...made.player, x: 35 },
      opponent: { ...made.opponent, equipment: [], melodyFlute: false },
    }
    let held = pickup(withoutOriginal, 'opponent')
    held = performAuraAttack({
      state: held,
      side: 'opponent',
      kind: 'special',
      moveId: 'melody:neutralSpecial',
      auraCharged: false,
    })
    const playing = advance(held, 25)
    expect(playing.opponent.melodyPerformance?.startupFrames).toBe(0)
    expect(playing.player.hatsuEffects.entrancedFrames).toBe(1)
    const view = privatePvpState(playing, 'opponent')
    expect(view.opponent.chrolloBook?.pages).toEqual([])
    expect(advanceCopiedInventory(view)).toBe(view)
    expect(view.player.equipment).toContain('flute')
    const probe = { ...view, pvpSeat: undefined }
    expect(advanceCopiedInventory(probe)).toBe(probe)
    const id = playing.battlefield!.entities.find((e) => e.copy)!
    const expired = expireHistoricalMatter({
      ...playing,
      frame: id.copy!.createdAt + GALLERY_FAKE_LIFETIME,
    })
    expect(expired.opponent.melodyFlute).toBe(false)
    expect(expired.opponent.melodyPerformance).toBeUndefined()
    expect(expired.player.hatsuEffects.entrancedFrames).toBe(0)
  })
  it('preserves a genuinely marked copy while refusing to duplicate the original’s Nen mark', () => {
    const held = pickup(copied('flute'))
    const id = held.player.equipmentProps!.flute!.copyId!
    const marked = updateEntity(held, id, { arena: { width: 1, height: 1, sun: 'player' } })
    const kept = losePage(marked)
    expect(kept.player.equipment).toContain('flute')
    const destroyed = expireHistoricalMatter(updateEntity(kept, id, { health: 0 }))
    expect(destroyed.player.equipment).not.toContain('flute')
  })
  it('keeps a real implanted brain injury when its copied control needle disappears', () => {
    let held = pickup(copied('needles'))
    held = {
      ...held,
      player: {
        ...held.player,
        x: 40,
        aura: 100,
        chrolloBook: { ...held.player.chrolloBook!, page: 1, open: true },
      },
      opponent: { ...held.opponent, x: 46 },
    }
    const armed = performMove({ state: held, side: 'player', action: 'special' })
    expect(armed.player.attack).toBeTruthy()
    armed.player.attack!.frame = attackData('special', armed.player).startup
    const controlled = resolveFightImpacts(armed, [])
    expect(controlled.opponent.needlePuppet).toMatchObject({
      needleEmbedded: true,
      mediumCopyId: held.player.equipmentProps!.needles!.copyId,
    })
    const id = controlled.battlefield!.entities.find((e) => e.copy)!
    const expired = expireHistoricalMatter({
      ...controlled,
      frame: id.copy!.createdAt + GALLERY_FAKE_LIFETIME,
    })
    expect(expired.opponent.needlePuppet?.needleEmbedded).toBe(false)
    expect(expired.opponent.needlePuppet).toBeTruthy()
    expect(
      performMove({ state: expired, side: 'opponent', action: 'light' }).opponent.attack,
    ).toBeNull()
  })
  it('expires gear on the actual reserve member and locates it there before it disappears', () => {
    const base = beginFight(
      createTeamFight(
        { player: ['chrollo', 'basho', 'illumi'], opponent: ['bill', 'hisoka', 'melody'] },
        {
          preparation: { mode: 'scenario', resources: ['needles'], cohorts: [] },
        },
      ),
    )
    const initial = {
      ...base,
      player: {
        ...base.player,
        x: 25,
        aura: 100,
        chrolloBook: {
          pages: ['gallery-fake' as const],
          page: 0,
          open: false,
          bookmark: 'gallery-fake' as const,
        },
      },
      opponent: { ...base.opponent, x: 75 },
    }
    let state = advance(copyHistoricalObject(initial, 'player', 'player:needles'))
    state = pickup(state, 'opponent')
    state = { ...state, opponent: { ...state.opponent, x: 93 } }
    state = requestTeamAssist(state, 'opponent', 1)
    expect(state.opponent.id).toBe('hisoka')
    state = performArsenalCommand(state, 'player', {
      action: 'history-gallery-locate',
      target: 'player:needles',
    })
    expect(state.player.chrolloHistorical?.galleryReading?.copies[0].x).toBe(93)
    const lost = losePage(state)
    expect(lost.teamMatch!.seats.opponent.members[0].equipment).not.toContain('needles')
    expect(lost.opponent.equipment).not.toContain('needles')
  })
})
