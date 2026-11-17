<script lang="ts">
  import { DEFAULT_FIGHT_AUDIO } from '$lib/fighting/audio/director'
  import { saveFightAudioSettings } from '$lib/fighting/audio/settings'
  export let settings = { ...DEFAULT_FIGHT_AUDIO }
  export let language: 'fr' | 'en'
  export let unavailable = false
  export let inline = false
  export let onChange: () => void = () => saveFightAudioSettings(settings)
  const controlKey = (event: KeyboardEvent) => {
    if (!inline) event.stopPropagation()
  }
  const remember = () => onChange()
</script>

<div class="fight-audio" class:inline>
  <button
    type="button"
    aria-pressed={!settings.muted}
    onkeydown={controlKey}
    onclick={() => {
      settings = { ...settings, muted: !settings.muted }
      remember()
    }}
  >
    {language === 'fr' ? 'Son' : 'Sound'} · {settings.muted
      ? language === 'fr'
        ? 'Coupé'
        : 'Off'
      : language === 'fr'
        ? 'Activé'
        : 'On'}
  </button>
  <details open={inline}>
    <summary onkeydown={controlKey}>{language === 'fr' ? 'Mixage' : 'Mix'}</summary>
    <div class="mix-panel">
      <label
        >{language === 'fr' ? 'Coups et techniques' : 'Strikes and techniques'}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          bind:value={settings.effects}
          onchange={remember}
          onkeydown={controlKey}
        />
      </label>
      <label
        >{language === 'fr' ? 'Ambiance du stage' : 'Stage ambience'}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          bind:value={settings.ambience}
          onchange={remember}
          onkeydown={controlKey}
        />
      </label>
      <label
        >{language === 'fr' ? 'Tension et tic-tac' : 'Tension and ticking'}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          bind:value={settings.tension}
          onchange={remember}
          onkeydown={controlKey}
        />
      </label>
    </div>
  </details>
  {#if unavailable}<span>{language === 'fr' ? 'Audio indisponible' : 'Audio unavailable'}</span
    >{/if}
</div>

<style>
  .fight-audio {
    position: relative;
    z-index: 45;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: fit-content;
    min-height: 2.5rem;
    padding: 0.3rem 0.65rem;
    color: #c6d4dc;
    background: #0a1017;
    font: 500 0.68rem/1.4 var(--font-mono);
  }
  button,
  summary {
    cursor: pointer;
    color: inherit;
  }
  button {
    border: 1px solid #3a4c59;
    border-radius: 2px;
    background: #111d26;
    padding: 0.3rem 0.6rem;
    font: inherit;
  }
  button[aria-pressed='true'] {
    color: #ecd088;
    border-color: #8b7541;
  }
  button:focus-visible,
  summary:focus-visible,
  input:focus-visible {
    outline: 2px solid #ecd088;
    outline-offset: 3px;
  }
  .mix-panel {
    position: absolute;
    top: 100%;
    left: 0;
    display: grid;
    gap: 0.65rem;
    width: min(18rem, 80vw);
    padding: 0.9rem;
    border: 1px solid #3a4c59;
    background: #0a1017;
    box-shadow: 0 12px 30px #0009;
  }
  label {
    display: grid;
    gap: 0.35rem;
  }
  input {
    width: 100%;
    accent-color: #d2b56e;
  }
  .inline {
    display: grid;
    width: 100%;
    padding: 1rem 0 0;
    background: transparent;
    gap: 1rem;
  }
  .inline .mix-panel {
    position: static;
    width: auto;
    padding: 1rem 0;
    border: 0;
    background: transparent;
    box-shadow: none;
  }
  .inline :global(summary) {
    min-height: 44px;
    display: flex;
    align-items: center;
  }
</style>
