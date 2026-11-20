<script lang="ts">
  import {
    HINRIGH_KIT_ITEMS,
    HINRIGH_KIT_SLOTS,
    HINRIGH_KIT_USERS,
    type HinrighKitItem,
  } from '$lib/fighting/hinrighKit'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightPreparation } from '$lib/fighting/preparationTypes'
  import type { FighterId, FightSide } from '$lib/fighting/types'

  export let preparation: FightPreparation
  export let fighters: Record<FightSide, FighterId>
  export let language: 'fr' | 'en'
  export let onChange: (preparation: FightPreparation) => void

  const SIDES: readonly FightSide[] = ['player', 'opponent']
  $: seats = SIDES.filter((side) => HINRIGH_KIT_USERS.includes(fighters[side]))

  function kitOf(side: FightSide): readonly HinrighKitItem[] | undefined {
    return preparation.hinrighKit?.[side]
  }
  function packed(side: FightSide, packedKit: boolean) {
    const kit = { ...preparation.hinrighKit }
    if (packedKit) kit[side] = ['handcuffs']
    else delete kit[side]
    onChange({ ...preparation, hinrighKit: Object.keys(kit).length ? kit : undefined })
  }
  function toggle(side: FightSide, item: HinrighKitItem, checked: boolean) {
    const current = kitOf(side) ?? []
    const items = checked ? [...current, item] : current.filter((entry) => entry !== item)
    onChange({ ...preparation, hinrighKit: { ...preparation.hinrighKit, [side]: items } })
  }
</script>

{#if seats.length}
  <fieldset class="kit-setup">
    <legend
      >{language === 'fr'
        ? `Biohazard · inventaire matériel préparé avant le combat (${HINRIGH_KIT_SLOTS} objets)`
        : `Biohazard · physical inventory packed before the fight (${HINRIGH_KIT_SLOTS} items)`}</legend
    >
    <p>
      {language === 'fr'
        ? 'Chaque animal reste l’objet d’origine : mêmes limites, mêmes munitions, destructible. Rien n’est créé ni rechargé.'
        : 'Each animal stays the original object: same limits, same ammunition, destructible. Nothing is created or reloaded.'}
    </p>
    {#each seats as side (side)}
      {@const kit = preparation.hinrighKit?.[side]}
      <div class="seat">
        <strong>P{side === 'player' ? 1 : 2} · {fighterDefinition(fighters[side]).name}</strong>
        <label
          ><input
            type="checkbox"
            checked={kit !== undefined}
            onchange={(event) => packed(side, event.currentTarget.checked)}
          />
          {language === 'fr' ? 'Préparer l’inventaire' : 'Pack the inventory'}</label
        >
        {#if kit}
          {#each HINRIGH_KIT_ITEMS as item (item.id)}
            {@const chosen = kit.includes(item.id)}
            <label
              ><input
                type="checkbox"
                checked={chosen}
                disabled={!chosen && kit.length >= HINRIGH_KIT_SLOTS}
                onchange={(event) => toggle(side, item.id, event.currentTarget.checked)}
              />
              {language === 'fr' ? item.fr : item.en}</label
            >
          {/each}
        {:else}
          <span
            >{fighters[side] !== 'hinrigh'
              ? language === 'fr'
                ? 'Aucun objet porté : une copie de Biohazard ne crée pas d’équipement.'
                : 'No carried object: a copy of Biohazard creates no equipment.'
              : language === 'fr'
                ? 'Dotation par défaut : menottes, caméra et émetteur portés.'
                : 'Default carried kit: handcuffs, camera and transmitter.'}</span
          >
        {/if}
      </div>
    {/each}
  </fieldset>
{/if}

<style>
  .kit-setup {
    display: grid;
    gap: 0.5rem;
  }
  .seat {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    align-items: center;
  }
  label {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
    min-height: 44px;
  }
  p {
    margin: 0;
  }
</style>
