import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, nextRound, performAttack, performMove } from './engine'
import { createTeamFight, requestTeamAssist } from './teamMatch'
import { musseHatsu } from './hatsu/musse'
import { benjaminHatsu } from './hatsu/benjamin'
import { attackData } from './frameData'
import { createSecretWindowScene } from './secretWindowScene'
import { secretWindowNenActive, secretWindowVisibleTo } from './secretWindow'
import { speakPaperWords } from './kallutoListening'
import { privatePvpState } from './pvp/view'
import { performArsenalCommand } from './retrospectiveArsenal'
import { createKurapika } from './kurapika'
import { captureDolphinAura } from './dolphinAura'
import { EMPTY_INPUT, type FightState } from './types'

function contact(state: FightState): FightState {
  let cast =
    state.player.id === 'benjamin'
      ? performMove({
          state,
          side: 'player',
          action: 'special',
          input: { ...EMPTY_INPUT, right: true },
        })
      : performAttack(state, 'player', 'special')
  expect(cast.player.attack).not.toBeNull()
  cast = {
    ...cast,
    player: {
      ...cast.player,
      attack: {
        ...cast.player.attack!,
        frame: attackData('special', cast.player).startup,
      },
    },
  }
  return state.player.id === 'benjamin' ? benjaminHatsu.onFrame(cast) : musseHatsu.onFrame(cast)
}
function duel(id: 'musse' | 'benjamin' = 'musse'): FightState {
  const base = beginFight(createFight(id, 'hisoka', { mode: 'versus-local', formatId: 'knockout' }))
  return {
    ...base,
    player: { ...base.player, x: 42, aura: 100 },
    opponent: { ...base.opponent, x: 48 },
  }
}

