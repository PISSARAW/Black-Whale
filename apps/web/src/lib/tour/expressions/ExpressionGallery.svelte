<script lang="ts">
  import { onMount } from 'svelte'
  import { EXPRESSION_CATALOGUE, EXPRESSION_FAMILIES, expressionDefinition } from './catalogue'
  import { FIGHTING_ROSTER } from '../../fighting/roster'
  import type { FighterId } from '../../fighting/types'
  import type { createExpressionPreview } from './expressionPreviewScene'
  import type { ExpressionCue } from './types'

  let canvas: HTMLCanvasElement
  let preview: ReturnType<typeof createExpressionPreview> | undefined
  let fighter: FighterId = 'kurapika'
  let mode: 'tour' | 'clash' = 'clash'
  let family = ''
  let search = ''
  let selected = 'calme/neutre'
  let secondary = ''
  let mix = 0.35
  let intensity = 1
  let duration = 3
  let loop = true
  let playing = true
  let fullBody = false
  let angle = 0
  let error = ''
  let elapsed = 0
  let clock = 0
  let lastSelection = ''
  $: filtered = EXPRESSION_CATALOGUE.filter(
    (entry) =>
      (!family || entry.family === family) &&
      entry.label.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr')),
  )
  $: definition = expressionDefinition(selected)
  $: selectionKey = `${fighter}:${mode}`
  $: if (preview && selectionKey !== lastSelection) {
    preview.select(fighter, mode)
    lastSelection = selectionKey
    clock = 0
    preview.resize()
  }
  $: preview?.camera(fullBody, Number(angle))

  function choose(id: string) {
    selected = id
    clock = 0
    playing = true
  }
  function cue(): ExpressionCue {
    return {
      id: selected,
      intensity: Number(intensity),
      fade: 0.16,
      duration: loop ? undefined : Number(duration),
      secondary: secondary ? { id: secondary, weight: Number(mix) } : undefined,
    }
  }
  onMount(() => {
    let disposed = false
    let frame = 0
    let resize: ResizeObserver | undefined
    const initialise = async () => {
      try {
        const { createExpressionPreview } = await import('./expressionPreviewScene')
        if (disposed) return
        preview = createExpressionPreview(canvas)
        resize = new ResizeObserver(() => preview?.resize())
        resize.observe(canvas)
        let last = performance.now()
        const animate = (now: number) => {
          if (playing) clock += Math.min(0.05, Math.max(0, (now - last) / 1000))
          last = now
          elapsed = clock
          preview?.draw(clock, cue())
          frame = requestAnimationFrame(animate)
        }
        frame = requestAnimationFrame(animate)
      } catch (reason) {
        error = reason instanceof Error ? reason.message : 'Aperçu 3D indisponible'
      }
    }
    void initialise()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resize?.disconnect()
      preview?.dispose()
    }
  })
</script>

