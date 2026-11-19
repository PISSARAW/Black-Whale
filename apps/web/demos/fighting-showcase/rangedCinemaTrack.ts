import type { FightSide, FightState } from '../../src/lib/fighting/types'
import { createCinematicTrack } from './cinematicCamera'

export interface RangedCinemaShot {
  kind: 'wide' | 'face' | 'floor' | 'punch' | 'barrage' | 'hands'
  side: FightSide
  targetX?: number
  age: number
}
export function createRangedCinemaTrack(states: FightState[]) {
  const base = createCinematicTrack(states)
  let shot: RangedCinemaShot = { kind: 'wide', side: 'player', age: 0 }
  let heldUntil = 0
  const shots = states.map((s, index) => {
    const punch = s.projectiles.find(
      (p) => p.remotePunch && p.age >= p.remotePunch.travelFrames - 3,
    )
    const fire = s.opponent.attack
    const incoming = s.impact && s.impact.sequence !== states[index - 1]?.impact?.sequence
    const combo =
      s.player.attack?.kind === 'light' ||
      s.player.attack?.kind === 'heavy' ||
      s.opponent.attack?.kind === 'light' ||
      s.opponent.attack?.kind === 'heavy'
    let wanted: RangedCinemaShot['kind'] = 'wide'
    let side: FightSide = 'player'
    if (punch) {
      wanted = 'punch'
      side = 'opponent'
    } else if (fire && ['ranged', 'special'].includes(fire.kind)) {
      wanted = fire.frame < 12 ? 'face' : fire.frame < 32 ? 'hands' : 'barrage'
      side = 'opponent'
    } else if (s.player.attack?.kind === 'special') wanted = 'floor'
    else if (incoming && s.impact!.comboHits >= 2) {
      wanted = 'face'
      side = s.impact!.attacker
    }
    if (combo && !(incoming && s.impact!.comboHits >= 2)) wanted = 'wide'
    if (wanted !== 'wide' || index >= heldUntil) {
      const changed = wanted !== shot.kind || side !== shot.side
      shot = {
        kind: wanted,
        side,
        age: changed ? 0 : shot.age + 1,
        targetX: punch?.remotePunch?.targetX,
      }
      if (changed) heldUntil = index + (wanted === 'face' ? 18 : 8)
    } else shot = { ...shot, age: shot.age + 1 }
    return { ...shot }
  })
  return {
    shots,
    wide: base.frames,
    report: {
      fullScreen: true,
      insetCount: 0,
      cuts: shots.flatMap((s, i) =>
        i === 0 || s.kind !== shots[i - 1].kind || s.side !== shots[i - 1].side
          ? [{ second: i / 60, ...s }]
          : [],
      ),
      kinds: Object.fromEntries(
        ['wide', 'face', 'floor', 'punch', 'barrage', 'hands'].map((kind) => [
          kind,
          shots.filter((s) => s.kind === kind).length / 60,
        ]),
      ),
      camera: base.report,
    },
  }
}
