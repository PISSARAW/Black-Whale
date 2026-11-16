<script lang="ts">
  import { onMount } from 'svelte'
  import { sharedAudioContext } from '$lib/audio/context'
  import {
    createFightAudioDirector,
    DEFAULT_FIGHT_AUDIO,
    type FightAudioDirector,
  } from '$lib/fighting/audio/director'
  import { readFightAudioSettings, saveFightAudioSettings } from '$lib/fighting/audio/settings'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en' = 'fr'
  export let paused = false
  export let viewer: FightSide = 'player'

  let director: FightAudioDirector | null = null
  let settings = { ...DEFAULT_FIGHT_AUDIO }
  let hidden = false
  let mounted = false
  let unavailable = false

  $: if (mounted) director?.update(state, { paused: paused || hidden, settings, viewer })

  function unlock(): void {
    if (settings.muted || hidden) return
    const context = sharedAudioContext()
    if (!context) {
      unavailable = true
      return
    }
    const start = () => {
      if (!mounted || hidden || settings.muted) return
      director ??= createFightAudioDirector(state)
      director?.update(state, { paused, settings, viewer })
    }
    if (context.state === 'suspended')
      void context
        .resume()
        .then(start)
        .catch(() => {})
    else start()
  }

  function remember(): void {
    saveFightAudioSettings(settings)
    if (!settings.muted) unlock()
  }

  const controlKey = (event: KeyboardEvent) => event.stopPropagation()

  onMount(() => {
    settings = readFightAudioSettings()
    hidden = document.hidden
    mounted = true
    const visibility = () => {
      hidden = document.hidden
      director?.update(state, { paused: paused || hidden, settings, viewer })
    }
    if (sharedAudioContext()?.state === 'running') unlock()
    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      mounted = false
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      document.removeEventListener('visibilitychange', visibility)
      director?.dispose()
      director = null
    }
  })
</script>

<div class="fight-audio">
  <button
    type="button"
    aria-pressed={!settings.muted}
    onkeydown={controlKey}
    onclick={() => {
      settings = { ...settings, muted: !settings.muted }
      remember()
    }}
  >
    {language === 'fr' ? 'Son' : 'Sound'} · {settings.muted ? 'OFF' : 'ON'}
  </button>
  <details>
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
</style>
