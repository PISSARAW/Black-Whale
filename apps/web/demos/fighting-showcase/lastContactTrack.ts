import type { FightSide, FightState } from '../../src/lib/fighting/types'
import { createCinematicTrack } from './cinematicCamera'

export interface LastContactShot {
  kind: 'wide' | 'face' | 'book' | 'hands'
  side: FightSide
  age: number
}
const physical = (s: FightState) =>
  [s.player, s.opponent].some((f) => f.attack && ['light', 'heavy'].includes(f.attack.kind))
export function createLastContactTrack(states: FightState[]) {
  const base = createCinematicTrack(states)
  const koFrame = states.findIndex((s) => s.phase === 'finished')
  let held = 0
  let reaction = { frame: -999, side: 'player' as FightSide }
  let shot: LastContactShot = { kind: 'wide', side: 'player', age: 0 }
  const shots = states.map((s, i) => {
    const before = states[i - 1]
    const changedPage = before && s.opponent.chrolloBook?.page !== before.opponent.chrolloBook?.page
    const texture = !before?.player.textureSurprise && s.player.textureSurprise
    const oath = !before?.player.nen.on && s.player.nen.on
    const hit = s.impact?.sequence !== before?.impact?.sequence && s.impact
    const finish = koFrame >= 0 && i >= koFrame + 48
    if (hit && !hit.blocked && hit.comboHits >= 3)
      reaction = { frame: i, side: hit.attacker === 'player' ? 'opponent' : 'player' }
    let wanted: LastContactShot['kind'] = 'wide'
    let side: FightSide = 'opponent'
    if (finish) wanted = 'face'
    else if (changedPage) wanted = 'book'
    else if (texture) {
      wanted = 'hands'
      side = 'player'
    } else if (oath) {
      wanted = 'face'
      side = 'player'
    } else if (
      !physical(s) &&
      i - reaction.frame > 8 &&
      i - reaction.frame < 46 &&
      s[reaction.side].y === 0
    ) {
      wanted = 'face'
      side = reaction.side
    } else if (i % 270 === 0 && !physical(s)) {
      wanted = 'face'
      side = i % 540 ? 'player' : 'opponent'
    }
    if (physical(s)) held = 0
    if (wanted !== 'wide') {
      shot = { kind: wanted, side, age: 0 }
      held = wanted === 'book' ? 24 : 32
    } else if (held > 0) {
      held--
      shot = { ...shot, age: shot.age + 1 }
    } else shot = { kind: 'wide', side: 'player', age: 0 }
    return { ...shot }
  })
  const cuts = shots.flatMap((s, i) =>
    i === 0 || s.kind !== shots[i - 1].kind || s.side !== shots[i - 1].side
      ? [{ second: i / 60, ...s }]
      : [],
  )
  return {
    shots,
    wide: base.frames,
    report: {
      fullScreen: true,
      insetCount: 0,
      cuts,
      kinds: Object.fromEntries(
        ['wide', 'face', 'book', 'hands'].map((kind) => [
          kind,
          shots.filter((s) => s.kind === kind).length / 60,
        ]),
      ),
      camera: base.report,
    },
  }
}
