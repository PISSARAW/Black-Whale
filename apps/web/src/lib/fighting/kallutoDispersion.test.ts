import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { launchKallutoPaper } from './kallutoFlight'
import { paperCommandReady } from './kallutoPaper'
import { ownedPaperScatters } from './kallutoScatter'
import { activePaperOwner } from './kallutoSurveillance'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import { applyAuraContext } from './nen'

function ready(side: FightSide): FightState {
  return beginFight(
    createFight(
      side === 'player' ? 'kalluto' : 'hisoka',
      side === 'opponent' ? 'kalluto' : 'hisoka',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
}
function markedAirborne(side: FightSide): FightState {
  const emitted = launchKallutoPaper(ready(side), side, 'plant')
  const target = side === 'player' ? 'opponent' : 'player'
  return {
    ...emitted,
    battlefield: { ...emitted.battlefield!, entities: [] },
    [side]: { ...emitted[side], paperKit: { ...emitted[side].paperKit!, salvos: 0 } },
    [target]: { ...emitted[target], plantedPaper: [{ owner: side, zone: 'torso' }] },
  }
}

describe('finite paper dispersion and airborne reuse', () => {
  for (const side of ['player', 'opponent'] as const) {
    it(`divides one actual packet into identified paths with one total damage budget for ${side}`, () => {
      const state = ready(side)
      const emitted = launchKallutoPaper(state, side, 'plant')
      const paper = ownedPaperScatters(emitted, activePaperOwner(emitted, side))
      expect(emitted[side].paperKit!.markers).toBe(state[side].paperKit!.markers - 1)
      expect(emitted[side].paperKit!.serial).toBe(state[side].paperKit!.serial + 1)
      expect(emitted.projectiles).toHaveLength(3)
      expect(new Set(emitted.projectiles.map((shot) => shot.paperId)).size).toBe(3)
      expect(new Set(paper.map((entry) => entry.paperScatter!.paperId)).size).toBe(3)
      expect(emitted.projectiles.reduce((sum, shot) => sum + shot.damage, 0)).toBeCloseTo(4)
      expect(paper.reduce((sum, entry) => sum + entry.health, 0)).toBeCloseTo(5)
    })
    it(`reuses airborne material even with no ground confetti or fresh salvo left for ${side}`, () => {
      const state = markedAirborne(side)
      const other: FightSide = side === 'player' ? 'opponent' : 'player'
      const foreign = { ...state.projectiles[0], id: 900, owner: other }
      const source = { ...state, projectiles: [...state.projectiles, foreign] }
      expect(paperCommandReady(source, side, 'serpent')).toBe(true)
      const gathered = launchKallutoPaper(source, side, 'serpent')
      const own = gathered.projectiles.filter((shot) => shot.owner === side)
      expect(own.map((shot) => [shot.id, shot.paperId, shot.x, shot.y])).toEqual(
        state.projectiles.map((shot) => [shot.id, shot.paperId, shot.x, shot.y]),
      )
      expect(own.reduce((sum, shot) => sum + shot.damage, 0)).toBe(18)
      expect(gathered.projectiles.at(-1)).toBe(foreign)
      expect(gathered.nextProjectileId).toBe(source.nextProjectileId)
      expect(gathered[side].paperKit).toBe(source[side].paperKit)
      expect(gathered.battlefield!.entities).toHaveLength(0)
    })
    it(`revalidates the real mark, fan, hand and Nen before redirecting for ${side}`, () => {
      const state = markedAirborne(side)
      const target = side === 'player' ? 'opponent' : 'player'
      const unmarked = { ...state, [target]: { ...state[target], plantedPaper: [] } }
      expect(launchKallutoPaper(unmarked, side, 'serpent')).toBe(unmarked)
      for (const patch of [
        { paperKit: { ...state[side].paperKit!, fan: false } },
        { weaponsConfiscated: true },
        { coveringEars: true },
        { nen: { ...state[side].nen, mode: 'zetsu' as const } },
        { on: { grudge: 0, sealFrames: 60 } },
      ]) {
        const blocked = { ...state, [side]: { ...state[side], ...patch } }
        expect(launchKallutoPaper(blocked, side, 'serpent')).toBe(blocked)
      }
      const sworn = {
        ...state,
        [side]: applyAuraContext(
          {
            ...state[side],
            on: { grudge: 100, sealFrames: 0 },
          },
          { ...EMPTY_INPUT, aura: true, hatsu: true },
        ),
      }
      expect(sworn[side].nen.on).toBe(true)
      expect(launchKallutoPaper(sworn, side, 'serpent')).toBe(sworn)
    })
  }
})
