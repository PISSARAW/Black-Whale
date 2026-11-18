import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  performAuraAttack,
  performMove,
  tickFight,
} from './engine'
import { paperCommandReady, selectPaperCommand } from './kallutoPaper'
import { paperDolls } from './kallutoSurveillance'
import { createPaperKit } from './kallutoMaterials'
import { performArsenalCommand } from './retrospectiveArsenal'
import { paperKitAi } from './kallutoMaterialAi'
import { paperKitNavigation } from './kallutoMaterialNavigation'
import { copyHistoricalObject } from './chrolloHistoricalObjects'
import { expireHistoricalMatter } from './historicalMatterClock'
import { GALLERY_FAKE_LIFETIME } from './historicalCopyLifetime'
import { launchKallutoPaper } from './kallutoFlight'
import { buildFightFigure } from './fighterFigure'
import * as THREE from 'three'
import { EMPTY_INPUT, type FighterId, type FightState } from './types'

function setup(id: FighterId = 'kalluto'): FightState {
  const base = beginFight(
    createFight(id, 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { preparation: { mode: 'scenario', resources: ['paper'], cohorts: [] } },
    }),
  )
  return {
    ...base,
    player: { ...base.player, x: 30, aura: 100 },
    opponent: { ...base.opponent, x: 48 },
  }
}
function advance(state: FightState, count = 80): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function cast(state: FightState, moveId = 'kalluto:neutralSpecial'): FightState {
  return performAuraAttack({ state, side: 'player', kind: 'special', moveId, auraCharged: false })
}
function use(
  state: FightState,
  action: Parameters<typeof performArsenalCommand>[2]['action'],
  target?: string,
): FightState {
  return performArsenalCommand(state, 'player', { action, target })
}

