<script lang="ts">
  import { onMount } from 'svelte'
  import { sharedAudioContext } from '$lib/audio/context'
  import { outputBus } from '$lib/audio/output'
  import { loadVoiceBank, type VoiceLocale } from '$lib/fighting/audio/speechSamples'
  import { createVictoryNarration } from '$lib/fighting/audio/victoryNarration'
  import type { FightAudioSettings } from '$lib/fighting/audio/settings'
  import type { VictoryFrame } from '$lib/fighting/victory/playback'

  export let frame: VictoryFrame | null
  export let settings: FightAudioSettings
  export let language: VoiceLocale = 'fr'
  export let paused = false
  export let speaking = false

  let hidden = false
  let mounted = false
  let narration: ReturnType<typeof createVictoryNarration> | undefined

  $: if (mounted)
    synchronize(frame, {
      locale: language,
      level: settings.description,
      stopped: paused || hidden || settings.muted,
    })

  function synchronize(
    current: VictoryFrame | null,
    options: { locale: VoiceLocale; level: number; stopped: boolean },
  ) {
    const { locale, level, stopped } = options
    if (level === 0 || stopped) return silence()
    const context = sharedAudioContext()
    if (!context) return silence()
    const bank = loadVoiceBank(context, locale, 'description')
    if (!current?.active || context.state !== 'running') return silence()
    if (!narration) {
      const output = outputBus('effects')
      if (!output) return
      narration = createVictoryNarration(context, output)
    }
    speaking = narration.update(current, { locale, volume: level, buffer: bank?.audio })
  }

  function silence() {
    narration?.stop()
    speaking = false
  }

  onMount(() => {
    const visibility = () => {
      hidden = document.hidden
    }
    visibility()
    mounted = true
    document.addEventListener('visibilitychange', visibility)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      narration?.dispose()
    }
  })
</script>
