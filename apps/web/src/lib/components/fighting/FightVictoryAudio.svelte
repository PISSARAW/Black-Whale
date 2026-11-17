<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { VictoryFrame } from '$lib/fighting/victory/playback'
  import type { FightAudioSettings } from '$lib/fighting/audio/director'
  export let frame: VictoryFrame | null
  export let settings: FightAudioSettings
  export let paused = false
  let element: HTMLAudioElement
  let token = ''
  let hidden = false
  $: if (element) synchronize(frame, paused || hidden, settings)
  onMount(() => {
    const visibility = () => {
      hidden = document.hidden
    }
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  })
  function synchronize(current: VictoryFrame | null, stopped: boolean, audio: FightAudioSettings) {
    if (!element) return
    if (!current?.active) {
      element.pause()
      return
    }
    if (current.token !== token) {
      token = current.token
      element.src = `/clash-victories/${current.variant ?? current.fighter}.m4a`
      element.load()
    }
    element.muted = audio.muted
    element.volume = Math.max(0, Math.min(1, audio.effects))
    if (Math.abs(element.currentTime - current.elapsed) > 0.3) element.currentTime = current.elapsed
    if (stopped || current.elapsed === 0) element.pause()
    else if (element.paused) void element.play().catch(() => {})
  }
  onDestroy(() => {
    element?.pause()
  })
</script>

<audio bind:this={element} preload="none"></audio>
