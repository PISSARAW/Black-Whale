<script lang="ts">
  import { onDestroy } from 'svelte'
  import {
    DEATH_MATCH_CHECKPOINTS,
    DEATH_MATCH_GALLERY,
  } from '$lib/fighting/heavensDeathMatch/checkpoints'
  import type { HistoricalStart } from '$lib/fighting/heavensDeathMatch/library'
  import type { DeathMatchOptions } from '$lib/fighting/heavensDeathMatch/scenario'
  import type { FightState } from '$lib/fighting/types'

  export let options: DeathMatchOptions
  export let language: 'fr' | 'en'
  export let onStart: (state: FightState) => void

  let worker: Worker | undefined
  let preparing = false
  let failed = false
  $: fr = language === 'fr'

  function stop() {
    worker?.terminate()
    worker = undefined
    preparing = false
  }
  onDestroy(stop)

  function prepare(start: HistoricalStart) {
    stop()
    failed = false
    try {
      worker = new Worker(
        new URL('../../fighting/heavensDeathMatch/library.worker.ts', import.meta.url),
        { type: 'module' },
      )
      preparing = true
      worker.onmessage = (message: MessageEvent<FightState | null>) => {
        stop()
        if (message.data) onStart(message.data)
        else failed = true
      }
      worker.onerror = () => {
        stop()
        failed = true
      }
      worker.postMessage({ start, options })
    } catch {
      stop()
      failed = true
    }
  }
</script>

<details>
  <summary
    >{fr
      ? 'Reprendre un chapitre ou revoir une séquence'
      : 'Resume a chapter or replay a sequence'}</summary
  >
  <div class="library-group" role="group" aria-label={fr ? 'Chapitres' : 'Chapters'}>
    {#each DEATH_MATCH_CHECKPOINTS as chapter (chapter)}
      <button
        type="button"
        aria-label={fr ? `Reprendre le chapitre ${chapter}` : `Resume chapter ${chapter}`}
        disabled={preparing}
        onclick={() => prepare({ chapter })}>{chapter}</button
      >
    {/each}
  </div>
  <div class="library-group" role="group" aria-label={fr ? 'Séquences' : 'Sequences'}>
    {#each DEATH_MATCH_GALLERY as sequence (sequence.id)}
      <button type="button" disabled={preparing} onclick={() => prepare({ sequence: sequence.id })}
        >{fr ? sequence.titleFr : sequence.titleEn}</button
      >
    {/each}
  </div>
  {#if preparing}
    <p role="status">
      {fr ? 'Préparation de la salle…' : 'Preparing the arena…'}
      <button type="button" onclick={stop}>{fr ? 'Annuler' : 'Cancel'}</button>
    </p>
  {:else if failed}
    <p role="alert">
      {fr
        ? 'Ce point de reprise n’a pas pu être chargé.'
        : 'This starting point could not be loaded.'}
    </p>
  {/if}
</details>

<style>
  details {
    margin-block: 1rem;
  }
  summary {
    cursor: pointer;
  }
  .library-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.7rem;
  }
  button {
    padding: 0.35rem 0.6rem;
    background: #211d1e;
    border: 1px solid #b69b6b77;
    color: #fff6e5;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.55;
  }
</style>
