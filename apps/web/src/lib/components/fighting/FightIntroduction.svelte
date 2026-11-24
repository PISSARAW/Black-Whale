<script lang="ts">
  import { onMount } from 'svelte'
  import { mountIntroClock } from '$lib/fighting/presentation/introClock'
  import { introShot, type IntroPlayback } from '$lib/fighting/presentation/introPlayback'
  import { introduction } from '$lib/fighting/presentation/ceremony'
  import { introDialogue } from '$lib/fighting/presentation/introDialogue'
  import { createIntroSpeech } from '$lib/fighting/audio/introSpeech'
  import { COMBAT_VOICE_RATES, type FightAudioSettings } from '$lib/fighting/audio/settings'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightState } from '$lib/fighting/types'
  export let playback: IntroPlayback
  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused = false
  export let settings: FightAudioSettings
  const speech = createIntroSpeech()
  let mounted = false
  let hidden = false
  $: frame = $playback
  $: shot = frame ? introShot(frame) : null
  $: actor = shot?.side ? fighterDefinition(state[shot.side].id) : null
  $: fr = language === 'fr'
  $: dialogue = state.phase === 'ready' ? introDialogue(state) : undefined
  $: if (mounted && frame && dialogue) {
    speech.update(frame, dialogue, {
      locale: language,
      level: settings.muted ? 0 : settings.voices,
      speed: COMBAT_VOICE_RATES[settings.voiceStyle],
      paused: paused || hidden,
    })
  } else speech.stop()
  onMount(() => {
    const visibility = () => (hidden = document.hidden)
    visibility()
    mounted = true
    const stopClock = mountIntroClock({
      playback,
      paused: () => paused,
      warming: () =>
        Boolean(
          frame &&
          dialogue &&
          !settings.muted &&
          settings.voices > 0 &&
          speech.warming(frame, dialogue, language),
        ),
    })
    document.addEventListener('visibilitychange', visibility)
    return () => {
      speech.stop()
      stopClock()
      document.removeEventListener('visibilitychange', visibility)
    }
  })
</script>

{#if frame && frame.mode !== 'off'}
  <div class="fight-introduction" class:paused data-intro-shot={shot?.side ?? 'ready'}>
    <div class="letterbox top">
      <span>CLASH / {String(state.roundNumber).padStart(2, '0')}</span>
    </div>
    {#if frame.waiting}
      <p class="signal" role="status">{fr ? 'Entrée en scène…' : 'Entering the arena…'}</p>
    {:else if actor && shot?.side}
      {#key `${frame.run}:${shot.side}`}
        <div class="actor" style={`--intro-accent:${actor.colour}`}>
          <span>{shot.side === 'player' ? 'P1' : 'P2'} / {fr ? actor.titleFr : actor.titleEn}</span>
          <h2>{actor.name}</h2>
          <p role="status">« {introduction(state, language, shot.side)} »</p>
        </div>
      {/key}
    {:else}
      <div class="signal" role="status">
        <span>{fr ? 'MANCHE' : 'ROUND'} {state.roundNumber}</span>
        <strong
          >{shot && shot.progress > 0.62
            ? fr
              ? 'COMBAT !'
              : 'FIGHT!'
            : fr
              ? 'PRÊTS ?'
              : 'READY?'}</strong
        >
      </div>
    {/if}
    <div class="letterbox bottom">
      <span
        >{fighterDefinition(state.player.id).name} <b>VS</b>
        {fighterDefinition(state.opponent.id).name}</span
      >
      <button type="button" onclick={playback.skip} disabled={paused}>
        {fr ? 'Passer' : 'Skip'} <kbd>↵</kbd>
      </button>
    </div>
  </div>
{/if}

<style>
  .fight-introduction {
    position: absolute;
    inset: 0;
    z-index: 20;
    color: #f4f0e8;
    background: linear-gradient(0deg, #05070be6, transparent 40%);
    pointer-events: auto;
  }
  .letterbox {
    position: absolute;
    left: 0;
    right: 0;
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 24px;
    background: #05070b;
    font: 600 10px/1.4 var(--font-display, sans-serif);
    letter-spacing: 0.16em;
  }
  .top {
    top: 0;
  }
  .bottom {
    bottom: 0;
  }
  b {
    color: #d7b875;
    margin: 0 10px;
  }
  .actor {
    position: absolute;
    bottom: 68px;
    left: 6%;
    right: 6%;
    border-left: 3px solid var(--intro-accent);
    padding-left: 18px;
    text-shadow: 0 2px 8px #000;
    animation: reveal 320ms ease-out both;
  }
  .actor span,
  .signal span {
    font: 600 11px/1.5 var(--font-display, sans-serif);
    letter-spacing: 0.14em;
  }
  h2 {
    margin: 4px 0 8px;
    font: 700 clamp(30px, 5vw, 64px)/1 var(--font-display, sans-serif);
    text-transform: uppercase;
  }
  p {
    margin: 0;
    font-size: clamp(13px, 1.5vw, 17px);
    max-width: 540px;
    line-height: 1.5;
  }
  .signal {
    position: absolute;
    inset: 35% 12px auto;
    text-align: center;
    text-shadow: 0 3px 20px #000;
    max-width: none;
  }
  .signal strong {
    display: block;
    font: 800 italic clamp(32px, 7vw, 76px)/1.3 var(--font-display, sans-serif);
    color: #efcf8c;
  }
  button {
    min-height: 36px;
    padding: 6px 12px;
    color: inherit;
    border: 1px solid #645943;
    background: #151719;
    font: inherit;
    cursor: pointer;
    white-space: nowrap;
  }
  button:focus-visible {
    outline: 2px solid #efcf8c;
    outline-offset: 3px;
  }
  kbd {
    margin-left: 8px;
  }
  .paused * {
    animation-play-state: paused;
  }
  @keyframes reveal {
    from {
      opacity: 0;
      transform: translateX(-14px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .actor {
      animation: none;
    }
  }
  @media (max-width: 500px) {
    .letterbox {
      padding: 6px 12px;
      font-size: 9px;
      letter-spacing: 0.04em;
    }
    .actor {
      bottom: 72px;
      padding-left: 12px;
    }
  }
</style>
