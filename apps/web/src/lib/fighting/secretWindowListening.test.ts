import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  beginFight,
  createFight,
  performAuraAttack,
  performAttack,
  tickFight,
  nextRound,
} from './engine'
import { performArsenalAction } from './arsenalExecution'
import { performArsenalCommand, arsenalOptions } from './retrospectiveArsenal'
import { speakPaperWords } from './kallutoListening'
import { privatePvpState } from './pvp/view'
import { createSecretWindowScene } from './secretWindowScene'
import { toggleEmperorTime } from './kurapikaActions'
import { dolphinIsBusy } from './kurapikaDolphin'
import { chainAbilitySealed } from './kurapika'
import { reconcileChrolloPages } from './chrolloPageEffects'
import { EMPTY_INPUT, type FightState } from './types'

function duel(id: 'musse' | 'benjamin' | 'chrollo' = 'musse'): FightState {
  const base = beginFight(createFight(id, 'hisoka', { mode: 'versus-local', formatId: 'knockout' }))
  return {
    ...base,
    player: { ...base.player, x: 22, aura: 100 },
    opponent: { ...base.opponent, x: 48 },
  }
}
function frames(state: FightState, count: number): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function listen(state: FightState): FightState {
  return frames(
    performArsenalAction(
      { state, side: 'player', command: { action: 'window-listen' } },
      performAuraAttack,
    ),
    35,
  )
}
function syringe(state: FightState): FightState {
  return performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    moveId: 'kurapika:backSpecial',
    auraCharged: false,
  })
}

