<script lang="ts">
  import { DEFAULT_FIGHT_AUDIO } from '$lib/fighting/audio/director'
  import {
    FIGHT_AUDIO_PRESETS,
    FIGHT_CHANNELS,
    saveFightAudioSettings,
  } from '$lib/fighting/audio/settings'
  const labels = {
    effects: ['Impacts et garde', 'Impacts and guard'],
    movement: ['Déplacements', 'Movement'],
    techniques: ['Techniques et Nen', 'Techniques and Nen'],
    voices: ['Voix des combattants', 'Fighter voices'],
    announcer: ['Voix de bord', 'Ship announcer'],
    commentary: ['Commentaire dynamique', 'Dynamic commentary'],
    description: ['Audiodescription des victoires', 'Victory audio description'],
    interface: ['Signaux de combat', 'Combat cues'],
    music: ['Musique', 'Music'],
    ambience: ['Ambiance du terrain', 'Stage ambience'],
    tension: ['Tension et tic-tac', 'Tension and ticking'],
    cinematics: ['Cinématiques', 'Cinematics'],
  } as const
  $: en = language === 'en' ? 1 : 0
  function preset(name: keyof typeof FIGHT_AUDIO_PRESETS) {
    settings = {
      ...FIGHT_AUDIO_PRESETS[name],
      muted: settings.muted,
      mono: settings.mono,
      menuTrack: settings.menuTrack,
      battleTrack: settings.battleTrack,
      voiceStyle: settings.voiceStyle,
    }
    remember()
  }
  export let settings = { ...DEFAULT_FIGHT_AUDIO }
  export let language: 'fr' | 'en'
  export let unavailable = false
  export let inline = false
  let open = inline
  $: if (inline) open = true
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
  <details bind:open>
    <summary onkeydown={controlKey}>{language === 'fr' ? 'Mixage' : 'Mix'}</summary>
    <div class="mix-panel">
      <div class="presets">
        <button type="button" onclick={() => preset('default')}>{en ? 'Default' : 'Défaut'}</button>
        <button type="button" onclick={() => preset('competitive')}
          >{en ? 'Competition' : 'Compétition'}</button
        >
        <button type="button" onclick={() => preset('accessible')}
          >{en ? 'Accessibility' : 'Accessibilité'}</button
        >
      </div>
      <label class="mono">
        <input
          type="checkbox"
          checked={settings.mono}
          onchange={(event) => {
            settings = { ...settings, mono: event.currentTarget.checked }
            remember()
          }}
          onkeydown={controlKey}
        />
        Mono
      </label>
      <label>
        {en ? 'Voice register' : 'Registre des voix'}
        <select
          value={settings.voiceStyle}
          onchange={(event) => {
            const style = event.currentTarget.value
            settings = {
              ...settings,
              voiceStyle: style === 'low' || style === 'clear' ? style : 'original',
            }
            remember()
          }}
        >
          <option value="original">{en ? 'Original' : 'Original'}</option>
          <option value="low">{en ? 'Deep' : 'Grave'}</option>
          <option value="clear">{en ? 'Bright' : 'Clair'}</option>
        </select>
      </label>
      {#each FIGHT_CHANNELS as channel (channel)}
        <label>
          {labels[channel][en]}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings[channel]}
            onchange={(event) => {
              settings = { ...settings, [channel]: event.currentTarget.valueAsNumber }
              remember()
            }}
            onkeydown={controlKey}
          />
        </label>
      {/each}
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
  .presets,
  .mono {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }
  select {
    color: inherit;
    background: #101923;
    border: 1px solid #465664;
  }
  .mono input {
    width: auto;
  }
  .mix-panel {
    max-height: 65vh;
    overflow: auto;
  }
  .inline .mix-panel {
    max-height: none;
    overflow: visible;
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
