<script lang="ts">
  import { machiMoveId, machiThreadForOwner } from '$lib/fighting/machiThread'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  $: key = side === 'opponent' && state.mode === 'versus-local' ? ',' : 'L'
  $: thread = machiThreadForOwner(state, side)
  $: target = state[side === 'player' ? 'opponent' : 'player']
  $: distance = Math.abs(target.x - state[side].x).toFixed(1)
</script>

{#if machiMoveId(state[side]) === 'machi:neutralSpecial'}
  <div class="thread-status">
    {language === 'fr' ? 'Suture · préparation vulnérable' : 'Suture · vulnerable preparation'}
  </div>
{/if}
{#if thread}
  <div class="thread-status">
    {thread.kind === 'bind'
      ? language === 'fr'
        ? 'Ligature · fil court maintenu'
        : 'Bind · short thread held'
      : language === 'fr'
        ? 'Pistage · aucune immobilisation'
        : 'Tracking · no restraint'}
    · {target.x >= state[side].x ? '→' : '←'}
    {distance}
  </div>
  <div class="thread-status">
    {language === 'fr' ? `← + ${key} : lâcher le fil` : `← + ${key}: release thread`}
  </div>
{/if}
{#if state[side].machiThread?.kind === 'bind'}
  <div class="thread-status">
    {language === 'fr'
      ? 'Lié par un fil de Nen · aura utilisable'
      : 'Bound by a Nen thread · aura remains usable'}
  </div>
{/if}

<style>
  .thread-status {
    margin-top: 0.25rem;
    color: #f0b2da;
    font: 600 0.65rem/1.4 var(--font-mono);
  }
</style>
