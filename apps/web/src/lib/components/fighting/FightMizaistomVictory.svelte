<script lang="ts">
  import { mizaistomBeat } from '$lib/fighting/victory/mizaistomTrack'
  export let elapsed: number
  export let language: 'fr' | 'en'
  $: beat = mizaistomBeat(elapsed * 60)
  $: fr = language === 'fr'
</script>

{#if beat.warning}
  <div class:confined={beat.confined} class="cross-game-order">
    <b>CROSS GAME</b>
    <span
      >{beat.confined
        ? fr
          ? 'CONTRAINTE'
          : 'RESTRAINT'
        : fr
          ? 'NE BOUGEZ PLUS.'
          : 'DO NOT MOVE.'}</span
    >
  </div>
{:else if elapsed >= 6.5 && elapsed < 7.8}
  <div class="cross-game-order expelled"><b>{fr ? 'HORS JEU' : 'OUT OF PLAY'}</b></div>
{/if}

<style>
  .cross-game-order {
    position: absolute;
    bottom: 13%;
    left: 0;
    right: 0;
    display: grid;
    gap: 0.45rem;
    text-align: center;
    color: #f1d567;
    text-shadow: 0 2px 8px #000;
  }
  b {
    font-size: clamp(10px, 1.1vw, 18px);
    letter-spacing: 0.22em;
  }
  span {
    font-size: clamp(14px, 2vw, 30px);
    letter-spacing: 0.12em;
  }
  .confined {
    color: #f5f4e9;
  }
  .expelled {
    color: #e9b297;
  }
</style>
