<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import {
    CLASH_TRACKS,
    jukeboxPreview,
    readTrackChoice,
    type ClashTrack,
  } from '$lib/fighting/audio/jukebox'
  import {
    DEFAULT_FIGHT_AUDIO,
    readFightAudioSettings,
    saveFightAudioSettings,
  } from '$lib/fighting/audio/settings'

  export let language: 'fr' | 'en'
  let settings = { ...DEFAULT_FIGHT_AUDIO }
  let audition: ClashTrack = 'menu'
  const tracks = Object.entries(CLASH_TRACKS)
  const fields = ['menuTrack', 'battleTrack'] as const
  $: fr = language === 'fr'
  onMount(() => {
    settings = readFightAudioSettings()
  })
  onDestroy(() => jukeboxPreview.set(null))

  function choose(field: 'menuTrack' | 'battleTrack', value: string) {
    settings = { ...settings, [field]: readTrackChoice(value) }
    saveFightAudioSettings(settings)
  }
</script>

<details
  class="jukebox"
  ontoggle={(event) => {
    if (!event.currentTarget.open) jukeboxPreview.set(null)
  }}
>
  <summary>Jukebox</summary>
  <div>
    {#each fields as field (field)}
      <label>
        {field === 'menuTrack'
          ? fr
            ? 'Musique du menu'
            : 'Menu music'
          : fr
            ? 'Musique des combats'
            : 'Match music'}
        <select
          value={settings[field]}
          onchange={(event) => choose(field, event.currentTarget.value)}
        >
          <option value="auto">{fr ? 'Automatique' : 'Automatic'}</option>
          <option value="off">{fr ? 'Désactivée' : 'Off'}</option>
          {#each tracks as [id, names] (id)}
            <option value={id}>{names[fr ? 0 : 1]}</option>
          {/each}
        </select>
      </label>
    {/each}
    <label>
      {fr ? 'Piste à écouter' : 'Track preview'}
      <select bind:value={audition}>
        {#each tracks as [id, names] (id)}
          <option value={id}>{names[fr ? 0 : 1]}</option>
        {/each}
      </select>
    </label>
    <button type="button" onclick={() => jukeboxPreview.set(audition)}
      >{fr ? 'Écouter' : 'Preview'}</button
    >
    <button type="button" disabled={!$jukeboxPreview} onclick={() => jukeboxPreview.set(null)}>
      {fr ? 'Arrêter l’extrait' : 'Stop preview'}
    </button>
  </div>
</details>

<style>
  .jukebox {
    margin: 1rem 0;
    color: #d8e1e9;
  }
  summary {
    cursor: pointer;
    color: #e4bc64;
  }
  div {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    padding: 0.75rem 0;
    align-items: end;
  }
  label {
    display: grid;
    gap: 0.28rem;
  }
  select,
  button {
    font: inherit;
    color: inherit;
    background: #101923;
    border: 1px solid #465664;
    padding: 0.45rem;
  }
  button:disabled {
    opacity: 0.45;
  }
</style>
