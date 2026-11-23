import type { Shot } from '../fighting-chrollo-intro/reel'
import type { FightInput, FightSide } from '../../src/lib/fighting/types'

/**
 * A free exchange: both fighters close in, strike, guard and step out on their own, with a
 * seeded choice every few frames. Only physical blows: their Hatsu stay for the big moments.
 */
export function brawl(s: Shot, options: { frames: number; seed: number }) {
  let seed = options.seed * 7919 + 17
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  const hp = () => Math.min(s.state.player.health, s.state.opponent.health)
  const hold: Record<FightSide, Partial<FightInput>> = { player: {}, opponent: {} }
  for (let frame = 0; frame < options.frames && s.state.phase === 'fighting'; frame++) {
    // Nobody falls in an exchange: the fight must still be there for its last Ko.
    if (hp() < 80) break
    if (frame % 9 === 0) hold.player = decide(s, { side: 'player', rand })
    if (frame % 9 === 4) hold.opponent = decide(s, { side: 'opponent', rand })
    s.step(1, hold.player, hold.opponent)
  }
}

function decide(s: Shot, ctx: { side: FightSide; rand: () => number }): Partial<FightInput> {
  const { side, rand } = ctx
  const foe: FightSide = side === 'player' ? 'opponent' : 'player'
  const me = s.state[side]
  const gap = Math.abs(me.x - s.state[foe].x)
  const toward = me.x < s.state[foe].x ? 'right' : 'left'
  const away = toward === 'right' ? 'left' : 'right'
  const r = rand()
  if (gap > 9) return r < 0.85 ? { [toward]: true } : {}
  if (s.state[foe].attack && r < 0.5) return { guard: true }
  if (r < 0.14) return { [away]: true }
  if (!me.attack && !me.hitStun) {
    if (r < 0.55) s.press('light', {}, side)
    else if (r < 0.74) s.press('heavy', {}, side)
    else if (r < 0.87) s.press('light', { down: true }, side)
    else s.press('light', { [toward]: true }, side)
  }
  return {}
}
