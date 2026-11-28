<script lang="ts">
  import { onMount } from 'svelte'
  import { sharedAudioContext } from '$lib/audio/context'
  import { audioLevels, outputBus } from '$lib/audio/output'
  import { victoryTrack } from '$lib/fighting/audio/victoryTrack'
  import type { VictoryFrame } from '$lib/fighting/victory/playback'
  import type { FightAudioSettings } from '$lib/fighting/audio/settings'

  export let frame: VictoryFrame | null
  export let settings: FightAudioSettings
  export let paused = false
  export let ducked = false
  let element: HTMLAudioElement
  let token = ''
  let fallback = false
  let hidden = false
  let source: MediaElementAudioSourceNode | undefined
  let gain: GainNode | undefined
  let waiting = false

  $: if (element)
    synchronize(frame, paused || hidden, { audio: settings, master: $audioLevels.effects, ducked })

  onMount(() => {
    const visibility = () => {
      hidden = document.hidden
    }
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      element?.pause()
      source?.disconnect()
      gain?.disconnect()
    }
  })

  function load(current: VictoryFrame) {
    waiting = true
    element.src = victoryTrack(current, fallback).url
    element.load()
  }

  function failed() {
    if (
      !frame?.active ||
      frame.token !== token ||
      fallback ||
      victoryTrack(frame).url === victoryTrack(frame, true).url
    )
      return
    fallback = true
    load(frame)
  }

  function connect() {
    const context = sharedAudioContext()
    const output = outputBus('effects')
    if (gain || !context || !output || context.state !== 'running') return
    gain = context.createGain()
    source = context.createMediaElementSource(element)
    source.connect(gain).connect(output)
    element.volume = 1
  }

  function level(audio: FightAudioSettings, master: number, trim: number) {
    if (!gain) {
      element.volume = Math.min(1, audio.cinematics * master * trim)
      return
    }
    gain.channelCount = audio.mono ? 1 : 2
    gain.channelCountMode = 'explicit'
    gain.gain.setTargetAtTime(audio.cinematics * trim, gain.context.currentTime, 0.025)
  }

  function synchronize(
    current: VictoryFrame | null,
    stopped: boolean,
    levels: { audio: FightAudioSettings; master: number; ducked: boolean },
  ) {
    const { audio, master } = levels
    if (!current?.active) {
      if (!current) token = ''
      element.pause()
      return
    }
    if (current.token !== token) {
      token = current.token
      fallback = false
      load(current)
    }
    connect()
    element.muted = audio.muted
    level(audio, master, victoryTrack(current, fallback).gain * (levels.ducked ? 0.3 : 1))
    if (!shouldPlay(current.elapsed, stopped || audio.muted)) {
      element.pause()
      return
    }
    if (Math.abs(element.currentTime - current.elapsed) > 0.22)
      element.currentTime = current.elapsed
    if (element.paused) void element.play().catch(() => {})
  }

  function shouldPlay(elapsed: number, stopped: boolean) {
    return !waiting && !stopped && elapsed > 0 && elapsed < element.duration
  }

  function loaded() {
    waiting = false
    synchronize(frame, paused || hidden, { audio: settings, master: $audioLevels.effects, ducked })
  }
</script>

<audio bind:this={element} preload="none" onloadedmetadata={loaded} onerror={failed}></audio>
