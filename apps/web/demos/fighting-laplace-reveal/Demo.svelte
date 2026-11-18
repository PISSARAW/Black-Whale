<script lang="ts">
  import { onMount, tick } from 'svelte'
  import FightStage from '../../src/lib/components/fighting/FightStage.svelte'
  import FightMatchOverlays from '../../src/lib/components/fighting/FightMatchOverlays.svelte'
  import { futureVisibleState } from '../../src/lib/fighting/parallelFuturePresentation'
  import { createLaplaceRevealFilm } from './film'
  const film = createLaplaceRevealFilm()
  let index = 0
  let victoryActive = false
  $: state = film.states[index]
  $: visible = futureVisibleState(state, 'player')
  const noAction = () => {}
  onMount(() => {
    Object.assign(window, {
      laplaceDemo: {
        report: () => ({ ...film.report, index }),
        seek: async (frame: number) => {
          index = Math.max(0, Math.min(film.states.length - 1, frame))
          await tick()
        },
      },
    })
  })
</script>

<main>
  <FightStage
    {state}
    language="fr"
    minimal
    detailed
    onAttack={noAction}
    onThrow={noAction}
    onCall={noAction}
    onFinisher={noAction}
    onControl={noAction}
    bind:victoryActive
  />
  {#if !victoryActive}<FightMatchOverlays
      state={visible}
      language="fr"
      startFight={noAction}
      rematch={noAction}
      continueMatch={noAction}
      chooseAgain={noAction}
      quitFight={noAction}
    />{/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080b10;
  }
  :global(*) {
    box-sizing: border-box;
  }
  main {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
  }
  main :global(.fight-stage) {
    width: 100%;
    height: 100%;
    border: 0;
  }
  main :global(.fight-arena) {
    height: 100%;
    min-height: 0;
    border: 0;
  }
</style>