describe('Secret Window follows actual bodies and private recipients', () => {
  it('keeps the original marked body when an opponent relays, including the owl model', () => {
    const team = beginFight(
      createTeamFight({
        player: ['musse', 'theta', 'biscuit'],
        opponent: ['hisoka', 'chrollo', 'benjamin'],
      }),
    )
    const marked = contact({
      ...team,
      player: { ...team.player, x: 42 },
      opponent: { ...team.opponent, x: 48 },
    })
    expect(marked.player.secretWindow?.targetMember).toBe(0)
    const relayed = requestTeamAssist(
      {
        ...marked,
        opponent: { ...marked.opponent, x: 93, attack: null, pose: 'walk' },
      },
      'opponent',
      1,
    )
    expect(relayed.teamMatch!.seats.opponent.active).toBe(1)
    const next = musseHatsu.onFrame({
      ...relayed,
      frame: 90,
      opponent: { ...relayed.opponent, pose: 'special' },
    })
    expect(next.player.secretWindow?.observation).toEqual({
      frame: 90,
      action: 'walk',
    })
    const scene = new THREE.Scene()
    const model = createSecretWindowScene({
      THREE,
      scene,
      worldX: (x) => x,
      worldY: (y) => y,
    })
    model.sync(next, 0)
    expect(scene.getObjectByName('secret-window-player')!.position.x).toBeCloseTo(92.8)
    model.dispose()
    expect(scene.children).toHaveLength(0)
  })
  it('keeps receiving for the actual owner waiting at the gate', () => {
    const team = beginFight(
      createTeamFight({
        player: ['musse', 'theta', 'biscuit'],
        opponent: ['hisoka', 'chrollo', 'benjamin'],
      }),
    )
    const marked = contact({
      ...team,
      player: { ...team.player, x: 42 },
      opponent: { ...team.opponent, x: 48 },
    })
    const relayed = requestTeamAssist(
      { ...marked, player: { ...marked.player, x: 7, attack: null } },
      'player',
      1,
    )
    expect(relayed.teamMatch!.seats.player.active).toBe(1)
    const next = musseHatsu.onFrame({
      ...relayed,
      frame: 100,
      opponent: { ...relayed.opponent, pose: 'guard' },
    })
    expect(next.player.secretWindow).toBeUndefined()
    expect(next.teamMatch!.seats.player.members[0].secretWindow?.observation).toEqual({
      frame: 100,
      action: 'guard',
    })
    expect(
      privatePvpState(next, 'opponent').teamMatch!.seats.opponent.members[0].secretWindow,
    ).toBeUndefined()
  })
  it('gives Benjamin the real live private feed through touch, even on a guarding body', () => {
    const base = duel('benjamin')
    const marked = contact({
      ...base,
      opponent: { ...base.opponent, blocking: true },
    })
    expect(marked.player.hatsuEffects.baton?.markedTarget).toBe('opponent')
    expect(marked.player.secretWindow?.targetMember).toBe(0)
    const next = musseHatsu.onFrame({
      ...marked,
      frame: 80,
      opponent: { ...marked.opponent, pose: 'walk' },
    })
    expect(next.player.secretWindow?.observation.action).toBe('walk')
    expect(secretWindowVisibleTo(next, 'player', 'player')).toBe(true)
    expect(secretWindowVisibleTo(next, 'player', 'opponent')).toBe(false)
    expect(privatePvpState(next, 'opponent').opponent.hatsuEffects.baton?.markedTarget).toBeNull()
    const stopped = musseHatsu.onFrame({
      ...next,
      player: { ...next.player, on: { grudge: 0, sealFrames: 60 } },
    })
    expect(stopped.player.hatsuEffects.baton?.markedTarget).toBeNull()
    expect(stopped.player.secretWindow).toBeUndefined()
    expect(next.opponent.health).toBe(base.opponent.health)
  })
  it('relays actual speech near the bird through distance without relaying private intent', () => {
    const marked = contact(duel('benjamin'))
    const remote = {
      ...marked,
      player: { ...marked.player, x: 1, attack: null },
    }
    const spoken = speakPaperWords(remote, 'opponent', {
      text: 'I am here.',
      statementIntent: true,
    })
    expect(spoken.player.secretWindow?.heard).toEqual({
      frame: remote.frame,
      text: 'I am here.',
    })
    expect(privatePvpState(spoken, 'opponent').opponent.secretWindow).toBeUndefined()
    const asleep = {
      ...remote,
      player: {
        ...remote.player,
        arsenalSleep: { owner: 'player' as const, cause: 'cookie' as const },
      },
    }
    expect(
      speakPaperWords(asleep, 'opponent', 'Still here.').player.secretWindow?.heard,
    ).toBeUndefined()
  })
  it('uses an equipped Dolphin supply independently of the recipient’s own aura and personal Hatsu', () => {
    const marked = contact(duel())
    const carrier = {
      ...marked.player,
      id: 'kurapika' as const,
      aura: 0,
      nen: { ...marked.player.nen, mode: 'zetsu' as const },
      hatsuEffects: { ...marked.player.hatsuEffects, hatsuStolen: 1 },
      kurapika: {
        ...createKurapika(),
        emperorTime: true,
        held: {
          source: 'musse' as const,
          victim: 'opponent' as const,
          moveId: 'musse:neutralSpecial',
          loaded: true,
          used: true,
          sustainedKeys: ['secret-window'],
          auraSupply: {
            ...captureDolphinAura(marked.player),
            amount: 0,
            committed: 16,
          },
        },
      },
    }
    expect(secretWindowNenActive(carrier)).toBe(true)
    expect(secretWindowNenActive({ ...carrier, on: { grudge: 0, sealFrames: 30 } })).toBe(false)
    const state = { ...marked, player: carrier }
    const recalled = performArsenalCommand(state, 'player', {
      action: 'window-recall',
    })
    expect(recalled.player.secretWindow).toBeUndefined()
    expect(recalled.player.aura).toBe(0)
    expect(recalled.player.nen.mode).toBe('zetsu')
    const round = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(round.player.secretWindow).toEqual(state.player.secretWindow)
    expect(round.player.kurapika?.held?.returned).not.toBe(true)
  })
  it('does not reconstruct an authoritative private observation from a redacted client body', () => {
    const marked = contact(duel())
    const view = privatePvpState(marked, 'player')
    const next = musseHatsu.onFrame({
      ...view,
      opponent: { ...view.opponent, pose: 'special' },
    })
    expect(next.player.secretWindow?.observation).toEqual(view.player.secretWindow!.observation)
  })
})
