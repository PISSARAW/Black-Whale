<script lang="ts">
  import {
    activeHitbox,
    attackData,
    attackPhase,
    hurtboxes,
    type FightBox,
  } from '$lib/fighting/frameData'
  import { moveById } from '$lib/fighting/movesets'
  import type { FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en'

  $: hitbox = activeHitbox(state.player)
  $: boxes = [
    ...hurtboxes(state.player).map((box) => ({ box, side: 'player' as const })),
    ...hurtboxes(state.opponent).map((box) => ({ box, side: 'opponent' as const })),
  ]
  $: data = state.player.attack ? attackData(state.player.attack.kind, state.player) : null
  $: move = moveById(state.player.attack?.moveId)

  function boxStyle(box: FightBox): string {
    return `left:${box.left}%;bottom:${4 + box.bottom * 0.62}%;width:${box.right - box.left}%;height:${Math.max(0.5, (box.top - box.bottom) * 0.62)}%`
  }
</script>

<div class="training-frame-data">
  <strong
    >{move
      ? language === 'fr'
        ? move.nameFr
        : move.nameEn
      : (state.player.attack?.kind ?? 'NEUTRAL')}</strong
  >
  {#if data}
    <span>F{state.player.attack?.frame} · {attackPhase(state.player)?.toUpperCase()}</span>
    <span>S {data.startup} · A {data.active} · R {data.recovery}</span>
    <span
      >ON BLOCK {data.blockstun - data.recovery >= 0 ? '+' : ''}{data.blockstun -
        data.recovery}</span
    >
  {:else}
    <span>—</span>
  {/if}
  <span>COMBO {state.opponent.comboHits} · {state.opponent.comboDamage} DMG</span>
  <span>JUGGLE {state.opponent.juggleCount}/3</span>
</div>

{#each boxes as item (`${item.side}:${item.box.left}:${item.box.bottom}`)}
  <i class="debug-box hurtbox" class:opponent={item.side === 'opponent'} style={boxStyle(item.box)}
  ></i>
{/each}
{#if hitbox}
  <i class="debug-box hitbox" style={boxStyle(hitbox)}></i>
{/if}

<style>
  .training-frame-data {
    position: absolute;
    z-index: 25;
    top: 9.5rem;
    left: 1rem;
    display: grid;
    min-width: 190px;
    gap: 0.16rem;
    border-left: 3px solid #f5d25c;
    padding: 0.55rem 0.7rem;
    background: rgb(2 7 10 / 82%);
    color: #d8e5eb;
    font: 700 0.58rem/1.25 var(--font-mono);
    text-transform: uppercase;
    pointer-events: none;
  }
  .training-frame-data strong {
    color: #f5d25c;
  }
  .debug-box {
    position: absolute;
    z-index: 16;
    box-sizing: border-box;
    pointer-events: none;
  }
  .debug-box.hurtbox {
    border: 2px solid rgb(58 204 255 / 88%);
    background: rgb(58 204 255 / 13%);
  }
  .debug-box.hurtbox.opponent {
    border-color: rgb(194 103 255 / 88%);
    background: rgb(194 103 255 / 13%);
  }
  .debug-box.hitbox {
    border: 2px solid #ff4d52;
    background: rgb(255 77 82 / 22%);
  }
</style>
