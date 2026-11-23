<script lang="ts">
  import { onMount } from 'svelte'
  import { sharedAudioContext } from '$lib/audio/context'
  import { outputBus } from '$lib/audio/output'
  import { get } from 'svelte/store'
  import { jukeboxPreview } from '$lib/fighting/audio/jukebox'
  import { clashTrackUrl, createClashMusic } from '$lib/fighting/audio/clashMusic'
  import { fightAudioChanges, readFightAudioSettings } from '$lib/fighting/audio/settings'

  onMount(() => {
    const audioContext = sharedAudioContext()
    const bus = outputBus('ambient')
    if (!audioContext || !bus) return
    const context = audioContext
    const volume = context.createGain()
    volume.connect(bus)
    let music: ReturnType<typeof createClashMusic> | undefined
    let track: string | undefined
    let mounted = true

    function selectTrack(next: string | undefined) {
      if (next === track) return
      music?.dispose()
      music = next ? createClashMusic(context, next) : undefined
      track = next
    }

    function synchronize() {
      if (!mounted) return
      const settings = readFightAudioSettings()
      selectTrack(clashTrackUrl(get(jukeboxPreview) ?? settings.menuTrack, 'menu'))
      const level = settings.music
      const audible = !document.hidden && !settings.muted && level > 0
      volume.channelCount = settings.mono ? 1 : 2
      volume.channelCountMode = 'explicit'
      volume.gain.setTargetAtTime(level * 0.55, context.currentTime, 0.025)
      music?.setTarget(audible && context.state === 'running' ? volume : null)
    }

    function unlock() {
      if (document.hidden || readFightAudioSettings().muted) return
      if (context.state === 'running') synchronize()
      else
        void context
          .resume()
          .then(synchronize)
          .catch(() => {})
    }

    const cancelPreferences = fightAudioChanges.subscribe(synchronize)
    const cancelPreview = jukeboxPreview.subscribe(synchronize)
    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock)
    window.addEventListener('storage', synchronize)
    document.addEventListener('visibilitychange', synchronize)
    return () => {
      mounted = false
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('storage', synchronize)
      document.removeEventListener('visibilitychange', synchronize)
      cancelPreview()
      cancelPreferences()
      music?.dispose()
      setTimeout(() => volume.disconnect(), 30)
    }
  })
</script>
