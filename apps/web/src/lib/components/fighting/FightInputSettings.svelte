<script lang="ts">
  import {
    CONTROL_LABELS,
    CONTROL_KEYS,
    assignControlKey,
    defaultBindings,
    physicalControlKey,
    controlKeyLabel,
    type ControlCommand,
  } from '$lib/fighting/fightInputBindings'
  import type { FightControls } from '../../../routes/fighting/fightingControls'
  import FightGamepadDiagnostics from './FightGamepadDiagnostics.svelte'
  import FightControlSchemeSetting from './FightControlSchemeSetting.svelte'
  import { RIGHT_STICK_ACTIONS, type RightStickLayout } from '$lib/fighting/directFightGamepad'
  export let controls: FightControls
  export let language: 'fr' | 'en'
  export let inline = false
  export let onEditing: () => void = () => {}
  const { bindings, devices, rightStickLayout, directionalZetsu } = controls
  const stickLabels: Record<RightStickLayout[number], [string, string]> = {
    ranged: ['Projectile', 'Projectile'],
    throw: ['Projection', 'Throw'],
    onIntent: ['On', 'On'],
    context: ['Contexte', 'Context'],
  }
  let panel: HTMLDetailsElement
  let capture: ControlCommand | null = null
  let error = ''
  let measurementRunning = false
  let tab: 'player' | 'opponent' | 'pad' = 'player'
  $: commands = (Object.keys(CONTROL_KEYS) as ControlCommand[]).filter(
    (command) => command.startsWith(tab) || (tab === 'player' && command === 'pause'),
  )
  const keyLabel = (key: string) => controlKeyLabel(key, language)
  function bindKey(event: KeyboardEvent) {
    if (!capture) return
    event.preventDefault()
    event.stopPropagation()
    if (event.key === 'Escape') {
      capture = null
      error = ''
      return
    }
    const next = assignControlKey($bindings, capture, physicalControlKey(event))
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
    if (panel?.open && !capture && !inline && event.key === 'Escape') {
      event.preventDefault()
      panel.open = false
    }
  }}
/>

<details
  bind:this={panel}
  class="input-settings"
  class:inline
  open={inline}
  ontoggle={(event) => {
    if (!event.currentTarget.open) {
      measurementRunning = false
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
      {#if !inline}
        <button
          type="button"
          onclick={() => {
            panel.open = false
          }}>{language === 'fr' ? 'Fermer' : 'Close'}</button
        >
      {/if}
    </nav>
    <FightControlSchemeSetting {controls} {language} />
    <label>
      <input
        type="checkbox"
        checked={$directionalZetsu}
        onchange={(event) => controls.saveDirectionalZetsu(event.currentTarget.checked)}
      />
      {language === 'fr'
        ? 'Compatibilité · Aura + Bas : Zetsu'
        : 'Compatibility · Aura + Down: Zetsu'}
    </label>
    {#if tab === 'pad'}
      <FightGamepadDiagnostics
        {language}
        layout={$rightStickLayout}
        bind:running={measurementRunning}
      />
      <p>
        {language === 'fr'
          ? 'Manettes standard : appuie puis relâche pour activer la manette. En versus local avec une seule manette, le clavier contrôle P1 et la manette P2.'
          : 'Standard gamepads: press and release to activate the controller. In local versus with one controller, keyboard controls P1 and gamepad controls P2.'}
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
          {language === 'fr'
            ? 'Léger / Lourd / Hatsu / Ultime'
            : 'Light / Heavy / Hatsu / Finisher'}
        </dd>
        <dt>LB / RB</dt>
        <dd>
          {language === 'fr' ? 'Garde / Kaméo' : 'Guard / Kameo'}
        </dd>
        <dt>LT / RT</dt>
        <dd>Burst / Aura</dd>
        <dt>Start</dt>
        <dd>{language === 'fr' ? 'Lancer ou pause' : 'Start or pause'}</dd>
      </dl>
      <div class="binding-grid">
        {#each ['←', '→', '↑', '↓'] as direction, index (direction)}
          <label>
            {language === 'fr' ? 'Stick droit' : 'Right stick'}
            {direction}
            <select
              value={$rightStickLayout[index]}
              onchange={(event) =>
                controls.swapStickAction(
                  index,
                  event.currentTarget.value as RightStickLayout[number],
                )}
            >
              {#each RIGHT_STICK_ACTIONS as action (action)}
                <option value={action}>{stickLabels[action][language === 'fr' ? 0 : 1]}</option>
              {/each}
            </select>
          </label>
        {/each}
      </div>
      <p>
        {language === 'fr'
          ? 'Les symboles indiquent les positions Xbox ; les boutons équivalents fonctionnent sur les autres manettes standard.'
          : 'Symbols describe Xbox positions; equivalent buttons work on other standard gamepads.'}
      </p>
    {:else}
      <p>
        {language === 'fr'
          ? 'Sélectionne une commande, puis appuie sur une touche. Échap annule. Les lettres doubles indiquent les positions AZERTY / QWERTY. P ouvre toujours la pause.'
          : 'Select a command, then press a key. Escape cancels. Paired letters show AZERTY / QWERTY positions. P always opens pause.'}
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
  .inline > summary {
    display: none;
  }
  .inline section {
    position: static;
    width: auto;
    max-height: none;
    border: 0;
    padding: 0;
    background: transparent;
    box-shadow: none;
  }
  .inline nav {
    flex-wrap: wrap;
  }
  .inline .binding-grid {
    grid-template-columns: minmax(0, 1fr) minmax(6rem, 1fr);
  }
</style>
