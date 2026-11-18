<script lang="ts">
  import { get } from 'svelte/store'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import FightMatchOverlays from '$lib/components/fighting/FightMatchOverlays.svelte'
  import { createFight, beginFight } from '$lib/fighting/engine'
  import { clashCareer } from '$lib/fighting/career/profile'
  import type { CareerAppearance } from '$lib/fighting/career/types'
  import type { FighterId } from '$lib/fighting/types'
  let state = createFight('kurapika', 'hisoka')
  let paused = false
  let language: 'fr' | 'en' = 'fr'
  let starts = 0
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
    state = createFight(options.player ?? 'kurapika', options.opponent ?? 'hisoka')
    language = options.language ?? 'fr'
    paused = false
  }
  Object.assign(window, {
    introductionFixture: {
      reset,
      pause: (value: boolean) => (paused = value),
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
