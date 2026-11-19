import { describe, expect, it } from 'vitest'
import { nextRound } from './engine'
import { needleFaceSetup, needleCommand, needleFrames } from './illumiNeedleFaceTestSetup'
import { reconcileIllumiFaces } from './illumiDisguiseClock'
import { createKurapika } from './kurapika'
import { captureDolphinAura } from './dolphinAura'
import { applyAuraContext } from './nen'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import { GALLERY_FAKE_LIFETIME } from './historicalCopyLifetime'
import { expireHistoricalMatter } from './historicalMatterClock'
import { privatePvpState } from './pvp/view'

function pinned(side: FightSide = 'player'): FightState {
  return needleFrames(needleCommand(needleFaceSetup(side), { action: 'illumi-face-apply' }, side))
}
function book(): FightState {
  const base = needleFaceSetup()
  const state: FightState = {
    ...base,
    player: {
      ...base.player,
      id: 'chrollo',
      chrolloBook: { pages: ['illumi:backSpecial'], page: 0, open: true, bookmark: null },
    },
  }
  return needleFrames(needleCommand(state, { action: 'copied-move', target: 'illumi:backSpecial' }))
}

describe('Gittarackur’s physical needle assembly is independent of its Nen appearance', () => {
  it('does not materialize pins for the unpinned form or an interrupted preparation', () => {
    const base = needleFaceSetup()
    const selected = needleCommand(base, { action: 'illumi-face-mode', target: 'unpinned-hisoka' })
    expect(
      needleFrames(needleCommand(selected, { action: 'illumi-face-apply' })).player
        .illumiDisguisePins,
    ).toBeUndefined()
    const started = needleCommand(base, { action: 'illumi-face-apply' })
    const interrupted = needleFrames({ ...started, player: { ...started.player, x: 60 } })
    expect(interrupted.player.illumiDisguisePins).toBeUndefined()
    expect(interrupted.battlefield!.entities.some((entry) => entry.disguisePinBundle)).toBe(false)
  })
  it.each<FightSide>(['player', 'opponent'])(
    'removes the same assembly once for %s, without recharging or healing',
    (side) => {
      const state = pinned(side)
      const pins = state[side].illumiDisguisePins!
      expect(pins.id).toContain(`disguise-pins:${side}:0:`)
      const removed = needleCommand(state, { action: 'illumi-face-remove' }, side)
      expect(removed[side].illumiDisguisePins).toBeUndefined()
      expect(removed[side].illumi?.disguised).toBe(false)
      expect(removed[side].aura).toBe(state[side].aura)
      expect(removed[side].health).toBe(state[side].health)
      expect(
        removed.battlefield!.entities.find((entry) => entry.disguisePinBundle)?.disguisePinBundle,
      ).toEqual(pins)
      expect(needleCommand(removed, { action: 'illumi-face-remove' }, side)).toBe(removed)
    },
  )
  it('keeps real metal when a copied face ends, and permits removal without access to Illumi’s Hatsu', () => {
    let state = book()
    const pins = state.player.illumiDisguisePins
    state = reconcileIllumiFaces({
      ...state,
      player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, open: false } },
    })
    expect(state.player.illumi?.disguised).toBe(false)
    expect(state.player.illumiDisguisePins).toEqual(pins)
    state = { ...state, player: { ...state.player, id: 'theta' } }
    expect(
      needleCommand(state, { action: 'illumi-face-remove' }).player.illumiDisguisePins,
    ).toBeUndefined()
    expect(needleCommand(state, { action: 'illumi-face-apply' })).toBe(state)
  })
  it('keeps material after a finite loan is dismissed and does not spend or restart another loan to unpin', () => {
    const base = needleFaceSetup()
    let state: FightState = {
      ...base,
      player: {
        ...base.player,
        id: 'theta',
        dolphinLoan: {
          lender: { owner: 'opponent', member: 0 },
          held: {
            source: 'illumi',
            moveId: 'illumi:backSpecial',
            victim: 'opponent',
            theftId: 'pins-loan',
            used: false,
            loaded: true,
            sustainedKeys: [],
            auraSupply: { ...captureDolphinAura(base.player), amount: 60 },
          },
        },
      },
      opponent: {
        ...base.opponent,
        id: 'kurapika',
        kurapika: {
          ...createKurapika(),
          emperorTime: true,
          dolphinLoans: [{ owner: 'player', member: 0 }],
        },
      },
    }
    state = needleFrames(
      needleCommand(state, { action: 'dolphin-move', target: 'illumi:backSpecial' }),
    )
    const pins = state.player.illumiDisguisePins!
    expect(pins).toBeTruthy()
    state = needleCommand(state, { action: 'dolphin-use' })
    expect(state.player.illumi?.disguised).toBe(false)
    expect(state.player.illumiDisguisePins).toEqual(pins)
    const removed = needleCommand(state, { action: 'illumi-face-remove' })
    expect(removed.player.illumiDisguisePins).toBeUndefined()
    expect(removed.player.dolphinLoan).toEqual(state.player.dolphinLoan)
  })
  it('keeps the actual native assembly through On, round changes and P2’s local view', () => {
    const state = pinned('opponent')
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(next.opponent.illumiDisguisePins).toEqual(state.opponent.illumiDisguisePins)
    const local = privatePvpState(state, 'opponent')
    expect(local.player.illumiDisguisePins?.id).toBe(state.opponent.illumiDisguisePins?.id)
    const on = {
      ...state,
      opponent: applyAuraContext(
        { ...state.opponent, on: { grudge: 100, sealFrames: 0 } },
        { ...EMPTY_INPUT, aura: true, hatsu: true },
      ),
    }
    const removed = needleCommand(on, { action: 'illumi-face-remove' }, 'opponent')
    expect(removed.opponent.nen.on).toBe(true)
    expect(removed.opponent.illumiDisguisePins).toBeUndefined()
  })
  it('expires an implanted copied assembly at its parent deadline even during hitstop', () => {
    const state = pinned()
    const id = 'disguise-gallery-parent'
    const copied: FightState = {
      ...state,
      frame: GALLERY_FAKE_LIFETIME - 1,
      hitstop: 10,
      player: {
        ...state.player,
        illumiDisguisePins: { ...state.player.illumiDisguisePins!, mediumCopyId: id },
        illumi: { ...state.player.illumi!, mediumCopyId: id },
      },
      battlefield: {
        ...state.battlefield!,
        entities: [
          ...state.battlefield!.entities,
          {
            id,
            kind: 'needles',
            owner: 'player',
            x: 44,
            y: 0,
            present: false,
            health: 3,
            material: 'nen',
            copy: {
              owner: 'player',
              originalId: 'pins-original',
              createdAt: 0,
              headAttached: true,
            },
            arena: { width: 1, height: 1, sun: 'player' },
          },
        ],
      },
    }
    const expired = expireHistoricalMatter({
      ...copied,
      frame: GALLERY_FAKE_LIFETIME,
      battlefield: {
        ...copied.battlefield!,
        entities: copied.battlefield!.entities.map((entry) =>
          entry.id === id ? { ...entry, health: 0, arena: undefined } : entry,
        ),
      },
    })
    expect(expired.player.illumiDisguisePins).toBeUndefined()
    expect(expired.player.illumi?.disguised).toBe(false)
    expect(expired.battlefield!.entities.some((entry) => entry.disguisePinBundle)).toBe(false)
  })
})
