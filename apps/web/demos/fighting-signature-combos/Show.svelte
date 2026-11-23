<script lang="ts">
  import { onDestroy } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { recordSignatureClips } from './record'

  const clips = recordSignatureClips()
  const comfort = { ...defaultFightComfort(), graphics: 'quality' as const, camera: 1 as const }

  let selected = $state(
    Math.max(
      0,
      clips.findIndex((c) => c.combo.fighter === 'tserriednich'),
    ),
  )
  let frame = $state(0)
  let playing = $state(true)
  let speed = $state(1)
  let clip = $derived(clips[selected])
  let state = $derived(clip.states[Math.min(frame, clip.states.length - 1)])
  let step = $derived(clip.steps[Math.min(frame, clip.steps.length - 1)])
  let combo = $derived(state.opponent.comboHits)

  let last = 0
  let carry = 0
  let raf = 0
  function loop(now: number) {
    if (last && playing) {
      carry += ((now - last) / (1000 / 60)) * speed
      const advance = Math.floor(carry)
      carry -= advance
      if (advance) frame = frame + advance >= clip.states.length ? 0 : frame + advance
    }
    last = now
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
  onDestroy(() => cancelAnimationFrame(raf))

  function choose(index: number) {
    selected = index
    frame = 0
    playing = true
  }
</script>

<main>
  {#key selected}
    <FightScene
      {state}
      {comfort}
      language="fr"
      stageId="heavens-arena"
      viewer="player"
      keepCombatantMarkers={false}
      hideSecondaryView
    />
  {/key}

  <nav>
    {#each clips as entry, index (entry.combo.id)}
      <button class:active={index === selected} onclick={() => choose(index)}>
        {entry.combo.title[0]}
      </button>
    {/each}
  </nav>

  <aside>
    <h1>{clip.combo.title[0]}</h1>
    <p class="versus">
      {clip.combo.fighter} contre {clip.opponent}{clip.ai ? ' (IA)' : ' (mannequin qui garde)'}
    </p>
    <ol>
      {#each clip.labels as label, index (index)}
        <li class:done={index < step} class:now={index === step}>{label}</li>
      {/each}
    </ol>
    <div class="meters">
      <span>Combo <b>{combo}</b></span>
      <span>PV {clip.combo.fighter} <b>{state.player.health}</b></span>
      <span>PV {clip.opponent} <b>{state.opponent.health}</b></span>
    </div>
    <div class="controls">
      <button onclick={() => (playing = !playing)}>{playing ? 'Pause' : 'Lecture'}</button>
      <button onclick={() => (frame = 0)}>Rejouer</button>
      <button onclick={() => (speed = speed === 1 ? 0.35 : 1)}>
        {speed === 1 ? 'Ralenti' : 'Vitesse normale'}
      </button>
      <input
        type="range"
        min="0"
        max={clip.states.length - 1}
        bind:value={frame}
        oninput={() => (playing = false)}
        aria-label="Position dans la route"
      />
    </div>
  </aside>
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }
  :global(html),
  :global(body) {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #05070b;
    font-family: system-ui, sans-serif;
    color: #f1ead9;
  }
  main {
    position: relative;
    width: 100vw;
    height: 100vh;
  }
  main :global(.fight-scene) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  nav {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  button {
    background: rgba(10, 12, 18, 0.78);
    color: inherit;
    border: 1px solid rgba(241, 234, 217, 0.25);
    border-radius: 6px;
    padding: 6px 10px;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }
  button.active {
    border-color: #d9b674;
    color: #d9b674;
  }
  aside {
    position: absolute;
    right: 12px;
    bottom: 12px;
    width: min(340px, calc(100vw - 24px));
    background: rgba(8, 10, 15, 0.84);
    border: 1px solid rgba(241, 234, 217, 0.18);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 13px;
  }
  h1 {
    margin: 0;
    font-size: 17px;
    color: #d9b674;
  }
  .versus {
    margin: 2px 0 8px;
    opacity: 0.7;
  }
  ol {
    margin: 0;
    padding-left: 20px;
    line-height: 1.55;
  }
  li {
    opacity: 0.5;
  }
  li.done {
    opacity: 0.85;
  }
  li.now {
    opacity: 1;
    color: #d9b674;
    font-weight: 600;
  }
  .meters {
    display: flex;
    gap: 12px;
    margin: 10px 0 8px;
    font-variant-numeric: tabular-nums;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  input[type='range'] {
    flex: 1 1 100%;
  }
</style>
