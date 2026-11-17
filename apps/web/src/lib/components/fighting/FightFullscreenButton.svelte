<script lang="ts">
  import { onMount } from 'svelte'
  import {
    enterFightFullscreen,
    exitFightFullscreen,
    isFightFullscreen,
  } from '$lib/fighting/fightFullscreen'
  export let language: 'fr' | 'en'
  export let target: HTMLElement | undefined
  export let compact = false
  let fullscreen = false
  let fallback = false
  $: fr = language === 'fr'
  const update = () => (fullscreen = isFightFullscreen())
  onMount(() => {
    update()
    document.addEventListener('webkitfullscreenchange', update)
    return () => document.removeEventListener('webkitfullscreenchange', update)
  })
  async function toggle() {
    if (!target) return
    if (fullscreen) {
      await exitFightFullscreen().catch(() => {})
      fallback = false
    } else fallback = (await enterFightFullscreen(target)) === 'viewport'
    update()
  }
</script>

<svelte:document onfullscreenchange={update} />
<div class="fullscreen-control" class:compact>
  <button
    type="button"
    class="battle-fullscreen-button"
    aria-label={fullscreen
      ? fr
        ? 'Quitter le plein écran'
        : 'Exit fullscreen'
      : fr
        ? 'Activer le plein écran'
        : 'Enter fullscreen'}
    aria-pressed={fullscreen}
    onclick={toggle}
    ><span aria-hidden="true">⛶</span>{#if !compact}{fullscreen
        ? fr
          ? 'Quitter le plein écran'
          : 'Exit fullscreen'
        : fr
          ? 'Plein écran'
          : 'Fullscreen'}{/if}</button
  >
  {#if fallback}<p role="status">
      {fr
        ? 'Le jeu occupe tout l’espace disponible. Sur iPhone, utilise « Ajouter à l’écran d’accueil » puis « Ouvrir comme app web » pour masquer les barres de Safari.'
        : 'The game fills the available space. On iPhone, use “Add to Home Screen”, then “Open as Web App” to hide Safari’s bars.'}
    </p>{/if}
</div>

<style>
  .fullscreen-control {
    position: relative;
  }
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-width: 44px;
    min-height: 44px;
    padding: 0.5rem 0.7rem;
    border: 1px solid #725587;
    background: #211629;
    color: #e1c7f2;
    font: 600 0.7rem var(--font-mono);
    cursor: pointer;
    touch-action: manipulation;
  }
  button span {
    font:
      1.5rem/1 Arial,
      sans-serif;
  }
  button:focus-visible {
    outline: 2px solid #ffb38a;
    outline-offset: 2px;
  }
  p {
    margin: 0.5rem 0 0;
    max-width: 28rem;
    font: 0.75rem/1.5 var(--font-mono);
    color: #f0d2bc;
  }
  .compact p {
    position: absolute;
    z-index: 80;
    right: 0;
    top: 100%;
    width: min(300px, 80vw);
    padding: 0.75rem;
    border: 1px solid #725587;
    background: #17101f;
  }
</style>
