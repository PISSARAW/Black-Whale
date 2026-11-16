<script lang="ts">
  import type { ArcadeFighter } from '$lib/fighting/types'
  import { createPainPacker } from '$lib/fighting/feitanPain'
  import { chrolloHasActivePage } from '$lib/fighting/chrolloBook'

  export let fighter: ArcadeFighter
  export let language: 'fr' | 'en'

  $: pain = fighter.hatsuEffects.painPacker ?? createPainPacker()
  $: visible = fighter.id === 'feitan' || chrolloHasActivePage(fighter, 'feitan')
  $: preparation = fighter.id === 'chrollo' ? 'L' : 'H'
</script>

{#if visible && pain}
  <div class="pain-packer" class:burning={Boolean(pain.sun)}>
    {#if pain.sun}
      Rising Sun · {Math.ceil((pain.sun.duration - pain.sun.age) / 60)} s
      <span>{language === 'fr' ? 'Armure thermique active' : 'Thermal protection active'}</span>
    {:else if pain.armour}
      Pain Packer · {Math.round(pain.packedDamage)}
      <span>{preparation} · Rising Sun</span>
    {:else if pain.injuries > 0}
      {language === 'fr' ? 'Douleur' : 'Pain'} · {Math.round(pain.injuries)}
      <span>L · Pain Packer</span>
    {:else}
      Pain Packer
      <span>{language === 'fr' ? 'Une blessure est nécessaire' : 'Requires an injury'}</span>
    {/if}
  </div>
{/if}

<style>
  .pain-packer {
    margin-top: 0.35rem;
    color: #e5b6aa;
    font: 600 0.6rem/1.4 var(--font-mono);
    text-shadow: 0 1px 4px #000;
  }
  .pain-packer span {
    display: block;
    color: #d2c2b3;
  }
  .burning {
    color: #ffb25e;
  }
</style>
