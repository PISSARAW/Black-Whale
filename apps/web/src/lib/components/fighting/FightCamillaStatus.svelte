<script lang="ts">
  import type { ArcadeFighter } from '$lib/fighting/types'
  export let fighter: ArcadeFighter
  export let language: 'fr' | 'en'
</script>

{#if fighter.id === 'camilla'}
  <div class="camilla-status">
    <strong
      >Cat’s Name · {language === 'fr'
        ? 'automatique après sa mort'
        : 'automatic after death'}</strong
    >
    <span
      >{language === 'fr'
        ? 'Le chat capture un meurtrier vivant et absorbe sa vie pour la ressusciter.'
        : 'The cat captures a living killer and absorbs their life to revive her.'}</span
    >
    <span
      >{language === 'fr'
        ? 'U : pistolet réel · points, temps et TKO : aucune résurrection.'
        : 'U: real pistol · points, time and TKO: no resurrection.'}</span
    >
  </div>
{/if}

<style>
  .camilla-status {
    display: grid;
    gap: 0.25rem;
    min-width: 0;
    overflow-wrap: anywhere;
    color: #d4c8de;
    font: 600 0.75rem/1.45 var(--font-mono);
  }
  strong {
    color: #f0d89c;
  }
</style>
