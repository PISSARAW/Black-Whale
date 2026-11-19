import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack, tickFight, nextRound } from './engine'
import { createTeamFight, requestTeamAssist } from './teamMatch'
import { teamAssistBlock } from './teams/availability'
import { paperDolls, activePaperOwner, paperMarksAt, makePaperDoll } from './kallutoSurveillance'
import { capturePaperDollSpeech, paperOwnerListening } from './kallutoSpeech'
import { paperListening, speakPaperWords } from './kallutoListening'
import { hasPlantedPaper } from './kallutoPaper'
import { privatePvpState } from './pvp/view'
import { buildFightFigure, fightFigureKey } from './fighterFigure'
import { performArsenalCommand } from './retrospectiveArsenal'
import { createChrolloBook, addChrolloPage } from './chrolloBook'
import { EMPTY_INPUT, type FightState } from './types'

function advance(state: FightState, count = 80): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function cast(state: FightState, slot: string): FightState {
  return advance(
    performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: `kalluto:${slot}`,
      auraCharged: false,
    }),
  )
}
function ready(state: FightState): FightState {
  return {
    ...state,
    player: { ...state.player, x: 30, aura: 100 },
    opponent: { ...state.opponent, x: 48 },
  }
}
function markedPair(): FightState {
  const initial = ready(
    beginFight(
      createTeamFight({
        player: ['kalluto', 'theta', 'biscuit'],
        opponent: ['hisoka', 'chrollo', 'benjamin'],
      }),
    ),
  )
  const first = cast(cast(initial, 'neutralSpecial'), 'backSpecial')
  expect(first.opponent.plantedPaper?.[0].ownerMember).toBe(0)
  const atGate = { ...first, opponent: { ...first.opponent, x: 93 } }
  expect(teamAssistBlock(atGate, 'opponent', 1)).toBeNull()
  const relayed = requestTeamAssist(atGate, 'opponent', 1)
  expect(relayed.teamMatch!.seats.opponent.active).toBe(1)
  expect(relayed.teamMatch!.seats.opponent.members[0].on).toEqual(first.opponent.on)
  const second = cast(cast(ready(relayed), 'neutralSpecial'), 'backSpecial')
  expect(paperDolls(second.player)).toHaveLength(2)
  return second
}

