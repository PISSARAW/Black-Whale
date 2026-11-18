<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { defaultFightComfort, type FightComfort } from '$lib/fighting/fightComfort'
  import type { FighterId } from '$lib/fighting/types'
  import { cornerRecovery, rosterPursuit, rosterPursuitIds } from './rosterScenarios'

  type Track = ReturnType<typeof rosterPursuit>
  const comfort: FightComfort = { ...defaultFightComfort(), graphics: 'balanced', shake: 0 }
  let track: Track
  let index = 0
  let key = 0
  let loaded = false
  let failed = false

  function select(id: FighterId | 'recovery') {
    track = id === 'recovery' ? cornerRecovery() : rosterPursuit(id)
    index = Math.max(0, track.command - 9)
    loaded = false
    failed = false
    key++
    const { states, ...details } = track
    return { ...details, length: states.length, start: index }
  }

  const paint = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  async function frame(value: number) {
    index = value
    await tick()
    await paint()
    await paint()
  }

  Object.assign(window, {
    pursuitMontage: {
      ids: rosterPursuitIds,
      select,
      frame,
      loaded: () => loaded,
      failed: () => failed,
    },
  })

  $: impact = track?.states[index].impact
  $: teaching = track?.winner === 'opponent'
  $: hits = impact?.attacker === 'player' ? impact.comboHits : 0
</script>

{#if track}
  <main>
    <header>
      <span>BLACK WHALE · CLASH</span>
      <h1>{teaching ? 'Reprise au coin' : track.name}</h1>
      <p>{teaching ? 'Camilla · Poursuite légère retardée' : track.technique}</p>
    </header>
    <section aria-label="Arène">
      {#key key}
        <FightScene
          state={track.states[index]}
          {comfort}
          active={false}
          showRecovery
          stageId="whale-hold"
          presentationSeconds={index / 60}
          hideSecondaryView
          keepCombatantMarkers={false}
          onSceneReady={() => (loaded = true)}
          onSceneFailed={() => (failed = true)}
        />
      {/key}
      <div class="location">{track.corner ? 'Coin droit' : 'Centre'}</div>
      {#if hits >= 2}
        <div class="combo" data-hits={hits}><strong>{hits}</strong> TOUCHES</div>
      {/if}
    </section>
    <footer>
      <strong>{index <= track.launch ? '↑ + J' : teaching ? '+10 F' : 'POURSUITE'}</strong>
      <span
        >{teaching
          ? 'Le défenseur peut interrompre'
          : (track.condition ?? 'Technique du combattant')}</span
      >
    </footer>
  </main>
{/if}

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    background: #0b1017;
    color: #f3f6fa;
    font-family: system-ui, sans-serif;
  }
  main {
    height: 100dvh;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
  header,
  footer {
    background: #101924;
    padding: 16px 22px;
  }
  header span {
    color: #7ceada;
    font-size: 0.74rem;
    font-weight: 760;
    letter-spacing: 0.17em;
  }
  h1 {
    font-size: clamp(2rem, 8vw, 3.25rem);
    line-height: 1.06;
    margin: 3px 0;
  }
  p {
    margin: 0;
    color: #d5dfe9;
    font-size: 1.1rem;
  }
  section {
    position: relative;
  }
  .location,
  .combo {
    position: absolute;
    top: 14px;
    padding: 0.35em 0.65em;
    border: 1px solid #52697e;
    border-radius: 0.3rem;
    background: #0e1a28ee;
  }
  .location {
    left: 18px;
    font-size: 0.93rem;
    font-weight: 720;
  }
  .combo {
    right: 18px;
    color: #ffd8a1;
    font-size: 0.85rem;
    letter-spacing: 0.06em;
    font-weight: 750;
  }
  .combo strong {
    font-size: 1.35rem;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 2rem;
  }
  footer strong {
    color: #7ceada;
    font: 750 1.04rem monospace;
    white-space: nowrap;
  }
  footer span {
    color: #d5dfe9;
    font-size: 0.92rem;
  }
</style>
