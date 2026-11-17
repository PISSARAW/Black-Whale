<script lang="ts">
  import { fightTouchBindings } from '$lib/fighting/fightTouchHints'
  import { GUARD_LABELS } from '$lib/fighting/combatProperties'
  import { moveById } from '$lib/fighting/movesets'
  import type { FighterMove } from '$lib/fighting/movesetTypes'
  import { useFightBindings, moveInputHint } from '$lib/fighting/fightControlHints'
  const bindings = useFightBindings()
  export let touch = false
  export let move: FighterMove
  export let language: 'fr' | 'en'
  $: hints = touch ? fightTouchBindings(language) : $bindings
  $: guard = GUARD_LABELS[move.guard][language === 'fr' ? 0 : 1]
  $: blockRoutes = move.cancelOnBlockInto
    .map((id) => {
      const target = moveById(id)
      return language === 'fr' ? target?.nameFr : target?.nameEn
    })
    .join(' → ')
  $: hitRoutes = move.cancelWindow ? move.cancelInto.map((id) => moveById(id)).filter(Boolean) : []
  $: links = (move.linkInto ?? []).map((id) => moveById(id)).filter(Boolean)
</script>

{#if move.tuning.damage > 0 || move.category === 'throw'}
  <small class="move-properties">
    {guard}
    {#if move.canHitDowned}
      · {language === 'fr' ? 'Touche au sol' : 'Hits downed targets'}{/if}
    {#if blockRoutes}
      · {language === 'fr' ? 'Cancel sur garde' : 'Block cancel'} : {blockRoutes}{/if}
    {#if hitRoutes.length}
      · {language === 'fr' ? 'Cancel sur touche' : 'Hit cancel'} :
      {hitRoutes.map((target) => moveInputHint(target!.input, hints)).join(' / ')}
      (F{move.tuning.startup + move.cancelWindow!.start}–{move.tuning.startup +
        move.cancelWindow!.end})
    {/if}
    {#if links.length}
      · {language === 'fr' ? 'Après récupération' : 'After recovery'} :
      {links.map((target) => moveInputHint(target!.input, hints)).join(' / ')}
    {/if}
    {#if move.cancelWindow}
      · {move.auraCost} aura{/if}
  </small>
{/if}

<style>
  .move-properties {
    grid-column: 1 / -1;
    color: #a8bac5;
    font-size: 0.72rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
</style>
