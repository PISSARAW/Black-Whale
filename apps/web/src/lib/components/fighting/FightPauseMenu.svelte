<script lang="ts">
  import { onMount } from 'svelte'
  import { useFightBindings } from '$lib/fighting/fightControlHints'
  export let language: 'fr' | 'en'
  export let tab = 'overview'
  export let training = false
  export let onResume: () => void
  let dialog: HTMLDialogElement
  const bindings = useFightBindings()
  $: fr = language === 'fr'
  $: tabs = [
    { id: 'overview', label: fr ? 'Combat' : 'Match', number: '01' },
    { id: 'techniques', label: fr ? 'Techniques & états' : 'Techniques & status', number: '02' },
    { id: 'moves', label: fr ? 'Coups & combos' : 'Moves & combos', number: '03' },
    { id: 'controls', label: fr ? 'Commandes' : 'Controls', number: '04' },
    { id: 'settings', label: fr ? 'Affichage & son' : 'Display & sound', number: '05' },
    { id: 'replays', label: 'Replays', number: '06' },
    ...(training
      ? [{ id: 'training', label: fr ? 'Entraînement' : 'Training', number: '07' }]
      : []),
  ]
  function handleKey(event: KeyboardEvent) {
    const typing = (event.target as HTMLElement)?.closest('input, select, textarea, .capturing')
    if (typing || event.repeat || event.key.toLowerCase() !== $bindings.pause.toLowerCase()) return
    event.preventDefault()
    event.stopPropagation()
    onResume()
  }
  onMount(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.showModal()
    dialog.querySelector<HTMLButtonElement>('.pause-resume')?.focus()
    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  })
</script>

<dialog
  bind:this={dialog}
  class="clash-pause-menu pause-overlay"
  aria-labelledby="pause-title"
  data-fight-scroll
  oncancel={(event) => {
    event.preventDefault()
    onResume()
  }}
  onkeydown={handleKey}
