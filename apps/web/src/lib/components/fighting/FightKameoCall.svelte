<script lang="ts">
  import FightHeldButton from './FightHeldButton.svelte'
  import type { FightInput, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let onControl: (key: keyof FightInput, held: boolean) => void
</script>

{#if state.kameos?.player}
  <FightHeldButton
    label={language === 'fr' ? 'Appeler le kaméo' : 'Call kameo'}
    onHold={(held) => onControl('kameo', held)}
    >{language === 'fr' ? 'Kaméo' : 'Kameo'}</FightHeldButton
  >
{/if}
