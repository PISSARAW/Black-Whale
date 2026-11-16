<script lang="ts">
  import { onMount } from 'svelte'
  import { fightFormat } from '$lib/fighting/formats'
  import type { FightFormatId } from '$lib/fighting/formats'

  export let language: 'fr' | 'en'
  export let formatId: FightFormatId
  export let target: HTMLElement | undefined
  export let detailed = false
  export let hudScale = 1
  export let showControls = false
  export let paused = false
  export let canPause = false
  export let onPause: () => void

  let controlMode = 'auto'
  let touchDevice = false
  let fullscreen = false
  let fullscreenSupported = false
  let fullscreenError = ''
  $: showControls = controlMode === 'on' || (controlMode === 'auto' && touchDevice)
  $: format = fightFormat(formatId)

  onMount(() => {
    const pointer = window.matchMedia('(any-pointer: coarse)')
    const updatePointer = () => {
      touchDevice = pointer.matches
    }
    updatePointer()
    pointer.addEventListener('change', updatePointer)
    fullscreenSupported = Boolean(document.fullscreenEnabled)
    return () => pointer.removeEventListener('change', updatePointer)
  })

  async function toggleFullscreen() {
    fullscreenError = ''
    try {
      if (document.fullscreenElement === target) await document.exitFullscreen()
      else await target?.requestFullscreen()
    } catch {
      fullscreenError =
        language === 'fr'
          ? 'Plein écran indisponible dans ce navigateur.'
          : 'Fullscreen is unavailable in this browser.'
    }
  }
</script>

<svelte:document
  onfullscreenchange={() => {
    fullscreen = document.fullscreenElement === target
  }}
/>

<div class="fight-toolbar">
  <span class="format-name">{language === 'fr' ? format.titleFr : format.titleEn}</span>
  <slot />
  <details class="display-settings">
    <summary>{language === 'fr' ? 'Affichage' : 'Display'}</summary>
    <div class="settings-panel">
      <label
        ><input type="checkbox" bind:checked={detailed} />
        {language === 'fr'
          ? 'Détails tactiques et PV exacts'
          : 'Tactical details and exact HP'}</label
      >
      <label
        >{language === 'fr' ? 'Taille du HUD' : 'HUD size'}
        <select bind:value={hudScale}>
          <option value={1}>100 %</option><option value={1.15}>115 %</option><option value={1.3}
            >130 %</option
          >
        </select>
      </label>
      <label
        >{language === 'fr' ? 'Commandes à l’écran' : 'On-screen controls'}
        <select bind:value={controlMode}>
          <option value="auto">Auto</option><option value="on"
            >{language === 'fr' ? 'Afficher' : 'Show'}</option
          ><option value="off">{language === 'fr' ? 'Masquer' : 'Hide'}</option>
        </select>
      </label>
    </div>
  </details>
  {#if fullscreenSupported}
    <button type="button" aria-pressed={fullscreen} onclick={toggleFullscreen}>
      {fullscreen
        ? language === 'fr'
          ? 'Quitter le plein écran'
          : 'Exit fullscreen'
        : language === 'fr'
          ? 'Plein écran'
          : 'Fullscreen'}
    </button>
  {/if}
  {#if canPause}
    <button type="button" class="pause-fight" aria-pressed={paused} onclick={onPause}>
      {paused
        ? language === 'fr'
          ? 'Reprendre'
          : 'Resume'
        : language === 'fr'
          ? 'Pause · P'
          : 'Pause · P'}
    </button>
  {/if}
  {#if fullscreenError}<span role="status">{fullscreenError}</span>{/if}
</div>

<style>
  .fight-toolbar {
    position: relative;
    z-index: 50;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.75rem;
    background: #0a1117;
    color: #dce5ea;
    font: 600 0.8rem/1.35 var(--font-mono);
  }
  .format-name {
    margin-right: auto;
    color: #e2c576;
  }
  button,
  summary {
    min-height: 44px;
    padding: 0.65rem 0.75rem;
    border: 1px solid #495967;
    background: #14202a;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  summary::after {
    content: '+';
    color: #e2c576;
  }
  details[open] summary::after {
    content: '−';
  }
  button:focus-visible,
  summary:focus-visible,
  select:focus-visible,
  input:focus-visible {
    outline: 2px solid #e2c576;
    outline-offset: 2px;
  }
  .settings-panel {
    position: absolute;
    top: 100%;
    right: 0;
    display: grid;
    gap: 0.8rem;
    width: min(24rem, 100%);
    padding: 1rem;
    border: 1px solid #596875;
    background: #0a141e;
    box-shadow: 0 12px 20px #0008;
  }
  label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
  }
  input {
    width: 1.1rem;
    height: 1.1rem;
    accent-color: #d9b650;
  }
  select {
    min-height: 40px;
    padding: 0.3rem;
    border: 1px solid #647482;
    background: #172732;
    color: #fff;
    font: inherit;
  }
  @media (max-width: 600px) {
    .format-name {
      width: 100%;
    }
    button,
    summary {
      padding: 0.6rem;
    }
  }
</style>
