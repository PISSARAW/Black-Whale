<script lang="ts">
  import { onMount, tick } from 'svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightVictoryOverlay from '$lib/components/fighting/FightVictoryOverlay.svelte'
  import FightMatchOverlays from '$lib/components/fighting/FightMatchOverlays.svelte'
  import { beginFight, createFight } from '$lib/fighting/engine'
  import { selectVictory } from '$lib/fighting/victory/catalogue'
  import type { VictoryFrame } from '$lib/fighting/victory/playback'
  import type { FighterId, FightSide, FightMode } from '$lib/fighting/types'
  import type { FightStageId } from '$lib/fighting/stages'
  let state = beginFight(createFight('hisoka', 'chrollo', { mode: 'versus-local' }))
  let stageId: FightStageId = 'whale-hold'
  let active = false,
    paused = false,
    preview = false,
    ready = false
  let frame: VictoryFrame | null = null
  const noop = () => {}
  async function configure(options: {
    winner: FighterId
    target: FighterId
    side?: FightSide
    stage?: FightStageId
    mode?: FightMode
    preview?: boolean
  }) {
    preview = options.preview ?? false
    ready = false
    const side = options.side ?? 'player'
    stageId = options.stage ?? 'whale-hold'
    state = beginFight(
      createFight(
        side === 'player' ? options.winner : options.target,
        side === 'player' ? options.target : options.winner,
        { mode: options.mode ?? 'versus-local', environment: { stageId } },
      ),
    )
    frame = null
    await tick()
  }
  async function finish() {
    const side = (window as any).victorySide ?? 'player'
    state = {
      ...state,
      phase: 'finished',
      winner: side,
      matchWinner: side,
      finishReason: 'knockout',
      frame: 600,
      [side === 'player' ? 'opponent' : 'player']: {
        ...state[side === 'player' ? 'opponent' : 'player'],
        health: 0,
      },
    }
    const selection = selectVictory(state)
    frame = selection ? { ...selection, elapsed: 0, active: true } : null
    await tick()
  }
  async function pose(elapsed: number) {
    if (frame) frame = { ...frame, elapsed }
    await tick()
  }
  onMount(() => {
    ;(window as any).victoryFixture = {
      async configure(options: Parameters<typeof configure>[0]) {
        ;(window as any).victorySide = options.side ?? 'player'
        await configure(options)
      },
      finish,
      pose,
      async pause(value: boolean) {
        paused = value
        await tick()
      },
      snapshot: () => ({ active, ready, state: JSON.stringify(state) }),
    }
  })
</script>

<main class="clash-battle">
  {#if preview}
    {#key `${stageId}:${state.player.id}:${state.opponent.id}`}
      <FightScene
        {state}
        {stageId}
        victoryFrame={frame}
        hideSecondaryView
        onSceneReady={() => (ready = true)}
      />
    {/key}
    <FightVictoryOverlay {frame} {state} language="fr" onSkip={noop} />
  {:else}
    <FightStage
      {state}
      {stageId}
      language="fr"
      victoryPaused={paused}
      bind:victoryActive={active}
      onAttack={noop}
      onThrow={noop}
      onCall={noop}
      onFinisher={noop}
      onControl={noop}
    />
    {#if !active}<FightMatchOverlays
        {state}
        language="fr"
        startFight={noop}
        rematch={noop}
        continueMatch={noop}
        chooseAgain={noop}
        {...{ paused, togglePause: noop, quitFight: noop }}
      />{/if}
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080b12;
    color: #eadab1;
  }
  :global(#app) {
    height: 100dvh;
  }
  main {
    position: relative;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
  :global(.fight-stage) {
    height: 100%;
  }
  :global(.fight-arena) {
    height: 100% !important;
    min-height: 0 !important;
  }
</style>
