<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'

  type Props = Omit<ComponentProps<typeof TourScene>, 'nenAvailability'> & {
    active: boolean
    duelling: boolean
  }

  let {
    active,
    duelling,
    tierId = $bindable(),
    position = $bindable(),
    heading = $bindable(),
    currentSpace = $bindable(),
    engaged = $bindable(),
    ...scene
  }: Props = $props()

  let nenAvailability = $derived(
    duelling
      ? {
          ren: 'Le duel contrôle Ren via Ken.',
          en: 'En est interrompu au contact.',
          shu: 'Aucun objet libre pendant le duel.',
          on: 'On n’est pas maîtrisé dans ce contrat.',
          action: 'F frappe pendant le duel.',
        }
      : {
          gyo: 'Gyo exige un adversaire engagé.',
          in: 'In exige un duel dans ce mode.',
          ken: 'Ken exige un adversaire engagé.',
          ko: 'Ko exige une cible de duel.',
          ryu: 'Ryu exige une cible de duel.',
          on: 'On n’est pas maîtrisé dans ce contrat.',
          action: 'Visez un objet imprégnable.',
        },
  )
</script>

<!-- The opaque briefing needs no WebGL scene competing with its controls. -->
{#if active}
  <TourScene
    {...scene}
    bind:tierId
    bind:position
    bind:heading
    bind:currentSpace
    bind:engaged
    {nenAvailability}
  />
{/if}