>
  <header class="pause-heading">
    <div>
      <p>BLACK WHALE / CLASH</p>
      <h2 id="pause-title">PAUSE</h2>
    </div>
    <button
      type="button"
      class="pause-close"
      aria-label={fr ? 'Fermer le menu pause' : 'Close pause menu'}
      onclick={onResume}>×</button
    >
  </header>
  <div class="pause-layout">
    <nav aria-label={fr ? 'Sections du menu pause' : 'Pause menu sections'}>
      {#each tabs as entry (entry.id)}<button
          type="button"
          aria-pressed={tab === entry.id}
          onclick={() => (tab = entry.id)}
          ><small>{entry.number}</small><span>{entry.label}</span><b aria-hidden="true">→</b
          ></button
        >{/each}
    </nav>
    <div class="pause-content" data-fight-scroll><slot /></div>
  </div>
  <footer>
    <span
      >{fr ? 'Échap' : 'Esc'} / {$bindings.pause.toUpperCase()} · {fr
        ? 'Retour au combat'
        : 'Back to the fight'}</span
    ><button type="button" class="clash-primary pause-resume" onclick={onResume}
      >{fr ? 'Reprendre le combat' : 'Resume fight'} <span aria-hidden="true">→</span></button
    >
  </footer>
</dialog>

<style>
  .clash-pause-menu {
    width: min(1080px, calc(100vw - 3rem));
    max-width: none;
    max-height: min(88dvh, 900px);
    padding: 0;
    overflow: hidden;
    border: 1px solid #7e5b92;
    color: #f2eaf7;
    background: linear-gradient(135deg, #211525, #100d16 60%);
    box-shadow: 0 30px 120px #000b;
  }
  .clash-pause-menu::backdrop {
    background: #050308b8;
    backdrop-filter: blur(5px) saturate(0.55);
  }
  .pause-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.75rem;
    border-bottom: 1px solid #ffffff1c;
  }
  .pause-heading p {
    margin: 0 0 0.5rem;
    color: #c9a1e1;
    font: 600 0.55rem/1.5 var(--font-mono);
    letter-spacing: 0.18em;
  }
  h2 {
    margin: 0;
    color: #f7f1ed;
    font:
      italic 900 2.8rem/1 Arial,
      sans-serif;
    letter-spacing: -0.06em;
  }
  .pause-close {
    width: 44px;
    height: 44px;
    border: 1px solid #62516c;
    background: #1b1323;
    color: #dfcaee;
    font:
      1.6rem Arial,
      sans-serif;
    cursor: pointer;
  }
  .pause-layout {
    display: grid;
    grid-template-columns: 235px minmax(0, 1fr);
    min-height: 320px;
  }
  nav {
    display: flex;
    flex-direction: column;
    padding: 1.1rem 0.8rem;
    gap: 0.3rem;
    border-right: 1px solid #ffffff18;
    background: #ffffff03;
  }
  nav button {
    display: flex;
    align-items: center;
    min-height: 49px;
    gap: 0.7rem;
    padding: 0.7rem 0.8rem;
    border: 1px solid transparent;
    color: #b4a4c0;
    background: transparent;
    text-align: left;
    font: 600 0.7rem/1.4 var(--font-mono);
    cursor: pointer;
  }
  nav button small {
    color: #786284;
    font-size: 0.55rem;
  }
  nav button b {
    margin-left: auto;
    visibility: hidden;
  }
  nav button[aria-pressed='true'] {
    border-color: #ff864b80;
    color: #ffd7c1;
    background: #ff864b10;
  }
  nav button[aria-pressed='true'] b {
    visibility: visible;
    color: #ff9c67;
  }
  .pause-content {
    padding: 1.5rem 1.75rem;
    min-width: 0;
    max-height: calc(88dvh - 222px);
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-color: #9065ac #17101e;
  }
  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.75rem;
    border-top: 1px solid #ffffff1c;
    background: #100d16;
  }
  footer > span {
    color: #a38bb3;
    font: 0.6rem/1.5 var(--font-mono);
  }
  button:focus-visible {
    outline: 2px solid #ffb38a;
    outline-offset: 3px;
  }
  @media (max-width: 700px) {
    .clash-pause-menu {
      width: calc(100vw - 1rem);
      max-height: calc(
        100dvh - max(8px, env(safe-area-inset-top)) - max(8px, env(safe-area-inset-bottom))
      );
      top: env(safe-area-inset-top);
      bottom: env(safe-area-inset-bottom);
    }
    .pause-heading {
      padding: 0.9rem 1rem;
    }
    h2 {
      font-size: 2.3rem;
    }
    .pause-layout {
      grid-template-columns: 1fr;
      min-height: 0;
    }
    nav {
      flex-direction: row;
      padding: 0.6rem;
      border-right: 0;
      border-bottom: 1px solid #ffffff18;
      overflow-x: auto;
    }
    nav button {
      flex: 0 0 auto;
      min-height: 44px;
      padding: 0.55rem 0.65rem;
      white-space: nowrap;
    }
    nav button small,
    nav button b {
      display: none;
    }
    .pause-content {
      max-height: calc(100dvh - 270px);
      padding: 1rem;
    }
    footer {
      padding: 0.8rem 1rem;
    }
    footer > span {
      display: none;
    }
    footer .pause-resume {
      width: 100%;
    }
  }
  @media (max-height: 500px) and (min-width: 701px) {
    .pause-heading {
      padding: 0.7rem 1.25rem;
    }
    h2 {
      font-size: 2rem;
    }
    .pause-layout {
      min-height: 0;
    }
    .pause-content {
      max-height: calc(88dvh - 165px);
    }
    nav {
      padding-block: 0.5rem;
    }
    nav button {
      min-height: 35px;
      padding-block: 0.4rem;
    }
    footer {
      padding: 0.6rem 1.25rem;
    }
  }
  @media (orientation: landscape) and (max-height: 600px) {
    .clash-pause-menu[open] {
      display: flex;
      flex-direction: column;
      width: calc(100vw - max(16px, env(safe-area-inset-left) + env(safe-area-inset-right)));
      height: calc(
        100dvh - max(8px, env(safe-area-inset-top)) - max(8px, env(safe-area-inset-bottom))
      );
      top: env(safe-area-inset-top);
      bottom: env(safe-area-inset-bottom);
      max-height: none;
    }
    .pause-heading {
      flex: 0 0 auto;
      padding: 4px 12px;
      min-height: 44px;
    }
    .pause-heading p,
    footer > span {
      display: none;
    }
    h2 {
      font-size: 1.5rem;
    }
    .pause-layout {
      flex: 1;
      min-height: 0;
      grid-template-columns: 160px minmax(0, 1fr);
      overflow: hidden;
    }
    nav {
      flex-direction: column;
      overflow-y: auto;
      padding: 4px;
      border-right: 1px solid #ffffff18;
    }
    nav button {
      min-height: 44px;
      padding: 8px;
      white-space: normal;
    }
    nav button small,
    nav button b {
      display: none;
    }
    .pause-content {
      max-height: none;
      overflow-y: auto;
      padding: 12px;
    }
    footer {
      flex: 0 0 auto;
      padding: 6px 12px;
    }
    footer .pause-resume {
      min-height: 44px;
      width: 100%;
    }
  }
</style>
