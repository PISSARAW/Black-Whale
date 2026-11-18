<script lang="ts">
  import { BASHO_POEMS } from '$lib/fighting/bashoPoem'
  export let elapsed: number
  export let language: 'fr' | 'en'
  $: lines = BASHO_POEMS[language].split('\n')
  $: verse =
    elapsed >= 6.4 && elapsed < 7.6
      ? 2
      : elapsed >= 5 && elapsed < 5.8
        ? 1
        : elapsed >= 3.6 && elapsed < 4.4
          ? 0
          : -1
</script>

{#if verse >= 0}
  <div class:last={verse === 2} class="poem-verse">
    <span>GREAT HIKER</span><b>{lines[verse]}</b>
  </div>
{/if}

<style>
  .poem-verse {
    position: absolute;
    bottom: 14%;
    left: 5%;
    right: 5%;
    display: grid;
    gap: 0.5rem;
    text-align: center;
    color: #f3d5aa;
    text-shadow: 0 2px 10px #000;
  }
  span {
    font-size: clamp(9px, 1vw, 16px);
    letter-spacing: 0.22em;
  }
  b {
    font-family: Georgia, serif;
    font-size: clamp(19px, 2.5vw, 40px);
  }
  .last b {
    color: #ffb763;
    font-size: clamp(26px, 4vw, 64px);
  }
</style>
