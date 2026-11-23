<script lang="ts">
  import { onMount } from 'svelte'
  import FightAudioSettings from './FightAudioSettings.svelte'
  import { sharedAudioContext } from '$lib/audio/context'
  import {
    createFightAudioDirector,
    DEFAULT_FIGHT_AUDIO,
    type FightAudioDirector,
  } from '$lib/fighting/audio/director'
  import { preloadFightSpeech } from '$lib/fighting/audio/speechSamples'
  import { readFightAudioSettings, saveFightAudioSettings } from '$lib/fighting/audio/settings'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en' = 'fr'
  export let paused = false
  export let viewer: FightSide = 'player'
  export let audioSeek = 0

  let director: FightAudioDirector | null = null
  export let settings = { ...DEFAULT_FIGHT_AUDIO }
  export let showSettings = true
  let hidden = false
  let mounted = false
  let unavailable = false

  $: if (mounted)
    director?.update(state, {
      paused: paused || hidden,
      settings,
      viewer,
      seek: audioSeek,
      locale: language,
    })

  $: if (mounted) {
    const context = sharedAudioContext()
    if (context) preloadFightSpeech(context, language)
  }

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
      director?.update(state, { paused, settings, viewer, seek: audioSeek, locale: language })
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

  onMount(() => {
    settings = readFightAudioSettings()
    hidden = document.hidden
    mounted = true
    const visibility = () => {
      hidden = document.hidden
      director?.update(state, {
        paused: paused || hidden,
        settings,
        viewer,
        seek: audioSeek,
        locale: language,
      })
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

{#if showSettings}<FightAudioSettings
    bind:settings
    {language}
    {unavailable}
    onChange={remember}
  />{/if}
