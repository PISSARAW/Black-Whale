import { makeChapter, makeFilm, type Chapter } from './film'
import { createCinematicDirector } from '../../src/lib/fighting/cinematicDirector'
import type { CameraDetail, CinematicDirection } from '../../src/lib/fighting/cinematicTypes'
import type { ArcadeFighter, FightState, FighterId } from '../../src/lib/fighting/types'

export interface LongFrame {
  cursor: number
  speed: number
  detail: CameraDetail | null
}
export interface LongChapter extends Omit<Chapter, 'frames'> {
  frames: LongFrame[]
  shots: { id: string; seconds: number; kind: string }[]
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t
function fighter(a: ArcadeFighter, b: ArcadeFighter, t: number): ArcadeFighter {
  const attack =
    a.attack && b.attack && a.attack.moveId === b.attack.moveId && b.attack.frame >= a.attack.frame
      ? { ...a.attack, frame: mix(a.attack.frame, b.attack.frame, t) }
      : a.attack
  return {
    ...a,
    // A portal is a discrete relocation, never a slide through the space between its doors.
    x: Math.abs(b.x - a.x) > 12 ? a.x : mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    attack,
    hitStun: mix(a.hitStun, b.hitStun, t),
    knockdownFrames: mix(a.knockdownFrames, b.knockdownFrames, t),
    wakeupInvulnerableFrames: mix(a.wakeupInvulnerableFrames, b.wakeupInvulnerableFrames, t),
  }
}
/** Interpolate presentation coordinates only; every discrete result remains an engine snapshot. */
export function sampleLong(chapter: LongChapter, index: number) {
  const frame = chapter.frames[index]
  const i = Math.min(chapter.states.length - 1, Math.floor(frame.cursor))
  const a = chapter.states[i],
    b = chapter.states[Math.min(i + 1, chapter.states.length - 1)]
  const t = frame.cursor - i
  const state: FightState = {
    ...a,
    player: fighter(a.player, b.player, t),
    opponent: fighter(a.opponent, b.opponent, t),
    projectiles: a.projectiles.map((p) => {
      const next = b.projectiles.find((n) => n.id === p.id)
      return next
        ? { ...p, x: mix(p.x, next.x, t), y: mix(p.y, next.y, t), age: mix(p.age, next.age, t) }
        : p
    }),
    catsName:
      a.catsName && b.catsName
        ? { ...a.catsName, frame: mix(a.catsName.frame, b.catsName.frame, t) }
        : a.catsName,
  }
  const direction: CinematicDirection = {
    detail: frame.detail,
    side: frame.detail?.sourceSide ?? frame.detail?.side ?? null,
    strength: frame.detail ? 0.75 : 0,
  }
  const command = [...chapter.commands].reverse().find((c) => c.frame <= i)
  return { state, direction, seconds: frame.cursor / 60, speed: frame.speed, command }
}

function extend(chapter: Chapter): LongChapter {
  const director = createCinematicDirector({ pacing: 'compact' })
  director.update(chapter.states[0])
  const samples = chapter.states.map((s) => director.update(s, 1, 1 / 60).detail)
  // Treat a machine-gun volley as one continuous impact shot rather than a cut per bullet.
  const key = (detail: CameraDetail | null, i: number) => {
    if (!detail) return ''
    if (detail.kind !== 'impact') return detail.eventId ?? detail.labelFr
    const side = detail.sourceSide ?? 'player'
    const command = chapter.commands
      .filter((c) => c.accepted && c.slot.startsWith(side) && c.frame <= i)
      .at(-1)
    return `impact:${side}:${command?.frame ?? 0}`
  }
  const spans: Array<{ start: number; end: number; detail: CameraDetail | null; key: string }> = []
  samples.forEach((detail, i) => {
    const id = key(detail, i),
      last = spans.at(-1)
    if (last?.key === id) last.end = i + 1
    else spans.push({ start: i, end: i + 1, detail, key: id })
  })
  const frames: LongFrame[] = []
  const shots: LongChapter['shots'] = []
  for (const span of spans) {
    const ticks = span.end - span.start
    // Every included action advances in both views. No freeze-frame, replay or resource reset.
    const minimum = span.detail
      ? ['body', 'eyes', 'armour', 'sun'].includes(span.detail.kind)
        ? 3.8
        : 3
      : 0
    const count = Math.max(Math.ceil(ticks / 2), Math.ceil(minimum * 30))
    const speed = ticks / 60 / (count / 30)
    for (let n = 0; n < count; n++)
      frames.push({ cursor: span.start + (ticks * n) / count, speed, detail: span.detail })
    if (span.detail)
      shots.push({
        id: span.detail.eventId ?? span.key,
        kind: span.detail.kind,
        seconds: count / 30,
      })
  }
  return { ...chapter, frames, shots }
}
export const makeLongChapter = (id: FighterId) => extend(makeChapter(id, true))
export const makeLongFilm = () => makeFilm(true).map(extend)
export function longAudioStates(chapter: LongChapter) {
  return chapter.frames.flatMap((_frame, index) => {
    const s = sampleLong(chapter, index).state
    return [s, s]
  })
}
