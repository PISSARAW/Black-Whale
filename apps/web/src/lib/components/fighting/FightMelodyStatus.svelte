<script lang="ts">
  import { canHear, MELODY_LISTEN_FRAMES } from '$lib/fighting/melodyRules'
  import type { FightState, FightSide } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  $: fighter = state[side]
  $: read = fighter.melodyHearing
  $: privateRead = side === 'player' || state.mode === 'versus-local'
</script>

{#if fighter.melodyPerformance}
  <div class="music" role="status">
    ♫ {fighter.melodyPerformance.startupFrames > 0
      ? language === 'fr'
        ? 'Flûte · préparation'
        : 'Flute · preparing'
      : language === 'fr'
        ? 'Flûte · performance continue'
        : 'Flute · performing'}
  </div>
{/if}
{#if fighter.hatsuEffects.entrancedFrames > 0}
  <div class="music">
    {language === 'fr'
      ? 'Attention captée · couvrez vos oreilles pour agir'
      : 'Attention absorbed · cover your ears to act'}
  </div>
{/if}
{#if fighter.coveringEars}
  <div>
    {language === 'fr'
      ? 'Oreilles couvertes · garde et attaques indisponibles'
      : 'Ears covered · guarding and attacks unavailable'}
  </div>
{/if}
{#if fighter.id === 'melody' && privateRead}
  <div class="hearing" role="status">
    {#if !canHear(fighter)}
      {language === 'fr' ? 'Ouïe interrompue' : 'Hearing interrupted'}
    {:else if read}
      ♥ {language === 'fr' ? 'Rythme adverse' : 'Opponent rhythm'} · {read.pulse === 'agitated'
        ? language === 'fr'
          ? 'accéléré'
          : 'agitated'
        : language === 'fr'
          ? 'régulier'
          : 'steady'} · {read.direction === 1 ? '→' : '←'}
      {#if read.acceleration}
        · {read.acceleration === 'sudden'
          ? language === 'fr'
            ? 'accélération brusque'
            : 'sudden acceleration'
          : language === 'fr'
            ? 'accélération progressive'
            : 'gradual acceleration'}
        · {language === 'fr'
          ? 'indice de stress · vérité indéterminée'
          : 'stress clue · truth unknown'}
      {/if}
      {#if read.threat === 'startup'}
        · {language === 'fr' ? 'attaque en préparation' : 'attack preparing'}{/if}
      {#if read.acceleration === 'sudden'}
        · {language === 'fr'
          ? 'accélération brusque · vérité indéterminée'
          : 'sudden acceleration · truth undetermined'}
      {/if}
      {#if read.frames >= MELODY_LISTEN_FRAMES}
        · {language === 'fr' ? 'tempo lu · parade +3f' : 'rhythm read · parry +3f'}{/if}
    {:else}
      {language === 'fr' ? 'À l’écoute' : 'Listening'}
    {/if}
  </div>
{/if}

<style>
  .music,
  .hearing {
    color: #b7e6d2;
    overflow-wrap: anywhere;
  }
  .hearing {
    border-left: 2px solid #70c6b0;
    padding-left: 0.45rem;
  }
</style>
