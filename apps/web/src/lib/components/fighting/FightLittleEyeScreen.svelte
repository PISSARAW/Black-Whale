<script lang="ts">
  import type { LittleEyeScreen } from '$lib/fighting/littleEyeTypes'
  import { fighterDefinition } from '$lib/fighting/roster'
  export let screen: LittleEyeScreen | undefined
  export let language: 'fr' | 'en'
</script>

{#if screen}
  <div role="status" aria-label="Little Eye">
    <strong
      >Little Eye · {language === 'fr' ? 'Vue et ouïe de l’animal' : 'Animal sight and hearing'} · {Math.floor(
        screen.frame / 60,
      )} s</strong
    >
    {#each screen.pictures as picture, index (index)}
      <p>
        {fighterDefinition(picture.appearance).name} · x {picture.x.toFixed(1)}{picture.projection
          ? ' · projection'
          : ''}{picture.auraVisible ? ' · aura' : ''}
      </p>
    {/each}
    {#each screen.words as word, index (index)}
      <p>{Math.floor(word.frame / 60)} s · « {word.text} »</p>
    {/each}
  </div>
{/if}
