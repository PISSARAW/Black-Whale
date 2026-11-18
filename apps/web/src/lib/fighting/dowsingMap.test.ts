import { describe, expect, it } from 'vitest'
import { needleCommand } from './illumiNeedleFaceTestSetup'
import { mapSetup, mapFrames, searchBodyKey } from './dowsingMapTestSetup'
import { DOWSING_MAP_FRAMES } from './dowsingMapTypes'
import { arsenalOptions } from './retrospectiveArsenal'
import { applyAuraContext } from './nen'
import { nextRound } from './engine'
import { privatePvpState } from './pvp/view'
import { EMPTY_INPUT, type FightSide } from './types'

describe('Dowsing searches a physical map for the encountered body', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'uses the actual map and ordinary Nen for %s, with a dated single reading',
    (side) => {
      const base = mapSetup(side)
      const other = side === 'player' ? 'opponent' : 'player'
      const command = { action: 'dowsing-locate' as const, target: searchBodyKey(base, side) }
      expect(base[side].kurapika?.emperorTime).toBe(false)
      expect(
        arsenalOptions(base, side).find((option) => option.command.action === 'dowsing-locate')
          ?.ready,
      ).toBe(true)
      const started = needleCommand(base, command, side)
      expect(started[side].aura).toBe(base[side].aura - 3)
      expect(started[side].dowsingMapSearch).toMatchObject({
        mapId: `${side}:arena-map`,
        phase: 'searching',
      })
      expect(mapFrames(started, DOWSING_MAP_FRAMES - 1)[side].dowsingMapReading).toBeUndefined()
      const moved = { ...started, [other]: { ...started[other], x: side === 'player' ? 80 : 20 } }
      const read = mapFrames(moved)
      expect(read[side].dowsingMapSearch?.phase).toBe('reading')
      const reading = read[side].dowsingMapReading!
      expect(reading.bodyKey).toBe(command.target)
      expect(reading.point?.x).toBeCloseTo(((side === 'player' ? 80 : 20) - 7) / 86)
      expect(reading.point?.y).toBe(0)
      expect(read[side].health).toBe(base[side].health)
      const later = mapFrames({ ...read, [other]: { ...read[other], x: 50 } }, 10)
      expect(later[side].dowsingMapReading).toEqual(reading)
      const next = nextRound({ ...later, phase: 'finished', winner: side })
      expect(next[side].dowsingMapReading).toEqual(reading)
      expect(next[side].dowsingMapSearch).toBeUndefined()
    },
  )
  it('requires represented paper and an actual known body rather than a fighter name or an invisible intent', () => {
    const base = mapSetup()
    expect(needleCommand(base, { action: 'dowsing-locate', target: 'hisoka' })).toBe(base)
    const missing = {
      ...base,
      battlefield: {
        ...base.battlefield!,
        entities: base.battlefield!.entities.filter((entry) => !entry.document?.arenaMap),
      },
    }
    expect(needleCommand(missing, { action: 'dowsing-locate', target: searchBodyKey(base) })).toBe(
      missing,
    )
    const unknown = { ...base, player: { ...base.player, personalEncounters: undefined } }
    expect(needleCommand(unknown, { action: 'dowsing-locate', target: 'opponent:0' })).toBe(unknown)
  })
  it('cancels focus on damage or lost access, without fabricating a location or refunding aura', () => {
    const base = mapSetup()
    const started = needleCommand(base, { action: 'dowsing-locate', target: searchBodyKey(base) })
    const interrupted = mapFrames({ ...started, player: { ...started.player, hitStun: 10 } }, 1)
    expect(interrupted.player.dowsingMapSearch).toBeUndefined()
    expect(interrupted.player.dowsingMapReading).toBeUndefined()
    const far = mapFrames({ ...started, player: { ...started.player, x: 10 } }, 1)
    expect(far.player.dowsingMapSearch).toBeUndefined()
    expect(needleCommand(started, { action: 'dowsing-locate', target: searchBodyKey(base) })).toBe(
      started,
    )
  })
  it('keeps a location private and leaves only the visible pendulum pose to the other client', () => {
    const base = mapSetup()
    const read = mapFrames(
      needleCommand(base, { action: 'dowsing-locate', target: searchBodyKey(base) }),
    )
    const enemy = privatePvpState(read, 'opponent').opponent
    expect(enemy.dowsingMapSearch).toBeUndefined()
    expect(enemy.dowsingMapReading).toBeUndefined()
    expect(enemy.dowsingMapPose?.mapId).toBe('player:arena-map')
    expect(enemy.dowsingMapPose).not.toHaveProperty('bodyKey')
  })
  it('keeps On, stops the Nen, and preserves the real paper', () => {
    const base = mapSetup()
    const active = needleCommand(base, { action: 'dowsing-locate', target: searchBodyKey(base) })
    const on = {
      ...active,
      player: applyAuraContext(
        { ...active.player, on: { grudge: 100, sealFrames: 0 } },
        { ...EMPTY_INPUT, aura: true, hatsu: true },
      ),
    }
    const stopped = mapFrames(on, 1)
    expect(stopped.player.nen.on).toBe(true)
    expect(stopped.player.dowsingMapSearch).toBeUndefined()
    expect(
      stopped.battlefield!.entities.find((entry) => entry.id === 'player:arena-map')?.present,
    ).toBe(true)
    expect(needleCommand(stopped, { action: 'dowsing-locate', target: searchBodyKey(base) })).toBe(
      stopped,
    )
  })
  it('does not invent a position beyond the area printed on the map', () => {
    const base = mapSetup()
    const started = needleCommand(base, { action: 'dowsing-locate', target: searchBodyKey(base) })
    const cropped = {
      ...started,
      battlefield: {
        ...started.battlefield!,
        entities: started.battlefield!.entities.map((entry) =>
          entry.id === 'player:arena-map'
            ? {
                ...entry,
                document: {
                  ...entry.document!,
                  arenaMap: { ...entry.document!.arenaMap!, right: 60 },
                },
              }
            : entry,
        ),
      },
    }
    const outside = mapFrames({ ...cropped, opponent: { ...cropped.opponent, x: 80 } })
    expect(outside.player.dowsingMapReading).toBeTruthy()
    expect(outside.player.dowsingMapReading?.point).toBeUndefined()
  })
})
