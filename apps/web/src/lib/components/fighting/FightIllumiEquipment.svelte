<script lang="ts">
  import type { FightEnvironment } from '$lib/fighting/fightEnvironment'
  import type { FighterId, FightSide } from '$lib/fighting/types'
  export let environment: FightEnvironment
  export let player: FighterId
  export let opponent: FighterId
  export let language: 'fr' | 'en'
  export let onEnvironment: (next: FightEnvironment) => void

  function equipped(side: FightSide): boolean {
    return (
      environment.needleStock?.[side] ??
      ['illumi', 'machi'].includes(side === 'player' ? player : opponent)
    )
  }
  function change(side: FightSide, checked: boolean): void {
    onEnvironment({
      ...environment,
      needleStock: {
        player: equipped('player'),
        opponent: equipped('opponent'),
        [side]: checked,
      },
    })
  }
</script>

{#if [player, opponent].some((id) => ['illumi', 'machi', 'chrollo', 'kurapika'].includes(id))}
  <fieldset class="needle-equipment">
    <legend>{language === 'fr' ? 'Aiguilles physiques portées' : 'Physical needles carried'}</legend
    >
    {#each ['player', 'opponent'] as const as side (side)}
      <label
        ><input
          type="checkbox"
          checked={equipped(side)}
          onchange={(event) => change(side, event.currentTarget.checked)}
        />
        {side === 'player' ? 'P1' : 'P2'} · {language === 'fr'
          ? 'Stock d’aiguilles réelles'
          : 'Real needle stock'}</label
      >
    {/each}
    <small
      >{language === 'fr'
        ? 'Copier Needle People ou Nen Stitches ne fournit aucune aiguille.'
        : 'Copying Needle People or Nen Stitches supplies no needle.'}</small
    >
  </fieldset>
{/if}

<style>
  .needle-equipment {
    display: grid;
    gap: 0.5rem;
    min-width: 0;
    padding: 0.8rem;
    border: 1px solid #454156;
    color: #c8bce0;
  }
  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    overflow-wrap: anywhere;
  }
  small {
    color: #aab9c4;
  }
</style>