describe('Kalluto’s multiple paper receivers bind actual bodies (chapter 225)', () => {
  it('keeps the first marked body through a real relay and adds a second distinct receiver without replacing it', () => {
    const pair = markedPair()
    expect(paperDolls(pair.player).map((doll) => doll.targetMember)).toEqual([0, 1])
    expect(
      paperMarksAt(pair, {
        owner: activePaperOwner(pair, 'player'),
        target: { owner: 'opponent', member: 0 },
      }),
    ).toBe(true)
    expect(hasPlantedPaper(pair, 'player')).toBe(true)
    const spoken = speakPaperWords(pair, 'opponent', 'Paroles près du deuxième papier.')
    expect(paperDolls(spoken.player)[0].heard).toBeUndefined()
    expect(paperDolls(spoken.player)[1].heard?.text).toBe('Paroles près du deuxième papier.')
    const nearFirst = { ...spoken, player: { ...spoken.player, x: 93 } }
    const heard = speakPaperWords(nearFirst, 'player', 'Paroles près du premier papier.')
    expect(paperDolls(heard.player)[0].heard?.text).toBe('Paroles près du premier papier.')
    expect(paperDolls(heard.player)[1].heard?.text).toBe('Paroles près du deuxième papier.')
    const repeated = makePaperDoll(heard, 'player')
    expect(paperDolls(repeated)).toHaveLength(2)
    expect(paperDolls(repeated)[1].heard?.text).toBe('Paroles près du deuxième papier.')
  })
  it('keeps the caster’s receivers and private hearing in reserve instead of handing them to the replacement', () => {
    const pair = markedPair()
    const relayed = requestTeamAssist({ ...pair, player: { ...pair.player, x: 7 } }, 'player', 1)
    expect(relayed.teamMatch!.seats.player.active).toBe(1)
    expect(relayed.player.kallutoPaper).toBeUndefined()
    expect(paperListening(relayed, 'player')).toBe(false)
    expect(paperOwnerListening(relayed, { owner: 'player', member: 0 })).toBe(true)
    const spoken = speakPaperWords(relayed, 'opponent', 'Message pour le véritable Kalluto.')
    expect(spoken.player.kallutoPaper).toBeUndefined()
    expect(paperDolls(spoken.teamMatch!.seats.player.members[0])[1].heard?.text).toBe(
      'Message pour le véritable Kalluto.',
    )
    const view = privatePvpState(spoken, 'opponent')
    expect(paperDolls(view.teamMatch!.seats.opponent.members[0]).every((doll) => !doll.heard)).toBe(
      true,
    )
  })
  it('cannot use another member’s mark, invent voice from a private snapshot, or hear while sealed by On', () => {
    const state = markedPair()
    expect(
      paperMarksAt(state, {
        owner: { owner: 'player', member: 1 },
        target: { owner: 'opponent', member: 0 },
      }),
    ).toBe(false)
    const sealed = { ...state, player: { ...state.player, on: { grudge: 0, sealFrames: 60 } } }
    expect(paperListening(sealed, 'player')).toBe(false)
    expect(
      paperDolls(speakPaperWords(sealed, 'opponent', 'Non reçu.').player).every(
        (doll) => !doll.heard,
      ),
    ).toBe(true)
    const view = privatePvpState(state, 'player')
    expect(
      capturePaperDollSpeech(view, { side: 'opponent', text: 'Fausse reconstruction privée.' }),
    ).toBe(view)
  })
  it('allows a passive grudge to stay with its body while active On and an On seal still block relay', () => {
    const base = beginFight(
      createTeamFight({
        player: ['kalluto', 'theta', 'biscuit'],
        opponent: ['hisoka', 'chrollo', 'benjamin'],
      }),
    )
    const passive = { ...base, player: { ...base.player, x: 7, on: { grudge: 80, sealFrames: 0 } } }
    expect(teamAssistBlock(passive, 'player', 1)).toBeNull()
    const relay = requestTeamAssist(passive, 'player', 1)
    expect(relay.teamMatch!.seats.player.members[0].on?.grudge).toBe(80)
    expect(relay.player.on?.grudge ?? 0).toBe(0)
    const active = {
      ...passive,
      player: { ...passive.player, nen: { ...passive.player.nen, on: true } },
    }
    expect(teamAssistBlock(active, 'player', 1)).toBe('commitment')
    const sealed = { ...passive, player: { ...passive.player, on: { grudge: 80, sealFrames: 30 } } }
    expect(teamAssistBlock(sealed, 'player', 1)).toBe('commitment')
  })
  it('stops listening without erasing physical dolls, markings or received words, and requires an admissible new activation', () => {
    const spoken = speakPaperWords(markedPair(), 'opponent', 'Souvenir entendu.')
    const stopped = performArsenalCommand(spoken, 'player', { action: 'paper-stop-listening' })
    expect(paperListening(stopped, 'player')).toBe(false)
    expect(paperDolls(stopped.player)).toHaveLength(2)
    expect(paperDolls(stopped.player).every((doll) => doll.active === false)).toBe(true)
    expect(stopped.opponent.plantedPaper).toEqual(spoken.opponent.plantedPaper)
    expect(paperDolls(stopped.player)[1].heard?.text).toBe('Souvenir entendu.')
    expect(
      paperDolls(speakPaperWords(stopped, 'opponent', 'Non transmis.').player)[1].heard?.text,
    ).toBe('Souvenir entendu.')
    const restarted = cast(stopped, 'backSpecial')
    expect(paperDolls(restarted.player)).toHaveLength(2)
    expect(paperDolls(restarted.player)[0].active).toBe(false)
    expect(paperDolls(restarted.player)[1].active).toBe(true)
  })
  it('retains real paper across rounds and mutes all copied receivers when their page closes', () => {
    const pair = markedPair()
    const duel = ready(beginFight(createFight('kalluto', 'hisoka', { mode: 'versus-local' })))
    const bound = cast(cast(duel, 'neutralSpecial'), 'backSpecial')
    const round = beginFight(nextRound({ ...bound, phase: 'finished', winner: 'player' }))
    expect(round.opponent.plantedPaper).toEqual(bound.opponent.plantedPaper)
    expect(paperDolls(round.player)).toEqual(paperDolls(bound.player))
    expect(paperListening(round, 'player')).toBe(true)
    const copied = {
      ...pair,
      player: {
        ...createFight('chrollo', 'hisoka').player,
        x: pair.player.x,
        aura: 100,
        kallutoPaper: pair.player.kallutoPaper,
        chrolloBook: {
          ...addChrolloPage(createChrolloBook(), 'kalluto'),
          pages: ['kalluto' as const, 'sun-and-moon' as const],
          page: 0,
          open: true,
          bookmark: null,
        },
      },
    }
    const muted = performAuraAttack({
      state: copied,
      side: 'player',
      kind: 'special',
      moveId: 'chrollo:backSpecial',
      auraCharged: false,
    })
    expect(paperDolls(muted.player)).toHaveLength(2)
    expect(paperDolls(muted.player).every((doll) => doll.active === false)).toBe(true)
  })
  it('renders separate physical dolls without rebuilding them for every received word', () => {
    const pair = markedPair()
    const model = buildFightFigure({
      THREE,
      fighter: pair.player,
      glow: (color, opacity) => new THREE.MeshBasicMaterial({ color, opacity }),
    })
    expect(model.root.getObjectByName('kalluto-listening-doll')).toBeDefined()
    expect(model.root.getObjectByName('kalluto-listening-doll:1')).toBeDefined()
    const spoken = speakPaperWords(pair, 'opponent', 'Une nouvelle parole.')
    expect(fightFigureKey(spoken.player)).toBe(fightFigureKey(pair.player))
    const visible = privatePvpState(spoken, 'opponent')
    expect(paperDolls(visible.opponent).every((doll) => !doll.heard)).toBe(true)
    expect(visible.opponent.kallutoPaper?.doll?.heard).toBeUndefined()
  })
})
