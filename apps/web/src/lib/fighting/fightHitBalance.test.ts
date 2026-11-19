import { expect, it } from 'vitest'
import { createFightState } from './fightState'
import { performAuraAttack, tickFight } from './engine'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { createFightReactionPresentation } from './fightReactionPresentation'
import { physicalHitPose, type PhysicalHit } from './fightHitResponse'
import { EMPTY_INPUT, type FighterId } from './types'
import { fightReplayHash } from './fightReplayHash'

function twoContacts(id: FighterId) {
  let state = createFightState(id, 'mizaistom', { mode: 'versus-local', formatId: 'knockout' })
  state = {
    ...state,
    phase: 'fighting',
    player: { ...state.player, x: 44 },
    opponent: { ...state.opponent, x: 50 },
  }
  const observe = createFightReactionPresentation()
  const hits: PhysicalHit[] = []
  const light = moveForSlot(id, 'standingLight')!,
    heavy = moveForSlot(id, 'standingHeavy')!
  state = performAuraAttack({
    state,
    side: 'player',
    kind: light.kind,
    moveId: light.id,
    auraCharged: false,
  })
  let second = false
  for (let n = 0; n < 100 && hits.length < 2; n++) {
    if (hits.length === 1 && !second && canStartFighterAttack(state.player, heavy.kind, heavy.id)) {
      state = performAuraAttack({
        state,
        side: 'player',
        kind: heavy.kind,
        moveId: heavy.id,
        auraCharged: false,
      })
      second = true
    }
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    const hash = fightReplayHash(state)
    const hit = observe(state, 'opponent', {
      fighter: state.opponent,
      seconds: state.frame / 60,
    }).physicalHit
    if (hit && hits.at(-1)?.sequence !== hit.sequence) hits.push(hit)
    expect(fightReplayHash(state)).toBe(hash)
  }
  return hits
}

it.each(['feitan', 'biscuit', 'illumi', 'benjamin', 'leorio', 'kalluto'] as const)(
  '%s retains balance through a native two-hit combo',
  (id) => {
    const hits = twoContacts(id)
    expect(hits).toHaveLength(2)
    expect(hits[0].carry).toBeUndefined()
    expect(
      Object.values(hits[1].carry!)
        .flat()
        .some((x) => Math.abs(x) > 0.001),
    ).toBe(true)
    const pose = physicalHitPose(hits[1], 0)
    expect(pose).not.toEqual(physicalHitPose({ ...hits[1], carry: undefined }, 0))
    expect(physicalHitPose(hits[1], 1)).toEqual(physicalHitPose({ ...hits[1], carry: {} }, 1))
  },
)

it('separates head snap, abdominal compression and loss of leg support', () => {
  const hit = twoContacts('feitan')[0]
  const head = physicalHitPose({ ...hit, zone: 'head' }, 0.3)
  const belly = physicalHitPose({ ...hit, zone: 'torso' }, 0.3)
  const leg = physicalHitPose({ ...hit, zone: 'feet' }, 0.3)
  expect(head.head![0]).toBeLessThan(belly.head![0])
  expect(belly.chest![0]).toBeGreaterThan(head.chest![0])
  expect(leg.leadKnee![0]).toBeGreaterThan(belly.leadKnee![0])
  expect(leg.body![2]).toBeGreaterThan(head.body![2])
})
