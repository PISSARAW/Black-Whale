<script lang="ts">
  import { onMount } from 'svelte'
  import { sharedAudioContext } from '$lib/audio/context'
  import { outputBus } from '$lib/audio/output'
  import { CLASH_MENU_MUSIC, createClashMusic } from '$lib/fighting/audio/clashMusic'
  import { readFightAudioSettings } from '$lib/fighting/audio/settings'

  onMount(() => {
    const audioContext = sharedAudioContext()
    const bus = outputBus('ambient')
    if (!audioContext || !bus) return
    const context = audioContext
    const volume = context.createGain()
    volume.connect(bus)
    const music = createClashMusic(context, CLASH_MENU_MUSIC)
    let mounted = true

    function synchronize() {
      if (!mounted) return
      const settings: { muted: boolean; ambience: number; music?: number; mono?: boolean } =
        readFightAudioSettings()
      const level = settings.music ?? settings.ambience
      const audible = !document.hidden && !settings.muted && level > 0
      volume.channelCount = settings.mono ? 1 : 2
      volume.channelCountMode = 'explicit'
      volume.gain.setTargetAtTime(level * 0.55, context.currentTime, 0.025)
      music.setTarget(audible && context.state === 'running' ? volume : null)
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

    synchronize()
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
      music.dispose()
      setTimeout(() => volume.disconnect(), 30)
    }
  })
</script>
