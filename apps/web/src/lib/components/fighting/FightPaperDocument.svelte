<script lang="ts">
  import { DOCUMENT_TEXT_LENGTH } from '$lib/fighting/paperDocumentTypes'
  import { documentById } from '$lib/fighting/paperDocuments'
  import { performArsenalCommand } from '$lib/fighting/retrospectiveArsenal'
  import { equippedDolphin } from '$lib/fighting/dolphinBorrowing'
  import FightArenaMap from './FightArenaMap.svelte'
  import type { ArsenalCommand } from '$lib/fighting/retrospectiveTypes'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let paused = false
  export let onUse: (side: FightSide, command: ArsenalCommand) => void
  let draft = ''
  $: selected =
    state[side].textureTarget === 'paper' && documentById(state, state[side].texturePaperId)
  $: reading = state[side].documentReading
  $: command = { action: 'texture-paper-text' as const, target: draft }
  $: canPrepare = selected && performArsenalCommand(state, side, command) !== state
  $: canPrepareLoan =
    selected &&
    Boolean(equippedDolphin(state[side])) &&
    performArsenalCommand(state, side, { ...command, loan: true }) !== state
</script>

{#if reading}
  <p role="status" class="paper-reading">
    {language === 'fr' ? 'Dernière lecture du papier' : 'Latest paper reading'} ·
    {Math.floor(reading.frame / 60)} s · {reading.text}
  </p>
{/if}
{#if reading?.arenaMap}
  <FightArenaMap map={reading.arenaMap} {language} />
{/if}

{#if selected}
  <label>
    Texture Surprise · {language === 'fr'
      ? 'Texte apparent sur la feuille'
      : 'Apparent text on the sheet'}
    <textarea
      bind:value={draft}
      maxlength={DOCUMENT_TEXT_LENGTH}
      onkeydown={(event) => event.stopPropagation()}
      onkeyup={(event) => event.stopPropagation()}></textarea>
  </label>
  <button
    type="button"
    disabled={paused || !canPrepare}
    onclick={() => onUse(side, { action: 'texture-paper-text', target: draft })}
  >
    {language === 'fr' ? 'Préparer ce texte apparent' : 'Prepare this apparent text'}
  </button>
  {#if equippedDolphin(state[side])}
    <button
      type="button"
      disabled={paused || !canPrepareLoan}
      onclick={() => onUse(side, { ...command, loan: true })}
    >
      {language === 'fr'
        ? 'Préparer ce texte apparent avec Dolphin'
        : 'Prepare this apparent text with Dolphin'}
    </button>
  {/if}
  <small
    >{language === 'fr'
      ? 'Appliquer ensuite Texture Surprise. L’encre d’origine reste sous l’apparence ; ceci ne prédit pas l’avenir.'
      : 'Then apply Texture Surprise. Original ink remains underneath the appearance; this does not predict the future.'}</small
  >
{/if}

<style>
  .paper-reading {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  label {
    display: grid;
    gap: 0.3rem;
  }
  textarea {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    min-height: 80px;
    color: inherit;
    background: #17101e;
    border: 1px solid #856a9a;
  }
  button {
    min-height: 44px;
    padding: 0.5rem;
    color: inherit;
    background: #30213c;
    border: 1px solid #856a9a;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  button:focus-visible,
  textarea:focus-visible {
    outline: 2px solid #ecd17b;
    outline-offset: 2px;
  }
  p,
  small {
    overflow-wrap: anywhere;
  }
</style>
