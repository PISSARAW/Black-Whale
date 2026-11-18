import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack } from './engine'
import { advanceKallutoPaper } from './kallutoFrames'
import { launchKallutoPaper, travelKallutoPaper } from './kallutoFlight'
import { attackData } from './frameData'
import { resolveFightImpacts } from './combatImpact'
import { paperAvailable } from './kallutoPaper'
import type { FightState } from './types'

function ready(): FightState {
  const s = beginFight(
    createFight('kalluto', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return { ...s, player: { ...s.player, x: 30, aura: 100 }, opponent: { ...s.opponent, x: 48 } }
}
function scatter(): FightState {
  const s = performAuraAttack({
    state: ready(),
    side: 'player',
    kind: 'special',
    moveId: 'kalluto:neutralSpecial',
    auraCharged: false,
  })
  return advanceKallutoPaper({
    ...s,
    player: {
      ...s.player,
      attack: { ...s.player.attack!, frame: attackData('special', s.player).startup },
    },
  })
}
function cut(s: FightState): FightState {
  const launched = launchKallutoPaper(s, 'player', 'serpent')
  const shot = launched.projectiles.at(-1)!
  return resolveFightImpacts(launched, [
    { projectile: shot, defenderSide: 'opponent', position: { x: s.opponent.x, y: shot.y } },
  ])
}

describe('Kalluto: chapter 226 applications', () => {
  it('fans real confetti along three distinct paths for one paid preparation', () => {
    const s = scatter()
    expect(s.projectiles).toHaveLength(3)
    expect(new Set(s.projectiles.map((p) => p.id)).size).toBe(3)
    expect(s.player.aura).toBe(84)
    expect(s.projectiles.every((p) => p.matter === 'object' && p.kallutoPaper === 'plant')).toBe(
      true,
    )
    const positions = s.projectiles.map((p) => travelKallutoPaper(s, p, 1 / 60).y)
    expect(positions[0]).toBeLessThan(positions[1])
    expect(positions[2]).toBeGreaterThan(positions[1])
    expect(advanceKallutoPaper(s).projectiles).toHaveLength(3)
  })
  it('does not track an unmarked person with the initial dispersion', () => {
    const s = scatter(),
      shot = s.projectiles[0]
    const moved = { ...s, opponent: { ...s.opponent, x: 80, y: 24 } }
    expect(travelKallutoPaper(s, shot, 1 / 60)).toEqual(travelKallutoPaper(moved, shot, 1 / 60))
  })
  it('regathers its own flying paper at its actual positions and divides one stream’s damage', () => {
    const s = scatter()
    const loose = s.projectiles.map((p, index) => ({ ...p, x: 39 + index, y: 3 + index }))
    const otherPaper = { ...loose[0], id: 500, owner: 'opponent' as const }
    const marked = {
      ...s,
      projectiles: [...loose, otherPaper],
      opponent: {
        ...s.opponent,
        plantedPaper: [{ owner: 'player' as const, zone: 'hands' as const }],
      },
      player: { ...s.player, kallutoPaper: { zone: 'hands' as const } },
    }
    const gathered = launchKallutoPaper(marked, 'player', 'serpent')
    const streams = gathered.projectiles.filter((p) => p.owner === 'player')
    expect(streams.map((p) => [p.x, p.y])).toEqual(loose.map((p) => [p.x, p.y]))
    expect(streams.reduce((sum, p) => sum + p.damage, 0)).toBe(18)
    expect(streams.every((p) => p.targetZone === 'hands' && p.kallutoPaper === 'serpent')).toBe(
      true,
    )
    expect(gathered.projectiles).toContainEqual(otherPaper)
    expect(gathered.opponent.plantedPaper).toEqual(marked.opponent.plantedPaper)
  })
  it('keeps released confetti physical when Zetsu interrupts its manipulation', () => {
    const s = scatter(),
      shot = travelKallutoPaper(s, s.projectiles[0], 1 / 60)
    const paused = {
      ...s,
      player: { ...s.player, nen: { ...s.player.nen, mode: 'zetsu' as const } },
    }
    const next = travelKallutoPaper(paused, shot, 1 / 60)
    expect(next.y).toBe(shot.y)
    expect(next.x).toBeGreaterThan(shot.x)
    expect(next.matter).toBe('object')
  })
  it('records real cuts, but none through a guard or avoidance', () => {
    expect(cut(ready()).opponent.openWounds).toBe(1)
    for (const defence of [{ blocking: true, guardFrames: 20 }, { wakeupInvulnerableFrames: 10 }]) {
      const s = ready()
      expect(
        cut({ ...s, opponent: { ...s.opponent, ...defence } }).opponent.openWounds,
      ).toBeUndefined()
    }
  })
  it('uses the fan’s edge on actual melee contact and respects confiscation', () => {
    const s = ready()
    for (const confiscated of [false, true]) {
      let hit = performAuraAttack({
        state: {
          ...s,
          player: { ...s.player, weaponsConfiscated: confiscated },
          opponent: { ...s.opponent, x: 35 },
        },
        side: 'player',
        kind: 'light',
        auraCharged: false,
      })
      hit = {
        ...hit,
        player: {
          ...hit.player,
          attack: { ...hit.player.attack!, frame: attackData('light', hit.player).startup },
        },
      }
      const after = resolveFightImpacts(hit, [])
      expect(after.opponent.health).toBeLessThan(s.opponent.health)
      expect(after.opponent.openWounds ?? 0).toBe(confiscated ? 0 : 1)
      expect(paperAvailable(hit.player)).toBe(!confiscated)
    }
  })
})
