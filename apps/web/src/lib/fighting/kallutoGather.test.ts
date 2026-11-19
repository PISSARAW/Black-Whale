import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack } from './engine'
import { launchKallutoPaper } from './kallutoFlight'
import { performArsenalCommand } from './retrospectiveArsenal'
import { storedPaperScatters } from './kallutoStoredPaper'
import { cleanPaperMaterial } from './kallutoMaterialLifetime'
import { ownedPaperScatters } from './kallutoScatter'
import { activePaperOwner } from './kallutoSurveillance'
import { privatePvpState } from './pvp/view'
import { kallutoFanStrike } from './threeCombatWounds'
import { copyHistoricalObject } from './chrolloHistoricalObjects'
import { expireHistoricalMatter } from './historicalMatterClock'
import { GALLERY_FAKE_LIFETIME } from './historicalCopyLifetime'
import { createReplayRecorder } from './fightReplayRecorder'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { decodeFightReplay } from './fightReplayCodec'
import { createReplayPlayer } from './fightReplayPlayer'
import { fightReplayHash } from './fightReplayHash'
import type { ReplayPacket } from './fightReplayTypes'
import type { FightSide, FightState } from './types'

function loose(side: FightSide): FightState {
  const state = beginFight(
    createFight(
      side === 'player' ? 'kalluto' : 'hisoka',
      side === 'opponent' ? 'kalluto' : 'hisoka',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  const launched = launchKallutoPaper(state, side, 'plant')
  const target = side === 'player' ? 'opponent' : 'player'
  return {
    ...launched,
    projectiles: [],
    [side]: { ...launched[side], paperKit: { ...launched[side].paperKit!, salvos: 0 } },
    [target]: {
      ...launched[target],
      plantedPaper: [
        {
          owner: side,
          zone: 'torso',
          paperId: launched.projectiles[0].paperId,
        },
      ],
    },
  }
}
function gather(state: FightState, side: FightSide, target?: string): FightState {
  return performArsenalCommand(state, side, {
    action: 'paper-kit-gather',
    target: target ?? ownedPaperScatters(state, activePaperOwner(state, side))[0]?.id,
  })
}
function gatherAll(state: FightState, side: FightSide): FightState {
  for (const entry of ownedPaperScatters(state, activePaperOwner(state, side)))
    state = gather(state, side, entry.id)
  return state
}

describe('actual confetti storage and reuse', () => {
  for (const side of ['player', 'opponent'] as const) {
    it(`moves the same finite matter between world, carried reserve and flight for ${side}`, () => {
      const state = loose(side)
      const original = ownedPaperScatters(state, activePaperOwner(state, side))
      const packed = gatherAll(state, side)
      const kit = packed[side].paperKit!
      expect(kit.markers).toBe(state[side].paperKit!.markers)
      expect(kit.salvos).toBe(0)
      expect(kit.sheets).toBe(state[side].paperKit!.sheets)
      expect(kit.confetti?.map((entry) => entry.id)).toEqual(original.map((entry) => entry.id))
      expect(ownedPaperScatters(packed, activePaperOwner(packed, side))).toHaveLength(0)
      expect(gather(packed, side, original[0].id)).toBe(packed)
      const fired = launchKallutoPaper(packed, side, 'serpent')
      expect(fired[side].paperKit!.confetti).toEqual([])
      expect(fired[side].paperKit!.salvos).toBe(0)
      expect(fired.projectiles.map((shot) => shot.paperScatterId)).toEqual(
        original.map((entry) => entry.id),
      )
      expect(
        ownedPaperScatters(fired, activePaperOwner(fired, side)).map((entry) => entry.id),
      ).toEqual(original.map((entry) => entry.id))
      expect(fired.projectiles.reduce((sum, shot) => sum + shot.damage, 0)).toBe(18)
    })
    it(`allows physical pickup in Zetsu but checks range, free body and the real reserve for ${side}`, () => {
      const state = loose(side)
      const zetsu = {
        ...state,
        [side]: {
          ...state[side],
          nen: { ...state[side].nen, mode: 'zetsu' as const },
        },
      }
      expect(gather(zetsu, side)).not.toBe(zetsu)
      for (const patch of [
        { x: state[side].x + 30 },
        { paperKit: undefined },
        { coveringEars: true },
        { hitStun: 30 },
      ]) {
        const blocked = { ...state, [side]: { ...state[side], ...patch } }
        expect(gather(blocked, side)).toBe(blocked)
      }
      const packed = gatherAll(zetsu, side)
      expect(launchKallutoPaper(packed, side, 'serpent')).toBe(packed)
    })
    it(`drops and retrieves the stored pieces with the same physical kit for ${side}`, () => {
      const packed = gatherAll(loose(side), side)
      const kit = packed[side].paperKit!
      const dropped = performArsenalCommand(packed, side, { action: 'paper-kit-drop' })
      expect(dropped[side].paperKit).toBeUndefined()
      expect(
        dropped.battlefield!.entities.find((entry) => entry.id === kit.sourceId)?.paperKit
          ?.confetti,
      ).toEqual(kit.confetti)
      expect(kallutoFanStrike(performAttack(packed, side, 'light')[side])).toBe(true)
      expect(kallutoFanStrike(performAttack(dropped, side, 'light')[side])).toBe(false)
      const retrieved = performArsenalCommand(dropped, side, {
        action: 'paper-kit-take',
        target: kit.sourceId,
      })
      expect(retrieved[side].paperKit?.confetti).toEqual(kit.confetti)
    })
    it(`keeps stored contents private and mirrors actual ownership for ${side}`, () => {
      const packed = gatherAll(loose(side), side)
      const own = privatePvpState(packed, side)
      expect(own.player.paperKit!.confetti).toHaveLength(3)
      expect(own.player.paperKit!.confetti![0].paperScatter!.owner.owner).toBe('player')
      const enemy = privatePvpState(packed, side === 'player' ? 'opponent' : 'player')
      expect(enemy.opponent.paperKit?.confetti).toBeUndefined()
    })
  }
  it('expires stored conjured parts when their actual copy no longer exists', () => {
    const packed = gatherAll(loose('player'), 'player')
    const original = packed.player
    const lost = {
      ...original,
      paperKit: {
        ...original.paperKit!,
        confetti: original.paperKit!.confetti!.map((entry) => ({
          ...entry,
          material: 'nen' as const,
          paperScatter: { ...entry.paperScatter!, materialCopyId: 'expired-copy' },
        })),
      },
    }
    const cleaned = cleanPaperMaterial(packed, lost)
    expect(cleaned.paperKit!.confetti).toBeUndefined()
    expect(cleaned.paperKit!.markers).toBe(original.paperKit!.markers)
    expect(storedPaperScatters({ ...packed, player: cleaned }, 'player')).toHaveLength(0)
  })
  it('replays a real pickup without duplicating its objects', () => {
    const state = loose('opponent')
    const changed = gather(state, 'opponent')
    const recorder = createReplayRecorder(state)!
    const packet: ReplayPacket = [1 / 60, 0, 0, [panelReplayCommand(state, changed)]]
    const after = executeReplayPacket(state, packet)
    recorder.append(state, packet, after)
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(after))
  })
  it('copies stored physical contents with unique identities and expires them with Gallery Fake', () => {
    const packed = gatherAll(loose('player'), 'player')
    const originalKit = packed.player.paperKit!
    const dropped = performArsenalCommand(packed, 'player', { action: 'paper-kit-drop' })
    const body = createFight('chrollo', 'kalluto').player
    const ready = {
      ...dropped,
      opponent: {
        ...body,
        x: dropped.player.x + 3,
        aura: 100,
        chrolloBook: {
          pages: ['gallery-fake' as const],
          page: 0,
          open: false,
          bookmark: 'gallery-fake' as const,
        },
      },
    }
    const copied = copyHistoricalObject(ready, 'opponent', originalKit.sourceId)
    const replica = copied.battlefield!.entities.find((entry) => entry.copy)!
    expect(replica).toBeDefined()
    const parts = replica.paperKit!.confetti!
    expect(parts).toHaveLength(3)
    const originals = new Set(originalKit.confetti!.map((entry) => entry.id))
    expect(parts.every((entry) => !originals.has(entry.id))).toBe(true)
    expect(parts.every((entry) => entry.material === 'nen')).toBe(true)
    expect(parts.every((entry) => entry.paperScatter!.materialCopyId === replica.id)).toBe(true)
    const expired = expireHistoricalMatter({
      ...copied,
      frame: copied.frame + GALLERY_FAKE_LIFETIME,
    })
    expect(
      expired.battlefield!.entities.find((entry) => entry.id === replica.id)?.paperKit?.confetti,
    ).toBeUndefined()
    expect(
      expired.battlefield!.entities.find((entry) => entry.id === originalKit.sourceId)?.paperKit
        ?.confetti,
    ).toEqual(originalKit.confetti)
  })
})