<section class="expression-gallery">
  <header>
    <a href="/fighting">← Black Whale Clash</a>
    <h1>Expressions des personnages</h1>
    <p>{EXPRESSION_CATALOGUE.length} expressions et gestes · Tour et Clash</p>
  </header>
  <div class="workspace">
    <div class="preview-panel">
      <canvas
        bind:this={canvas}
        aria-label={`Aperçu de ${definition?.label ?? selected} pour ${fighter}`}
      ></canvas>
      {#if error}<p role="alert">{error}</p>{/if}
      <div class="caption">
        <strong>{definition?.label}</strong><span>{definition?.family}</span>
      </div>
      <div class="playback">
        <button on:click={() => (playing = !playing)}>{playing ? 'Pause' : 'Reprendre'}</button>
        <button
          on:click={() => {
            clock = 0
            playing = true
          }}>Rejouer</button
        >
        <button
          on:click={() => {
            selected = 'calme/neutre'
            secondary = ''
            clock = 0
          }}>Neutre</button
        >
        <span>{elapsed.toFixed(1)} s</span>
      </div>
      <div class="settings">
        <label
          >Personnage<select bind:value={fighter}
            >{#each FIGHTING_ROSTER as entry (entry.id)}<option value={entry.id}
                >{entry.name}</option
              >{/each}</select
          ></label
        >
        <label
          >Modèle<select bind:value={mode}
            ><option value="clash">Clash</option><option value="tour">Tour</option></select
          ></label
        >
        <label
          >Intensité · {Math.round(Number(intensity) * 100)} %<input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={intensity}
          /></label
        >
        <label
          >Angle<input
            aria-label="Angle de vue"
            type="range"
            min="-0.9"
            max="0.9"
            step="0.01"
            bind:value={angle}
          /></label
        >
        <label class="check"><input type="checkbox" bind:checked={fullBody} /> Corps entier</label>
        <label class="check"
          ><input type="checkbox" bind:checked={loop} /> Maintenir l’expression</label
        >
        {#if !loop}<label
            >Durée en secondes<input
              type="number"
              min="0.5"
              max="30"
              step="0.5"
              bind:value={duration}
            /></label
          >{/if}
      </div>
      <details>
        <summary>Combiner deux expressions</summary>
        <label
          >Seconde expression<select bind:value={secondary}
            ><option value="">Aucune</option>{#each EXPRESSION_CATALOGUE as entry (entry.id)}<option
                value={entry.id}>{entry.family} · {entry.label}</option
              >{/each}</select
          ></label
        >
        {#if secondary}<label
            >Mélange · {Math.round(Number(mix) * 100)} %<input
              type="range"
              min="0"
              max="1"
              step="0.01"
              bind:value={mix}
            /></label
          >{/if}
      </details>
      <p class="note">
        Chaque personnage conserve son tempérament, ses traits et ses éléments masqués. Les
        expressions de dialogue peuvent être jouées avec une durée ou combinées.
      </p>
    </div>
    <div class="catalogue-panel">
      <label
        >Rechercher<input
          type="search"
          placeholder="Sourire, peur, larmes…"
          bind:value={search}
        /></label
      >
      <label
        >Famille<select bind:value={family}
          ><option value="">Toutes les familles</option
          >{#each EXPRESSION_FAMILIES as entry (entry.id)}<option value={entry.label}
              >{entry.label}</option
            >{/each}</select
        ></label
      >
      <p aria-live="polite">{filtered.length} résultats</p>
      <div class="expression-list">
        {#each filtered as entry (entry.id)}
          <button
            class:active={selected === entry.id}
            aria-pressed={selected === entry.id}
            on:click={() => choose(entry.id)}
          >
            <strong>{entry.label}</strong><span>{entry.family}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  .expression-gallery {
    max-width: 1400px;
    margin: auto;
    padding: clamp(1rem, 3vw, 2.5rem);
    color: #e8edf5;
  }
  header {
    margin-bottom: 1.5rem;
  }
  header a {
    color: #98cce0;
  }
  h1 {
    font-size: clamp(1.7rem, 3vw, 2.4rem);
    margin: 0.6rem 0;
  }
  header p,
  .note {
    color: #aebed0;
  }
  .workspace {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(300px, 1fr);
    gap: 1.5rem;
    align-items: start;
  }
  .preview-panel,
  .catalogue-panel {
    border: 1px solid #354255;
    background: #131d2d;
    border-radius: 14px;
    padding: 1rem;
    min-width: 0;
  }
  .preview-panel {
    position: sticky;
    top: 1rem;
  }
  canvas {
    width: 100%;
    height: 440px;
    display: block;
    border-radius: 9px;
  }
  .caption {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    margin: 1rem 0;
  }
  .caption span {
    color: #9aacc3;
  }
  .settings {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin: 1rem 0;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    font-size: 0.9rem;
  }
  select,
  input[type='search'],
  input[type='number'] {
    background: #0d1623;
    color: #e8edf5;
    border: 1px solid #50647b;
    padding: 0.55rem;
    border-radius: 6px;
    width: 100%;
    box-sizing: border-box;
  }
  .check {
    flex-direction: row;
    align-items: center;
  }
  .playback {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .playback span {
    margin-left: auto;
    color: #aebed0;
  }
  button {
    border: 1px solid #425971;
    border-radius: 7px;
    background: #213047;
    color: #e8edf5;
    padding: 0.5rem 0.8rem;
    cursor: pointer;
  }
  button:hover {
    background: #2b4560;
  }
  button:focus-visible,
  select:focus-visible,
  input:focus-visible {
    outline: 2px solid #84d4e7;
    outline-offset: 2px;
  }
  details {
    border-top: 1px solid #354255;
    padding-top: 1rem;
  }
  summary {
    cursor: pointer;
    margin-bottom: 0.8rem;
  }
  .note {
    font-size: 0.85rem;
    line-height: 1.5;
  }
  .catalogue-panel > label + label {
    margin-top: 1rem;
  }
  .expression-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    max-height: 760px;
    overflow: auto;
    padding: 0.15rem;
  }
  .expression-list button {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-height: 70px;
  }
  .expression-list span {
    font-size: 0.75rem;
    color: #b2c1d5;
  }
  .expression-list .active {
    border-color: #81d6e3;
    background: #24475b;
  }
  @media (max-width: 850px) {
    .workspace {
      grid-template-columns: 1fr;
    }
    .preview-panel {
      position: static;
    }
    canvas {
      height: 340px;
    }
    .expression-list {
      max-height: 440px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    * {
      scroll-behavior: auto;
    }
  }
</style>