describe('Kalluto uses actual paper and an actual fan rather than copied supplies', () => {
  it('gives the native user finite personal supplies, and never creates them from a stolen page', () => {
    expect(setup().player.paperKit).toMatchObject({ markers: 12, salvos: 6, sheets: 6, fan: true })
    const base = setup('chrollo')
    const copied = {
      ...base,
      player: {
        ...base.player,
        chrolloBook: { pages: ['kalluto' as const], page: 0, open: true, bookmark: null },
      },
    }
    expect(copied.player.paperKit).toBeUndefined()
    expect(cast(copied, 'chrollo:neutralSpecial')).toBe(copied)
    const equipped = use(
      { ...copied, player: { ...copied.player, x: 26 } },
      'paper-kit-take',
      'player:paper-kit',
    )
    expect(equipped.player.paperKit?.sourceId).toBe('player:paper-kit')
    const launched = advance(cast(equipped, 'chrollo:neutralSpecial'))
    expect(launched.player.paperKit?.markers).toBe(11)
    expect(launched.opponent.plantedPaper?.[0].paperId).toMatch(
      /^player:paper-kit:paper:1(?::path:[12])?$/,
    )
  })
  it('spends a fragment only when it physically leaves the fan and does not refund a miss', () => {
    const base = setup()
    const started = cast(base)
    expect(started.player.paperKit?.markers).toBe(12)
    const released = advance({ ...started, opponent: { ...started.opponent, x: 93 } }, 30)
    expect(released.player.paperKit?.markers).toBe(11)
    expect(released.projectiles[0].paperId).toBe('player:kalluto:kit:paper:1')
    expect(advance(released, 180).player.paperKit?.markers).toBe(11)
    const attacked = performMove({
      state: { ...started, player: { ...started.player, x: 42 } },
      side: 'opponent',
      action: 'light',
    })
    const interrupted = advance(attacked, 30)
    expect(interrupted.player.health).toBeLessThan(base.player.health)
    expect(interrupted.player.paperKit?.markers).toBe(12)
  })
  it('requires remaining stock, spends a sheet for a new doll and reuses that same physical doll', () => {
    const bound = advance(cast(advance(cast(setup())), 'kalluto:backSpecial'))
    expect(bound.player.paperKit).toMatchObject({ markers: 11, sheets: 5, serial: 2 })
    expect(paperDolls(bound.player)[0].paperId).toBe('player:kalluto:kit:paper:2')
    const stopped = use(bound, 'paper-stop-listening')
    const restarted = advance(
      cast(
        { ...stopped, player: { ...stopped.player, paperKit: undefined } },
        'kalluto:backSpecial',
      ),
    )
    expect(paperDolls(restarted.player)[0].active).toBe(true)
    expect(paperDolls(restarted.player)[0].paperId).toBe(paperDolls(bound.player)[0].paperId)
    expect(restarted.player.paperKit).toBeUndefined()
    const empty = {
      ...bound,
      player: { ...bound.player, paperKit: { ...bound.player.paperKit!, markers: 0, salvos: 0 } },
    }
    expect(paperCommandReady(empty, 'player', 'plant')).toBe(false)
    expect(paperCommandReady(empty, 'player', 'serpent')).toBe(true)
    const noLoosePaper = {
      ...empty,
      battlefield: {
        ...empty.battlefield!,
        entities: empty.battlefield!.entities.filter((entry) => !entry.paperScatter),
      },
    }
    expect(paperCommandReady(noLoosePaper, 'player', 'serpent')).toBe(false)
    expect(
      performAuraAttack({ state: empty, side: 'player', kind: 'ranged', auraCharged: false }),
    ).toBe(empty)
  })
  it('drops and picks up the same kit at physical reach, keeping spent supplies through a round', () => {
    const used = advance(cast(setup()))
    const dropped = use(used, 'paper-kit-drop')
    expect(dropped.player.paperKit).toBeUndefined()
    const entry = dropped.battlefield!.entities.find((item) => item.id === 'player:kalluto:kit')!
    expect(entry.paperKit?.markers).toBe(11)
    const far = { ...dropped, player: { ...dropped.player, x: 70 } }
    expect(use(far, 'paper-kit-take', entry.id)).toBe(far)
    const round = nextRound({ ...dropped, phase: 'finished', winner: 'player' })
    expect(round.player.paperKit).toBeUndefined()
    expect(
      round.battlefield!.entities.find((item) => item.id === entry.id)?.paperKit?.markers,
    ).toBe(11)
    const picked = use(dropped, 'paper-kit-take', entry.id)
    expect(picked.player.paperKit).toEqual(entry.paperKit)
    expect(
      nextRound({ ...picked, phase: 'finished', winner: 'player' }).player.paperKit?.markers,
    ).toBe(11)
    expect(
      nextRound({ ...picked, phase: 'finished', winner: 'player' }).battlefield!.entities.find(
        (item) => item.id === entry.id,
      )?.present,
    ).toBe(false)
  })
  it('copies only the kit’s physical remaining contents and expires its conjured sheets and fragments with their source', () => {
    const base = setup('chrollo')
    let state: FightState = {
      ...base,
      player: {
        ...base.player,
        x: 26,
        chrolloBook: {
          pages: ['gallery-fake', 'kalluto'],
          page: 1,
          open: false,
          bookmark: 'gallery-fake',
        },
      },
    }
    state = copyHistoricalObject(state, 'player', 'player:paper-kit')
    const copy = state.battlefield!.entities.find((entry) => entry.copy)!
    expect(copy.paperKit).toMatchObject({
      sourceId: copy.id,
      copyId: copy.id,
      markers: 12,
      sheets: 6,
    })
    state = advance(state, 30)
    state = use(state, 'history-gallery-stop')
    state = advance(
      performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: 'chrollo:downSpecial',
        auraCharged: false,
      }),
      30,
    )
    state = advance({ ...state, player: { ...state.player, x: copy.x } }, 20)
    state = use(state, 'paper-kit-take', copy.id)
    expect(state.player.paperKit?.copyId).toBe(copy.id)
    state = selectPaperCommand(state, 'player', 'plant')
    const shot = launchKallutoPaper(state, 'player', 'plant')
    expect(shot.projectiles[0]).toMatchObject({ matter: 'nen', materialCopyId: copy.id })
    const linked = {
      ...shot,
      player: {
        ...shot.player,
        kallutoPaper: {
          zone: 'torso' as const,
          doll: { target: 'opponent' as const, createdAt: 0, materialCopyId: copy.id },
        },
      },
      opponent: {
        ...shot.opponent,
        plantedPaper: [
          { owner: 'player' as const, zone: 'torso' as const, materialCopyId: copy.id },
        ],
      },
    }
    const expired = expireHistoricalMatter({
      ...linked,
      frame: copy.copy!.createdAt + GALLERY_FAKE_LIFETIME,
    })
    expect(expired.player.paperKit).toBeUndefined()
    expect(expired.opponent.plantedPaper).toEqual([])
    expect(paperDolls(expired.player)).toHaveLength(0)
    expect(expired.projectiles).toHaveLength(0)
    expect(
      state.battlefield!.entities.find((entry) => entry.id === 'player:paper-kit')?.paperKit
        ?.markers,
    ).toBe(12)
  })
  it('lets the AI seek and take actual available supplies, without granting a kit in an empty duel', () => {
    const base = setup()
    const naked = {
      ...base,
      opponent: { ...createFight('hisoka', 'kalluto').opponent, x: 74, paperKit: undefined },
    }
    const picked = paperKitAi(naked)!
    expect(picked.opponent.paperKit?.sourceId).toBe('opponent:paper-kit')
    const empty = { ...naked, battlefield: { ...naked.battlefield!, entities: [] } }
    expect(paperKitAi(empty)).toBeNull()
    expect(paperKitNavigation(empty, empty.opponent)).toBeNull()
    const away = { ...naked, opponent: { ...naked.opponent, x: 62 } }
    expect(paperKitNavigation(away, away.opponent)?.x).toBeGreaterThan(62)
  })
  it('renders a real fan only while the body has that tool', () => {
    const base = setup()
    const figure = (state: FightState) =>
      buildFightFigure({
        THREE,
        fighter: state.player,
        glow: (color, opacity) => new THREE.MeshBasicMaterial({ color, opacity }),
      })
    expect(figure(base).root.getObjectByName('kalluto-paper-fan')).toBeDefined()
    expect(
      figure(use(base, 'paper-kit-drop')).root.getObjectByName('kalluto-paper-fan'),
    ).toBeUndefined()
    expect(createPaperKit('native').markers).toBe(12)
  })
})
