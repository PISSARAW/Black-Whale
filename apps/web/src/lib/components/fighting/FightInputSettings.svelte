<script lang="ts">
  import {
    CONTROL_LABELS,
    CONTROL_KEYS,
    assignControlKey,
    defaultBindings,
    type ControlCommand,
  } from '$lib/fighting/fightInputBindings'
  import type { FightControls } from '../../../routes/fighting/fightingControls'
  export let controls: FightControls
  export let language: 'fr' | 'en'
  export let onEditing: () => void = () => {}
  const { bindings, devices } = controls
  let panel: HTMLDetailsElement
  let capture: ControlCommand | null = null
  let error = ''
  let tab: 'player' | 'opponent' | 'pad' = 'player'
  $: commands = (Object.keys(CONTROL_KEYS) as ControlCommand[]).filter(
    (command) => command.startsWith(tab) || (tab === 'player' && command === 'pause'),
  )
  const keyLabel = (key: string) => (key === ' ' ? (language === 'fr' ? 'Espace' : 'Space') : key)
  function bindKey(event: KeyboardEvent) {
    if (!capture) return
    event.preventDefault()
    event.stopPropagation()
    if (event.key === 'Escape') {
      capture = null
      error = ''
      return
    }
    const next = assignControlKey($bindings, capture, event.key)
    if (!next) {
      error =
        language === 'fr'
          ? 'Touche déjà utilisée ou réservée. Choisis une autre touche.'
          : 'Key already used or reserved. Choose another key.'
      return
    }
    controls.save(next)
    capture = null
    error = ''
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (panel?.open && !capture && event.key === 'Escape') {
      event.preventDefault()
      panel.open = false
    }
  }}
/>

<details
  bind:this={panel}
  class="input-settings"
  ontoggle={(event) => {
    if (!event.currentTarget.open) {
      capture = null
      error = ''
      event.currentTarget.querySelector('summary')?.blur()
    }
    onEditing()
  }}
>
  <summary>{language === 'fr' ? 'Commandes' : 'Controls'}</summary>
  <section
    data-fight-scroll
    aria-label={language === 'fr' ? 'Configuration des commandes' : 'Control settings'}
  >
    <nav aria-label={language === 'fr' ? 'Joueur et périphérique' : 'Player and device'}>
      {#each ['player', 'opponent', 'pad'] as value (value)}
        <button
          type="button"
          aria-pressed={tab === value}
          onclick={() => {
            tab = value as typeof tab
            capture = null
          }}
          >{value === 'player'
            ? 'P1'
            : value === 'opponent'
              ? 'P2'
              : language === 'fr'
                ? 'Manettes'
                : 'Gamepads'}</button
        >
      {/each}
      <button
        type="button"
        onclick={() => {
          panel.open = false
        }}>{language === 'fr' ? 'Fermer' : 'Close'}</button
      >
    </nav>
    {#if tab === 'pad'}
      <p>
        {language === 'fr'
          ? 'Manettes au format standard : appuie sur un bouton, puis relâche les commandes pour activer la manette.'
          : 'Standard gamepads: press a button, then release the controls to activate the gamepad.'}
      </p>
      {#each $devices.names as name, index (index)}<p>
          P{index + 1} · {name ||
            (language === 'fr' ? 'Aucune manette détectée' : 'No gamepad detected')}
        </p>{/each}
      {#if $devices.unsupported}<p role="status">
          {language === 'fr'
            ? 'Une manette sans disposition standard est détectée ; utilise le clavier ou une manette standard.'
            : 'A gamepad without a standard mapping was detected; use a keyboard or a standard gamepad.'}
        </p>{/if}
      <dl>
        <dt>{language === 'fr' ? 'Stick gauche / croix' : 'Left stick / D-pad'}</dt>
        <dd>{language === 'fr' ? 'Déplacement, saut, accroupi' : 'Move, jump, crouch'}</dd>
        <dt>A / B / X / Y</dt>
        <dd>
          {language === 'fr' ? 'Léger / lourd / Hatsu / tir' : 'Light / heavy / Hatsu / ranged'}
        </dd>
        <dt>LB / RB</dt>
        <dd>{language === 'fr' ? 'Garde / Aura' : 'Guard / Aura'}</dd>
        <dt>LT / RT</dt>
        <dd>
          {language === 'fr'
            ? 'Projection / ultime (Aura + RT : Emperor Time)'
            : 'Throw / finisher (Aura + RT: Emperor Time)'}
        </dd>
        <dt>Start / Back</dt>
        <dd>{language === 'fr' ? 'Lancer ou pause / parler' : 'Start or pause / speak'}</dd>
        <dt>L3 / R3</dt>
        <dd>{language === 'fr' ? 'Arène / Gyo' : 'Arena / Gyo'}</dd>
      </dl>
      <p>
        {language === 'fr'
          ? 'Les symboles indiquent les positions Xbox ; les boutons équivalents fonctionnent sur les autres manettes standard.'
          : 'Symbols describe Xbox positions; equivalent buttons work on other standard gamepads.'}
      </p>
    {:else}
      <p>
        {language === 'fr'
          ? 'Sélectionne une commande, puis appuie sur une touche. Échap annule. Les touches des techniques avancées et des secrets restent réservées.'
          : 'Select a command, then press a key. Escape cancels. Advanced-technique and secret keys remain reserved.'}
      </p>
      <div class="binding-grid">
        {#each commands as command (command)}
          <span>{CONTROL_LABELS[command][language === 'fr' ? 0 : 1]}</span>
          <button
            type="button"
            class:capturing={capture === command}
            onkeydown={bindKey}
            onclick={(event) => {
              capture = command
              error = ''
              onEditing()
              event.currentTarget.focus()
            }}
          >
            {capture === command
              ? language === 'fr'
                ? 'Appuie sur une touche…'
                : 'Press a key…'
              : keyLabel($bindings[command])}
          </button>
        {/each}
      </div>
      <button
        type="button"
        onclick={() => {
          controls.save(defaultBindings())
          capture = null
          error = ''
          onEditing()
        }}>{language === 'fr' ? 'Rétablir les touches par défaut' : 'Restore default keys'}</button
      >
    {/if}
    {#if error}<p role="alert">{error}</p>{/if}
  </section>
</details>

<style>
  .input-settings {
    position: static;
    color: #dce5ea;
    font: 600 0.8rem/1.5 var(--font-mono);
  }
  summary,
  button {
    min-height: 44px;
    border: 1px solid #495967;
    padding: 0.6rem 0.75rem;
    background: #14202a;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  summary {
    display: flex;
    align-items: center;
  }
  section {
    position: absolute;
    z-index: 60;
    right: 0;
    top: 100%;
    width: min(36rem, 90vw);
    max-height: 70vh;
    overflow-y: auto;
    border: 1px solid #697b89;
    padding: 1rem;
    background: #09131e;
    box-shadow: 0 12px 30px #0009;
  }
  nav {
    display: flex;
    gap: 0.5rem;
  }
  .binding-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(8rem, 1fr);
    gap: 0.4rem;
    align-items: center;
    margin-bottom: 1rem;
  }
  button[aria-pressed='true'],
  .capturing {
    border-color: #e2c576;
    color: #f6d985;
  }
  button:focus-visible,
  summary:focus-visible {
    outline: 2px solid #f6d985;
    outline-offset: 2px;
  }
  p {
    margin: 0.6rem 0;
    overflow-wrap: anywhere;
  }
  dl {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 0.45rem;
  }
  dd {
    margin: 0;
  }
</style>
