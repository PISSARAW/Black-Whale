<script lang="ts">
  import { configureHuntAudio, enableHuntAudio, huntAudioState } from '$lib/hunt/audio'

  interface Props { locale: string }
  let { locale }: Props = $props()
  let muted = $state(huntAudioState().muted)
  const label = () => locale === 'fr' ? (muted ? 'Activer le son' : 'Couper le son') : (muted ? 'Enable sound' : 'Mute sound')

  async function toggle() {
    if (muted) await enableHuntAudio()
    else configureHuntAudio({ muted: true })
    muted = !muted
  }
</script>

<button
  class="absolute right-3 top-3 z-30 grid min-h-11 min-w-11 place-items-center rounded-full border border-white/20 bg-black/70 text-white/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
  aria-label={label()}
  aria-pressed={!muted}
  onclick={toggle}
>{muted ? '♩' : '♫'}</button
>
