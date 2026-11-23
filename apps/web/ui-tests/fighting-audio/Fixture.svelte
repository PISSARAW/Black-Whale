<script lang="ts">
  import { onMount, tick } from 'svelte'
  import FightJukebox from '$lib/components/fighting/FightJukebox.svelte'
  import FightMenuMusic from '$lib/components/fighting/FightMenuMusic.svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import {
    beginFight,
    createFight,
    performAttack,
    performAuraAttack,
    tickFight,
  } from '$lib/fighting/engine'
  import { CHROLLO_BOOKMARK, CHROLLO_SECONDARY, CHROLLO_USE } from '$lib/fighting/chrolloBook'
  import { resolveFightOutcome } from '$lib/fighting/fightOutcome'
  import { attackData } from '$lib/fighting/frameData'
  import { FIXED_STEP } from '$lib/fighting/fightClock'
  import { withKameos } from '$lib/fighting/kameos/state'
  import { fightSoundEvents } from '$lib/fighting/audio/events'
  import { EMPTY_INPUT, type FightInput, type FightState } from '$lib/fighting/types'

  const noop = () => {}
  const stageId = 'screening-room'
  function duel(arenaInteractions = false) {
    const ready = createFight('kurapika', 'chrollo', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { stageId, arenaInteractions },
    })
    const started = beginFight(withKameos(ready, { player: 'luzurus' }))
    return {
      ...started,
      player: { ...started.player, x: 49, facing: -1 as const, aura: 100 },
      opponent: { ...started.opponent, x: 44, facing: 1 as const, aura: 100 },
    }
  }

  let state = duel()
  let language: 'fr' | 'en' = 'fr'
  let paused = false
  let showingMenu = false
  let victoryActive = false
  let audioSeek = 0
  let events: string[] = []
  async function publish(next: FightState) {
    events.push(...fightSoundEvents(state, next).map(({ kind }) => kind))
    state = next
    await tick()
  }
  async function advance(frames: number, player: FightInput = EMPTY_INPUT) {
    for (let frame = 0; frame < frames; frame++) {
      await publish(tickFight(state, player, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT }))
    }
  }
  async function reset() {
    audioSeek++
    state = duel()
    events = []
    await tick()
  }
  async function kameo(frames = 720) {
    await advance(1, { ...EMPTY_INPUT, kameo: true })
    await advance(frames)
    return events
  }
  async function opening(guard: 'none' | 'early' | 'late') {
    if (guard === 'early') await advance(18, { ...EMPTY_INPUT, guard: true })
    await publish(performAttack(state, 'opponent', 'light'))
    await advance(16, { ...EMPTY_INPUT, guard: guard !== 'none' })
    return state.impact
  }
  async function burst() {
    await publish(performAttack(state, 'opponent', 'light'))
    for (let frame = 0; !state.impact && frame < 15; frame++) await advance(1)
    await advance(10, { ...EMPTY_INPUT, burst: true })
    return state.burst
  }
  async function punishAt30Hz() {
    const started = performAttack(performAttack(state, 'opponent', 'light'), 'player', 'light')
    const ourAttack = attackData('light', started.player)
    const theirAttack = attackData('light', started.opponent)
    await publish({
      ...started,
      player: {
        ...started.player,
        attack: { ...started.player.attack!, frame: ourAttack.startup - 1 },
      },
      opponent: {
        ...started.opponent,
        attack: { ...started.opponent.attack!, frame: theirAttack.startup + theirAttack.active },
      },
    })
    await publish(tickFight(state, EMPTY_INPUT, { dt: 2 * FIXED_STEP, opponentInput: EMPTY_INPUT }))
    return state.impact
  }
  async function footwork() {
    await advance(1, { ...EMPTY_INPUT, kameo: true })
    await advance(28, { ...EMPTY_INPUT, right: true })
    await advance(14, { ...EMPTY_INPUT, jump: true })
    await advance(64)
    await advance(1, { ...EMPTY_INPUT, left: true })
    await advance(1)
    await advance(12, { ...EMPTY_INPUT, left: true })
    return events
  }
  async function strike(kind: 'light' | 'heavy') {
    await publish(performAttack(state, 'player', kind))
    await advance(32)
    return state.impact
  }
  async function projectile(intercept: boolean) {
    const start = duel(intercept)
    await publish({
      ...start,
      player: { ...start.player, x: 54 },
      opponent: { ...start.opponent, x: 22 },
    })
    await publish(performAttack(state, 'opponent', 'ranged'))
    await advance(70)
    return { events, impact: state.impact, interceptions: state.audioInterceptions }
  }
  async function special(moveId: string) {
    await publish(
      performAuraAttack({
        state,
        side: 'opponent',
        kind: 'special',
        moveId,
        auraCharged: false,
      }),
    )
  }
  async function sunMoon() {
    await special(CHROLLO_USE)
    await advance(50)
    const mark = state.player.hatsuEffects.sunMark
    await special(CHROLLO_BOOKMARK)
    await advance(20)
    await publish({ ...state, player: { ...state.player, health: 20 } })
    await special(CHROLLO_SECONDARY)
    await advance(25)
    return { mark, winner: state.winner, active: victoryActive }
  }
  async function restartRound(final = false) {
    const current = duel()
    await publish({
      ...current,
      phase: 'ready',
      roundNumber: final ? 3 : 1,
      roundsWon: final ? { player: 1, opponent: 1 } : { player: 0, opponent: 0 },
    })
    await publish(beginFight(state))
  }
  async function timeout(draw: boolean) {
    await publish({
      ...state,
      time: FIXED_STEP,
      remainingFrames: 1,
      opponent: { ...state.opponent, health: draw ? state.player.health : state.player.health - 1 },
    })
    await advance(2)
    return state.winner
  }
  async function points() {
    await publish(
      resolveFightOutcome({
        ...state,
        formatId: 'heavens-arena',
        score: { player: 10, opponent: 0 },
      }),
    )
    return state.finishReason
  }
  async function setLocale(locale: 'fr' | 'en') {
    language = locale
    await tick()
  }
  async function pauseAudio(value: boolean) {
    paused = value
    await tick()
  }
  async function showMenu(show: boolean) {
    showingMenu = show
    await tick()
  }
  onMount(() => {
    Object.assign(window, {
      audioFixture: {
        reset,
        kameo,
        opening,
        burst,
        punishAt30Hz,
        footwork,
        strike,
        projectile,
        sunMoon,
        restartRound,
        timeout,
        points,
        setLocale,
        pauseAudio,
        showMenu,
        advanceIdle: advance,
      },
    })
  })
</script>

<main class="clash-battle">
  {#if showingMenu}
    <FightMenuMusic />
    <FightJukebox {language} />
  {:else}
    <FightStage
      {state}
      {stageId}
      {audioSeek}
      {language}
      {paused}
      victoryPaused={paused}
      bind:victoryActive
      onAttack={noop}
      onThrow={noop}
      onCall={noop}
      onFinisher={noop}
      onControl={noop}
    />
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080b12;
    color: #eadab1;
  }
  main {
    width: 100%;
    min-height: 600px;
  }
</style>
