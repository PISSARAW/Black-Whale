<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import TourComfortPanel from './TourComfortPanel.svelte'
  import TourControlsPanel from './TourControlsPanel.svelte'
  import TourHatsuHud from './TourHatsuHud.svelte'
  import TourProvenancePanel from './TourProvenancePanel.svelte'
  import TourSidebarNavigation from './TourSidebarNavigation.svelte'
  import { t } from '$lib/i18n'
  import { tourWords } from '$lib/tour/workspaceWords'
  import TourTargetIndex from './TourTargetIndex.svelte'

  interface Props {
    navigation: ComponentProps<typeof TourSidebarNavigation>
    hatsu: ComponentProps<typeof TourHatsuHud> | null
    targets: ComponentProps<typeof TourTargetIndex>
    controls: ComponentProps<typeof TourControlsPanel>
    calm: boolean
    provenance: ComponentProps<typeof TourProvenancePanel>
  }

  let { navigation, hatsu, targets, controls, calm, provenance }: Props = $props()
  let section = $state('settings')
  const sections = $derived([
    { id: 'settings', label: $tourWords.settings },
    { id: 'activity', label: hatsu ? 'Nen' : $tourWords.places },
    { id: 'help', label: $tourWords.help },
    { id: 'sources', label: $tourWords.sources },
  ])
</script>

<div class="panel-content">
  <nav class="section-nav" aria-label={$tourWords.options}>
    {#each sections as item (item.id)}
      <button type="button" aria-pressed={section === item.id} onclick={() => (section = item.id)}
        >{item.label}</button
      >
    {/each}
  </nav>
  {#if section === 'settings'}
    <TourComfortPanel {calm} expanded />
  {:else if section === 'activity'}
    {#if hatsu}<TourHatsuHud {...hatsu} />{/if}
    <TourTargetIndex {...targets} />
  {:else if section === 'help'}
    <TourControlsPanel {...controls} expanded />
  {:else}
    <div class="view-tools">
      <button
        type="button"
        onclick={navigation.onToggleReveal}
        aria-pressed={navigation.reveal}
        title={$t.tour.reveal.help}>{$t.tour.reveal.toggle} <kbd>L</kbd></button
      >
      <button type="button" onclick={navigation.onCopy}>
        {navigation.copied === 'done'
          ? $t.tour.viewpoint.copied
          : navigation.copied === 'failed'
            ? $t.tour.viewpoint.failed
            : $t.tour.viewpoint.copy}
      </button>
    </div>
    <TourProvenancePanel {...provenance} expanded />
  {/if}
</div>

<style>
  .panel-content {
    display: grid;
    gap: 1rem;
    padding: 1rem;
  }
  .section-nav {
    display: flex;
    gap: 0.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--line-default);
  }
  .section-nav button {
    flex: 1;
    min-height: 44px;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  .section-nav button[aria-pressed='true'] {
    background: #272318;
    color: var(--accent-gold-bright);
  }
  .section-nav button:hover {
    background: #1d1e22;
  }
  .view-tools {
    display: grid;
    gap: 0.5rem;
  }
  .view-tools button {
    min-height: 44px;
    padding: 0.6rem;
    border: 1px solid var(--line-default);
    border-radius: 4px;
    text-align: left;
    font-size: 0.8rem;
  }
  .view-tools button[aria-pressed='true'] {
    color: var(--accent-gold-bright);
  }
  kbd {
    float: right;
    opacity: 0.6;
  }
</style>
