<script lang="ts">
  import { get } from 'svelte/store'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import FightMatchOverlays from '$lib/components/fighting/FightMatchOverlays.svelte'
  import { createFight, beginFight, tickFight } from '$lib/fighting/engine'
  import { FIXED_STEP } from '$lib/fighting/fightClock'
  import { withKameos } from '$lib/fighting/kameos/state'
  import { DEFAULT_FIGHT_AUDIO } from '$lib/fighting/audio/settings'
  import { clashCareer } from '$lib/fighting/career/profile'
  import type { CareerAppearance } from '$lib/fighting/career/types'
  import { EMPTY_INPUT, type FighterId } from '$lib/fighting/types'
  let state = duel()
  let audioSettings = { ...DEFAULT_FIGHT_AUDIO }
  let paused = false
  let language: 'fr' | 'en' = 'fr'
  let starts = 0
  function duel(player: FighterId = 'kurapika', opponent: FighterId = 'chrollo') {
    return withKameos(createFight(player, opponent), { player: 'luzurus' })
  }
  function start() {
    starts++
    state = beginFight(state)
  }
  function reset(
    options: {
      mode?: CareerAppearance['intro']
      player?: FighterId
      opponent?: FighterId
      language?: 'fr' | 'en'
    } = {},
  ) {
    clashCareer.configure('Hunter', {
      ...get(clashCareer).appearance,
      intro: options.mode ?? 'full',
    })
    state = duel(options.player, options.opponent)
    language = options.language ?? 'fr'
    paused = false
  }
  Object.assign(window, {
    introductionFixture: {
      reset,
      pause: (value: boolean) => (paused = value),
      mute: (muted: boolean) => (audioSettings = { ...audioSettings, muted }),
      callLuzurus: () => {
        state = tickFight(state, { ...EMPTY_INPUT, kameo: true }, { dt: FIXED_STEP, ai: false })
        return state.kameos?.player
      },
      snapshot: () => ({ state, starts }),
    },
  })
</script>

<FightStage
  {state}
  {language}
  {paused}
  minimal
  introEnabled
  bind:audioSettings
  onIntroComplete={start}
  onAttack={() => {}}
  onThrow={() => {}}
  onCall={() => {}}
  onFinisher={() => {}}
  onControl={() => {}}
/>
<FightMatchOverlays
  {state}
  {language}
  introEnabled
  startFight={start}
  rematch={() => reset()}
  continueMatch={() => {}}
  chooseAgain={() => {}}
  quitFight={() => {}}
/>
<output data-phase={state.phase}>{state.phase}</output>

<style>
  :global(body) {
    margin: 0;
    background: #05070b;
  }
  :global(.fight-stage) {
    height: 100dvh;
  }
  :global(.fight-arena) {
    height: 100% !important;
    min-height: 0 !important;
  }
  output {
    position: fixed;
    top: 4px;
    right: 4px;
    z-index: 40;
    font: 10px monospace;
    color: #fff;
  }
</style>
