import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { CHROLLO_BOOKMARK, CHROLLO_SECONDARY, CHROLLO_TURN, CHROLLO_USE } from './chrolloBook'
import { triggerHatsu } from './hatsu'
import { performHunterInterview } from './skillHunterAcquisition'
import { performArsenalCommand } from './retrospectiveArsenal'
import { createChrolloAnimationClock } from './chrolloAnimation'
import { createSunMoonVictoryWitness } from './chrolloDetonation'
import { createVictoryPlayback } from './victory/playback'
import { createCinematicDirector } from './cinematicDirector'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'

function duel(target: FighterId = 'illumi'): FightState {
  const s = beginFight(
    createFight('chrollo', target, { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...s,
    player: { ...s.player, x: 44, aura: 100 },
    opponent: { ...s.opponent, x: 49, aura: 100 },
  }
}
function action(state: FightState, moveId: string) {
  return performAuraAttack({ state, side: 'player', kind: 'special', moveId, auraCharged: false })
}
function advance(state: FightState, n: number, observe: (state: FightState) => unknown = () => {}) {
  for (let i = 0; i < n; i++) {
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    observe(state)
  }
  return state
}
function sunMoon(
  lethal: boolean,
  observe: (state: FightState) => unknown,
  target: FighterId = 'illumi',
) {
  let s = duel(target)
  observe(s)
  s = advance(action(s, CHROLLO_USE), 50, observe)
  expect(s.opponent.hatsuEffects.sunMark).toBe(1)
  s = advance(action(s, CHROLLO_BOOKMARK), 20, observe)
  if (lethal) s = { ...s, opponent: { ...s.opponent, health: 20 } }
  observe(s)
  return advance(action(s, CHROLLO_SECONDARY), 25, observe)
}
describe('Chrollo animations follow executable effects', () => {
  it('accents page handling for 18 simulation frames, without a camera inset', () => {
    const clock = createChrolloAnimationClock(),
      camera = createCinematicDirector()
    const s = duel()
    clock(s)
    camera.update(s)
    const turned = action(s, CHROLLO_TURN)
    expect(clock(turned).player.page).toBe(0)
    expect(camera.update(turned).detail).toBeNull()
    expect(clock({ ...turned, frame: 17 }).player.page).toBe(17)
    expect(clock({ ...turned, frame: 18 }).player.page).toBeNull()
    expect(clock(s).player.page).toBeNull()
  })
  it('distinguishes an actual theft from history-page selection and failed palm contact', () => {
    const clock = createChrolloAnimationClock(),
      camera = createCinematicDirector()
    const s = duel()
    clock(s)
    camera.update(s)
    const selected = performArsenalCommand(s, 'player', {
      action: 'history-page',
      target: 'gallery-fake',
    })
    expect(clock(selected).player.acquired).toBeNull()
    expect(camera.update(selected).detail).toBeNull()
    let ready = triggerHatsu(s, 'opponent', 'illumi')
    ready = performHunterInterview(ready, 'player', { action: 'hunter-ask' })
    ready = performHunterInterview(ready, 'opponent', { action: 'hunter-answer' })
    clock(ready)
    camera.update(ready)
    const far = { ...ready, opponent: { ...ready.opponent, x: 80 } }
    expect(
      clock(performHunterInterview(far, 'opponent', { action: 'hunter-palm' })).player.acquired,
    ).toBeNull()
    const acquired = performHunterInterview(ready, 'opponent', { action: 'hunter-palm' })
    expect(acquired.opponent.skillHunterStolen?.length).toBe(1)
    expect(clock(acquired).player.acquired).toBe(0)
    expect(camera.update(acquired).detail?.eventId).toBe('chrollo.steal')
    expect(clock({ ...acquired, frame: 83 }).player.acquired).toBe(83)
    expect(clock({ ...acquired, frame: 84 }).player.acquired).toBeNull()
    // A rig or scene rebuilt while the effect is already present does not replay acquisition.
    expect(createChrolloAnimationClock()(acquired).player.acquired).toBeNull()
  })
  it('shows an ordinary Sun/Moon detonation once, without starting a victory movie', () => {
    const clock = createChrolloAnimationClock(),
      witness = createSunMoonVictoryWitness()
    let blasts = 0,
      decisive = false
    const end = sunMoon(false, (s) => {
      if (clock(s).player.detonation === 0) blasts++
      decisive ||= witness(s)
    })
    expect(blasts).toBe(1)
    expect(end.opponent.hatsuEffects.sunMark).toBe(0)
    expect(end.opponent.health).toBeGreaterThan(0)
    expect(decisive).toBe(false)
  })
  it('selects the three-second decisive insert only after a confirmed lethal route, and supports pause/skip', () => {
    const playback = createVictoryPlayback()
    const end = sunMoon(true, (s) => playback.observe(s))
    expect(end).toMatchObject({ phase: 'finished', winner: 'player', finishReason: 'knockout' })
    expect(get(playback)).toMatchObject({ variant: 'chrollo-sun-moon', duration: 3, active: true })
    playback.observe(end)
    playback.advance(1)
    expect(get(playback)?.elapsed).toBe(0)
    playback.sceneReady()
    playback.advance(1, true)
    expect(get(playback)?.elapsed).toBe(0)
    playback.advance(2.9)
    expect(get(playback)?.active).toBe(true)
    playback.advance(0.2)
    expect(get(playback)).toMatchObject({ elapsed: 3, active: false })
    playback.observe(end)
    expect(get(playback)?.active).toBe(false)
    playback.observe(duel())
    sunMoon(true, (s) => playback.observe(s))
    playback.skip()
    expect(get(playback)).toMatchObject({ elapsed: 3, active: false })
  })
  it('does not infer a detonation from a finished save or a provisional post-mortem death', () => {
    const end = sunMoon(true, () => {})
    expect(createSunMoonVictoryWitness()(end)).toBe(false)
    const playback = createVictoryPlayback()
    playback.observe(end)
    expect(get(playback)?.variant).not.toBe('chrollo-sun-moon')
    const witness = createSunMoonVictoryWitness()
    sunMoon(true, (s) => expect(witness({ ...s, forecastSimulation: true })).toBe(false))
    expect(witness(duel())).toBe(false)
  })
  it('waits for Camilla’s post-mortem verdict instead of playing Chrollo’s decisive insert', () => {
    const witness = createSunMoonVictoryWitness(),
      playback = createVictoryPlayback()
    let provisional = false
    const end = sunMoon(
      true,
      (s) => {
        provisional ||= Boolean(s.catsName)
        expect(witness(s)).toBe(false)
        playback.observe(s)
        expect(get(playback)?.variant).not.toBe('chrollo-sun-moon')
      },
      'camilla',
    )
    expect(provisional).toBe(true)
    const verdict = advance(end, 130, (s) => playback.observe(s))
    expect(verdict.winner).toBe('opponent')
    expect(get(playback)?.fighter).toBe('camilla')
  })
})
