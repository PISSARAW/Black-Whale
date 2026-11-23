<script lang="ts">
  import { onMount } from 'svelte'
  import { newSoundRound } from '$lib/fighting/audio/events'
  import {
    retainSoundCaptions,
    soundCaptions,
    type SoundCaption,
    type TimedSoundCaption,
  } from '$lib/fighting/audio/soundCaptions'
  import { saiyuAudioEnabled } from '$lib/fighting/saiyuSenses'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused: boolean
  export let viewer: FightSide
  export let seek: number
  export let enabled: boolean

  interface Frame {
    state: FightState
    locale: 'fr' | 'en'
    viewer: FightSide
    seek: number
    active: boolean
  }

  let mounted = false
  let hidden = false
  let previous: Frame | undefined
  let timer: ReturnType<typeof setTimeout>
  let captions: TimedSoundCaption[] = []

  $: if (mounted)
    observe({ state, locale: language, viewer, seek, active: enabled && !paused && !hidden })

  function clear() {
    clearTimeout(timer)
    if (captions.length) captions = []
  }

  function display(incoming: SoundCaption[]) {
    clearTimeout(timer)
    const now = performance.now()
    captions = retainSoundCaptions(captions, incoming, now)
    const expires = Math.min(...captions.map((cue) => cue.expires))
    if (captions.length) timer = setTimeout(() => display([]), Math.max(1, expires - now))
  }

  function observe(frame: Frame) {
    const last = previous
    previous = frame
    if (!frame.active || !saiyuAudioEnabled(frame.state, frame.viewer)) return clear()
    if (!last?.active || audienceChanged(last, frame)) return clear()
    if (!saiyuAudioEnabled(last.state, last.viewer)) return
    if (newSoundRound(last.state, frame.state)) clear()
    const lines = soundCaptions(last.state, frame.state, frame)
    if (lines.length) display(lines)
  }

  function audienceChanged(before: Frame, after: Frame) {
    return (
      before.seek !== after.seek || before.viewer !== after.viewer || before.locale !== after.locale
    )
  }

  onMount(() => {
    const visibility = () => (hidden = document.hidden)
    visibility()
    mounted = true
    document.addEventListener('visibilitychange', visibility)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', visibility)
    }
  })
</script>

{#if enabled}
  <div
    class="sound-captions"
    aria-label={language === 'fr' ? 'Sous-titres des sons de combat' : 'Combat sound captions'}
  >
    {#each captions as caption (caption.text)}
      <span class:announcement={caption.priority === 3}>{caption.text}</span>
    {/each}
  </div>
{/if}

<style>
  .sound-captions {
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 0.1rem;
    min-height: 3.35rem;
    padding: 0.2rem 0.65rem;
    background: #0a1017;
    color: #fff2d9;
    font:
      600 max(0.82rem, var(--hud-font, 0.82rem)) / 1.3 system-ui,
      sans-serif;
    text-align: center;
  }
  .announcement {
    color: #f7da97;
  }
</style>
