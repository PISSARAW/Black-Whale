<script lang="ts">
  import { onMount } from 'svelte'
  import {
    easterEggsFor,
    eggBit,
    type EasterEggFighter,
    type EasterEggSlot,
  } from '$lib/fighting/easterEggCatalogue'
  import { canPerformEasterEgg } from '$lib/fighting/easterEggs'
  import {
    EASTER_EGG_KEYS,
    rememberEasterEggs,
    saveEasterEggPreferences,
    type EasterEggPreferences,
  } from '$lib/fighting/easterEggPreferences'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightSide, FightState } from '$lib/fighting/types'
  import FightEasterEggPreview from './FightEasterEggPreview.svelte'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let preferences: EasterEggPreferences
  export let paused = false
  export let onPlay: (side: FightSide, slot: EasterEggSlot) => void
  const sides = ['player', 'opponent'] as const
  let mounted = false
  let preview: { side: FightSide; slot: EasterEggSlot } | null = null
  let previousIdentity = ''
  $: identity = `${state.player.id}:${state.opponent.id}`
  $: if (identity !== previousIdentity) {
    previousIdentity = identity
    preview = null
  }
  $: if (mounted) remember(state, preferences)
  function remember(current: FightState, saved: EasterEggPreferences) {
    const next = rememberEasterEggs(saved, current)
    if (next !== saved) {
      preferences = next
      saveEasterEggPreferences(next)
    }
  }
  function changeKey(side: FightSide, key: string) {
    preferences = { ...preferences, keys: { ...preferences.keys, [side]: key } }
    saveEasterEggPreferences(preferences)
  }
  function discovered(mask: number, slot: EasterEggSlot) {
    return Boolean(mask & eggBit(slot))
  }
  onMount(() => {
    mounted = true
  })
</script>

{#if easterEggsFor(state.player.id).length || easterEggsFor(state.opponent.id).length}
  <details class="easter-eggs" data-fight-scroll>
    <summary
      >Easter Eggs · {language === 'fr' ? 'Gestes et secrets' : 'Gestures and secrets'}</summary
    >
    <p class="instructions">
      {language === 'fr'
        ? 'Touche seule : geste 1 · + avant : 2 · + arrière : 3 · + bas : secret. Terminer une scène pour la découvrir. Un coup l’interrompt.'
        : 'Key alone: gesture 1 · + forward: 2 · + back: 3 · + down: secret. Finish a scene to discover it. A hit interrupts it.'}
    </p>
    <div class="fighters">
      {#each sides as side (side)}
        {@const eggs = easterEggsFor(state[side].id)}
        {@const mask = preferences.discoveries[state[side].id as EasterEggFighter] ?? 0}
        {#if eggs.length}
          <section aria-label={`${fighterDefinition(state[side].id).name} · Easter Eggs`}>
            <h3>
              {side === 'player' ? 'P1' : 'P2'} · {fighterDefinition(state[side].id).name}
              <small>Secrets : {eggs.filter((egg) => discovered(mask, egg.slot)).length}/4</small>
            </h3>
            {#if side === 'player' || state.mode !== 'versus-ai'}
              <label
                >{language === 'fr' ? 'Touche' : 'Key'}
                <select
                  value={preferences.keys[side]}
                  onchange={(event) => changeKey(side, event.currentTarget.value)}
                >
                  {#each EASTER_EGG_KEYS as key (key)}
                    <option
                      value={key}
                      disabled={key === preferences.keys[side === 'player' ? 'opponent' : 'player']}
                      >{key}</option
                    >
                  {/each}
                </select>
              </label>
            {/if}
            <div
              class="egg-wheel"
              role="group"
              aria-label={language === 'fr' ? 'Choisir un geste' : 'Choose a gesture'}
            >
              {#each eggs as egg (egg.slot)}
                {@const known = discovered(mask, egg.slot)}
                <div class:known>
                  <button
                    type="button"
                    class="play"
                    disabled={paused ||
                      (side === 'opponent' && state.mode === 'versus-ai') ||
                      !canPerformEasterEgg(state, side, egg.slot)}
                    onclick={() => onPlay(side, egg.slot)}
                    aria-label={`${side === 'player' ? 'P1' : 'P2'} · ${egg.name[language]}`}
                  >
                    <span>{egg.slot === 4 ? '?' : egg.slot}</span>
                    {egg.slot === 4 && !known
                      ? language === 'fr'
                        ? 'Secret à découvrir'
                        : 'Undiscovered secret'
                      : egg.name[language]}
                    {#if known}<b aria-label={language === 'fr' ? 'Découvert' : 'Discovered'}>✓</b
                      >{/if}
                  </button>
                  <p>{egg.hint[language]}</p>
                  {#if known}
                    <button
                      type="button"
                      class="preview-button"
                      onclick={() => (preview = { side, slot: egg.slot })}
                    >
                      {language === 'fr' ? 'Aperçu' : 'Preview'} · {egg.name[language]}
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          </section>
        {/if}
      {/each}
    </div>
    {#if preview}
      <button type="button" class="close-preview" onclick={() => (preview = null)}
        >{language === 'fr' ? 'Fermer l’aperçu' : 'Close preview'}</button
      >
      {#key `${identity}:${preview.side}:${preview.slot}`}
        <FightEasterEggPreview
          fighterId={state[preview.side].id}
          opponentId={state[preview.side === 'player' ? 'opponent' : 'player'].id}
          slot={preview.slot}
          {language}
        />
      {/key}
    {/if}
  </details>
{/if}

<style>
  .easter-eggs {
    border: 1px solid #33414e;
    padding: 10px 12px;
    background: #0b141d;
    color: #ded9cd;
  }
  summary {
    cursor: pointer;
    color: #e3c58d;
    font-size: 0.85rem;
  }
  .instructions,
  .egg-wheel p {
    font-size: 0.75rem;
    color: #a9b7c6;
    line-height: 1.5;
  }
  .fighters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
    gap: 18px;
  }
  h3 {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin: 8px 0;
    font-size: 0.9rem;
  }
  small {
    font-size: 0.75rem;
    color: #cbb27d;
    white-space: nowrap;
  }
  label {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 0.75rem;
    margin-bottom: 10px;
  }
  select {
    background: #18222d;
    color: #f3e4c8;
    border: 1px solid #475467;
    padding: 4px 8px;
  }
  .egg-wheel {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .egg-wheel > div {
    border: 1px solid #2c3c4b;
    padding: 8px;
    min-width: 0;
  }
  .egg-wheel > .known {
    border-color: #776644;
  }
  button {
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  .play {
    display: flex;
    width: 100%;
    gap: 8px;
    align-items: center;
    background: #172636;
    color: #ecdfc4;
    border: 1px solid #506174;
    padding: 8px;
    min-height: 44px;
    text-align: left;
    font-size: 0.78rem;
  }
  .play:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .play span {
    color: #d8b87b;
    font-family: monospace;
  }
  .play b {
    margin-left: auto;
  }
  .preview-button,
  .close-preview {
    border: 0;
    background: transparent;
    color: #dec187;
    text-decoration: underline;
    padding: 4px 0;
    font-size: 0.7rem;
  }
  .close-preview {
    margin-top: 12px;
  }
  button:focus-visible,
  select:focus-visible {
    outline: 2px solid #e3c58d;
    outline-offset: 3px;
  }
  @media (max-width: 350px) {
    .egg-wheel {
      grid-template-columns: 1fr;
    }
  }
</style>