describe('Secret Window shoulder-owl eavesdropping', () => {
  it('keeps the marked-body voice distinct from ambient eavesdropping', () => {
    const base = duel()
    const touching = { ...base, player: { ...base.player, x: 42 } }
    const marked = frames(performAttack(touching, 'player', 'special'), 35)
    expect(marked.player.secretWindow).toBeDefined()
    expect(
      speakPaperWords(marked, 'player', 'Nearby but not the marked speaker.').player.secretWindow
        ?.heard,
    ).toBeUndefined()
    expect(
      speakPaperWords(marked, 'opponent', 'The marked speaker.').player.secretWindow?.heard?.text,
    ).toBe('The marked speaker.')
  })
  it.each(['musse', 'benjamin'] as const)(
    'lets %s listen without contact, images, damage or private intent',
    (id) => {
      const base = duel(id)
      expect(
        arsenalOptions(base, 'player').find((entry) => entry.command.action === 'window-listen')
          ?.ready,
      ).toBe(true)
      const heardNormally = speakPaperWords(base, 'opponent', 'Before the owl.')
      expect(heardNormally.player.heardWords).toBeUndefined()
      const active = listen(base)
      expect(active.player.secretWindow).toBeUndefined()
      expect(active.player.secretWindowListening).toBeDefined()
      expect(active.opponent.health).toBe(base.opponent.health)
      expect(active.score).toEqual(base.score)
      const spoken = speakPaperWords(active, 'opponent', {
        text: 'Only these words.',
        statementIntent: true,
      })
      expect(spoken.player.secretWindowListening?.heard).toEqual({
        frame: active.frame,
        text: 'Only these words.',
      })
      expect(spoken.player.secretWindowListening).not.toHaveProperty('pictures')
      expect(privatePvpState(spoken, 'opponent').opponent.secretWindowListening).toBeUndefined()
      const recalled = performArsenalCommand(spoken, 'player', { action: 'window-stop-listening' })
      expect(recalled.player.secretWindowListening).toBeUndefined()
    },
  )
  it('does not relay words beyond the scenario voice radius or to an unconscious mind', () => {
    const active = listen(duel())
    const distant = { ...active, opponent: { ...active.opponent, x: 90 } }
    expect(
      speakPaperWords(distant, 'opponent', 'Too far.').player.secretWindowListening?.heard,
    ).toBeUndefined()
    const asleep = {
      ...active,
      player: {
        ...active.player,
        arsenalSleep: { owner: 'player' as const, cause: 'cookie' as const },
      },
    }
    expect(
      speakPaperWords(asleep, 'opponent', 'No conscious listener.').player.secretWindowListening
        ?.heard,
    ).toBeUndefined()
    expect(performArsenalCommand(asleep, 'player', { action: 'window-stop-listening' })).toBe(
      asleep,
    )
  })
  it('runs the copied application through the actual active page and stops when the book condition ends', () => {
    const base = duel('chrollo')
    const book = { pages: ['musse', 'sun-and-moon'] as const, page: 0, open: true, bookmark: null }
    const ready = { ...base, player: { ...base.player, chrolloBook: book } }
    expect(
      arsenalOptions(ready, 'player').some(
        (entry) =>
          entry.command.action === 'copied-move' && entry.command.target === 'musse:downSpecial',
      ),
    ).toBe(true)
    const cast = performArsenalAction(
      {
        state: ready,
        side: 'player',
        command: { action: 'copied-move', target: 'musse:downSpecial' },
      },
      performAuraAttack,
    )
    expect(cast.player.attack).toMatchObject({
      moveId: 'musse:downSpecial',
      hatsuSource: 'musse',
      copiedPage: 'musse',
    })
    const active = frames(cast, 35)
    expect(active.player.secretWindowListening).toBeDefined()
    expect(active.player.id).toBe('chrollo')
    const closed = {
      ...active,
      player: { ...active.player, chrolloBook: { ...book, open: false } },
    }
    expect(
      reconcileChrolloPages(active, closed, 'player').player.secretWindowListening,
    ).toBeUndefined()
    const bookmarked = {
      ...closed,
      player: {
        ...closed.player,
        chrolloBook: { ...book, open: false, bookmark: 'musse' as const },
      },
    }
    expect(
      reconcileChrolloPages(active, bookmarked, 'player').player.secretWindowListening,
    ).toBeDefined()
  })
  it('uses real stolen aura for one listening application and retains the loan until that application ends', () => {
    const base = beginFight(
      createFight('kurapika', 'musse', { mode: 'versus-local', formatId: 'knockout' }),
    )
    const contact = {
      ...base,
      player: { ...base.player, x: 42, aura: 100 },
      opponent: { ...base.opponent, x: 47, aura: 30 },
    }
    const drained = frames(syringe(contact), 160)
    const loaded = syringe(toggleEmperorTime(drained, 'player'))
    const stock = loaded.player.kurapika!.held!.auraSupply!.amount
    const active = frames(
      performArsenalAction(
        {
          state: loaded,
          side: 'player',
          command: { action: 'dolphin-move', target: 'musse:downSpecial' },
        },
        performAuraAttack,
      ),
      35,
    )
    const held = active.player.kurapika!.held!
    expect(active.player.secretWindowListening).toBeDefined()
    expect(held.auraSupply!.amount).toBe(stock - 16)
    expect(held.sustainedKeys).toContain('secret-window')
    expect(dolphinIsBusy(active, 'player', held)).toBe(true)
    const round = nextRound({ ...active, phase: 'finished', winner: 'player' })
    expect(round.player.secretWindowListening).toEqual(active.player.secretWindowListening)
    const stopped = frames(
      performArsenalCommand(active, 'player', { action: 'window-stop-listening' }),
      1,
    )
    expect(stopped.opponent.stolenChainAbility).toBeUndefined()
    expect(stopped.player.kurapika!.held).toBeNull()
    expect(stopped.player.kurapika!.emperorTime).toBe(true)
  })
  it('treats the two birds as one Hatsu when Secret Window is stolen from Benjamin and keeps On effective', () => {
    const active = listen(duel('benjamin'))
    const sealed = {
      ...active.player,
      stolenChainAbility: { owner: 'opponent' as const, moveId: 'benjamin:forwardSpecial' },
    }
    expect(chainAbilitySealed(sealed, 'benjamin:backSpecial')).toBe(true)
    expect(frames({ ...active, player: sealed }, 1).player.secretWindowListening).toBeUndefined()
    expect(
      frames({ ...active, player: { ...active.player, on: { grudge: 0, sealFrames: 60 } } }, 1)
        .player.secretWindowListening,
    ).toBeUndefined()
    expect(
      performAttack({ ...active, player: sealed }, 'player', 'ranged').player.attack?.kind,
    ).toBe('ranged')
  })
  it('positions the distinct shoulder bird on its actual user and disposes its models', () => {
    const active = listen(duel())
    const scene = new THREE.Scene()
    const model = createSecretWindowScene({ THREE, scene, worldX: (x) => x, worldY: (y) => y })
    model.sync(active, 0)
    const owl = scene.getObjectByName('secret-window-listening-player-0')!
    expect(owl.visible).toBe(true)
    expect(owl.position.x).toBeCloseTo(active.player.x - 0.35)
    expect(scene.getObjectByName('secret-window-player')!.visible).toBe(false)
    model.dispose()
    expect(scene.children).toHaveLength(0)
  })
})
