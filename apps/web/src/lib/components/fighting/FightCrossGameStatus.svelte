<script lang="ts">
  import type { ArcadeFighter } from '$lib/fighting/types'
  export let fighter: ArcadeFighter
  export let language: 'fr' | 'en'
</script>

{#if fighter.crossGame}
  <div class="cross-game" role="status">
    {#if fighter.crossGame.phase === 'warning'}
      {language === 'fr'
        ? 'Carton jaune · « Ne bougez plus : ni déplacement, ni nouvelle attaque. » Restez immobile pour éviter l’entrave.'
        : 'Yellow card · “Do not move or start another attack.” Stay still to avoid restraint.'}
    {:else}
      {language === 'fr'
        ? 'Contrainte · ordre ignoré · parole libre'
        : 'Restraint · order ignored · speech remains free'}
      · {(fighter.hatsuEffects.restrainedFrames / 60).toFixed(1)} s
    {/if}
  </div>
{/if}

<style>
  .cross-game {
    color: #ffe08a;
    border-left: 2px solid #e8bc44;
    padding-left: 0.45rem;
    overflow-wrap: anywhere;
  }
</style>
