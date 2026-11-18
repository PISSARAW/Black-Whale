<script lang="ts">
  import { ownsBungeeGum } from '$lib/fighting/bungeeAccess'
  import { gumCommandReady, performGumNetworkCommand } from '$lib/fighting/bungeeCommands'
  import { gumNetwork, ownedGumLinks, selectedGumLink } from '$lib/fighting/bungeeNetwork'
  import { gumLimbLabel, gumLinkLabel } from '$lib/fighting/bungeeLabels'
  import { GUM_LIMBS, MAX_GUM_LINKS } from '$lib/fighting/bungeeTypes'
  import type { ArsenalCommand } from '$lib/fighting/retrospectiveTypes'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let paused = false
  export let onUse: (side: FightSide, command: ArsenalCommand) => void
  $: fr = language === 'fr'
  $: links = ownedGumLinks(state, side)
  $: selected = selectedGumLink(state, side)
  $: limb = gumNetwork(state).limbs[side] ?? 'hand-right'
  $: ready = !paused && gumCommandReady(state, side)
  $: objects = (state.battlefield?.entities ?? []).filter(
    (entry) =>
      entry.present &&
      entry.health > 0 &&
      entry.material === 'real' &&
      ['crate', 'needles', 'flute'].includes(entry.kind),
  )
  const anchors = ['floor-front', 'floor-back', 'ceiling'] as const
  const motions = [
    'gum-recall',
    'gum-propel',
    'gum-detach',
    'gum-prepare-throw',
    'gum-rethrow',
  ] as const
  const anchorLabels = {
    'floor-front': ['Sol devant', 'Floor ahead'],
    'floor-back': ['Sol derrière', 'Floor behind'],
    ceiling: ['Plafond / poutre', 'Ceiling / beam'],
  }
  $: motionLabels = {
    'gum-recall': ['Rappeler', 'Recall'],
    'gum-propel': ['Se propulser', 'Propel yourself'],
    'gum-detach': ['Détacher ce lien', 'Detach this link'],
    'gum-rethrow': ['Relancer l’objet rappelé', 'Rethrow recalled object'],
    'gum-prepare-throw': state[side].gumThrowReady
      ? ['Annuler la carte liée', 'Cancel linked card']
      : ['Lier la prochaine carte', 'Attach next card'],
  }
  function allowed(command: ArsenalCommand) {
    return ready && performGumNetworkCommand(state, side, command) !== state
  }
</script>

{#if ownsBungeeGum(state[side])}
  <fieldset class="gum-network" aria-label="Bungee Gum">
    <legend>Bungee Gum · {links.length}/{MAX_GUM_LINKS}</legend>
    <label>
      {fr ? 'Origine des prochaines attaches' : 'Source of new attachments'}
      <select
        value={limb}
        disabled={!ready}
        onchange={(event) => onUse(side, { action: 'gum-limb', target: event.currentTarget.value })}
      >
        {#each GUM_LIMBS as part (part)}<option value={part}>{gumLimbLabel(part, language)}</option
          >{/each}
      </select>
    </label>
    <label>
      {fr ? 'Attache active' : 'Active attachment'}
      <select
        value={selected?.id ?? ''}
        disabled={!ready || !links.length}
        onchange={(event) =>
          onUse(side, { action: 'gum-select', target: event.currentTarget.value })}
      >
        {#if !links.length}<option value="">{fr ? 'Aucune attache' : 'No attachment'}</option>{/if}
        {#each links as link (link.id)}<option value={link.id}
            >{gumLinkLabel(state, link, language)}</option
          >{/each}
      </select>
    </label>
    <div class="commands">
      {#each anchors as target (target)}
        <button
          type="button"
          disabled={!allowed({ action: 'gum-anchor', target })}
          onclick={() => onUse(side, { action: 'gum-anchor', target })}
          >{anchorLabels[target][fr ? 0 : 1]}</button
        >
      {/each}
      {#each objects as object, index (object.id)}
        <button
          type="button"
          disabled={!allowed({ action: 'gum-object', target: object.id })}
          onclick={() => onUse(side, { action: 'gum-object', target: object.id })}
          >{fr ? 'Attacher un objet du décor' : 'Attach scenery object'} {index + 1}</button
        >
      {/each}
      {#each motions as action (action)}
        <button
          type="button"
          disabled={!allowed({ action })}
          onclick={() => onUse(side, { action })}>{motionLabels[action][fr ? 0 : 1]}</button
        >
      {/each}
    </div>
    <small
      >{fr
        ? 'L : attacher au contact · → + L : rappeler · ← + L : se propulser vers l’attache active. Prépare une carte liée avant U. Les objets restent réels sous In.'
        : 'L: attach on contact · → + L: recall · ← + L: propel toward the active attachment. Prepare a linked card before U. Objects remain physical under In.'}</small
    >
  </fieldset>
{/if}

<style>
  .gum-network {
    min-width: 0;
    border: 1px solid #b879a2;
    padding: 0.6rem;
    display: grid;
    gap: 0.5rem;
  }
  label {
    display: grid;
    gap: 0.25rem;
  }
  select,
  button {
    min-height: 44px;
    color: #f7e5f1;
    background: #30213c;
    border: 1px solid #856a9a;
    padding: 0.4rem;
    max-width: 100%;
  }
  .commands {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  button:disabled,
  select:disabled {
    opacity: 0.45;
  }
  small {
    color: #d5bdcf;
  }
</style>
