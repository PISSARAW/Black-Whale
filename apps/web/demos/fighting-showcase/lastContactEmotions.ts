import type { FightSide, FightState } from '../../src/lib/fighting/types'

export type LastContactEmotion =
  'focus' | 'smirk' | 'delight' | 'pain' | 'surprise' | 'strain' | 'fury' | 'satisfaction'
export interface LastContactFace {
  emotion: LastContactEmotion
  eye: number
  brow: number
  lift: number
  pupil: number
  width: number
  curve: number
  open: number
  teeth: number
  asymmetry: number
}
export type LastContactFaces = Record<FightSide, LastContactFace>
const POSES: Record<LastContactEmotion, Omit<LastContactFace, 'emotion'>> = {
  focus: {
    eye: 0.63,
    brow: 0.2,
    lift: -0.01,
    pupil: 0.9,
    width: 0.052,
    curve: -0.001,
    open: 0.001,
    teeth: 0,
    asymmetry: 0,
  },
  smirk: {
    eye: 0.7,
    brow: 0.1,
    lift: -0.005,
    pupil: 1,
    width: 0.083,
    curve: 0.008,
    open: 0.002,
    teeth: 0,
    asymmetry: 0.007,
  },
  delight: {
    eye: 0.88,
    brow: -0.08,
    lift: 0.002,
    pupil: 1.06,
    width: 0.104,
    curve: 0.014,
    open: 0.014,
    teeth: 0.75,
    asymmetry: 0.004,
  },
  pain: {
    eye: 0.34,
    brow: -0.23,
    lift: -0.008,
    pupil: 0.9,
    width: 0.073,
    curve: -0.006,
    open: 0.009,
    teeth: 0.95,
    asymmetry: 0.003,
  },
  surprise: {
    eye: 1.15,
    brow: -0.12,
    lift: 0.01,
    pupil: 0.7,
    width: 0.04,
    curve: 0,
    open: 0.028,
    teeth: 0,
    asymmetry: 0,
  },
  strain: {
    eye: 0.53,
    brow: 0.24,
    lift: -0.012,
    pupil: 0.9,
    width: 0.067,
    curve: -0.005,
    open: 0.01,
    teeth: 0.85,
    asymmetry: -0.002,
  },
  fury: {
    eye: 0.67,
    brow: 0.32,
    lift: -0.012,
    pupil: 0.82,
    width: 0.1,
    curve: -0.004,
    open: 0.038,
    teeth: 0.4,
    asymmetry: 0,
  },
  satisfaction: {
    eye: 0.57,
    brow: 0.06,
    lift: -0.007,
    pupil: 0.95,
    width: 0.065,
    curve: 0.006,
    open: 0.001,
    teeth: 0,
    asymmetry: 0.003,
  },
}
function intent(context: {
  state: FightState
  side: FightSide
  age: number
  successAge: number
}): LastContactEmotion {
  const { state, side, age, successAge } = context
  const f = state[side]
  if (state.phase === 'finished') return side === 'opponent' ? 'satisfaction' : 'pain'
  if (f.nen.on) return 'fury'
  if (age < 9) return 'surprise'
  if (age < 55) return 'pain'
  if (f.auraExhausted || f.health / f.maxHealth < 0.17) return 'strain'
  if (f.blocking) return 'focus'
  if (successAge < 75) return side === 'player' ? 'delight' : 'smirk'
  return side === 'player' ? 'smirk' : 'focus'
}
function blend(previous: LastContactFace, emotion: LastContactEmotion): LastContactFace {
  const result = { emotion, ...POSES[emotion] }
  for (const key of Object.keys(POSES[emotion]) as Array<keyof typeof POSES.focus>)
    result[key] = previous[key] + (result[key] - previous[key]) * 0.2
  return result
}

/** Faces follow real contacts and resources. Native fight timing stays unchanged. */
export function createLastContactEmotions(states: FightState[]) {
  const hit = { player: -999, opponent: -999 },
    success = { player: -999, opponent: -999 }
  let previous: LastContactFaces = {
    player: { emotion: 'smirk', ...POSES.smirk },
    opponent: { emotion: 'focus', ...POSES.focus },
  }
  const frames = states.map((state, index) => {
    const impact = state.impact
    if (
      impact &&
      impact.sequence !== states[index - 1]?.impact?.sequence &&
      !impact.blocked &&
      impact.damage > 0 &&
      !impact.avoided
    ) {
      hit[impact.attacker === 'player' ? 'opponent' : 'player'] = index
      if (impact.comboHits >= 2) success[impact.attacker] = index
    }
    const frame = {} as LastContactFaces
    for (const side of ['player', 'opponent'] as const) {
      const emotion = intent({
        state,
        side,
        age: index - hit[side],
        successAge: index - success[side],
      })
      frame[side] = blend(previous[side], emotion)
      // A deterministic short blink, with clear eyes through hits and offensive confirms.
      const blink = (index + (side === 'player' ? 47 : 133)) % 257
      if (blink < 7 && index - hit[side] > 100 && index - success[side] > 100)
        frame[side].eye *= 1 - 0.88 * Math.sin((blink / 7) * Math.PI)
      if (emotion === 'strain') frame[side].open += 0.002 * Math.sin(index * 0.1)
    }
    previous = frame
    return frame
  })
  const kinds = [...new Set(frames.flatMap((f) => [f.player.emotion, f.opponent.emotion]))]
  return {
    frames,
    report: {
      source: 'Native impacts, combo confirms, Nen resources and outcome',
      kinds,
      transitions: frames.flatMap((f, i) =>
        (['player', 'opponent'] as const).flatMap((side) =>
          i === 0 || f[side].emotion !== frames[i - 1][side].emotion
            ? [{ second: i / 60, side, emotion: f[side].emotion }]
            : [],
        ),
      ),
    },
  }
}
