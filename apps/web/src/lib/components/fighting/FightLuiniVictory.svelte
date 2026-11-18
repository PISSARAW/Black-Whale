<script lang="ts">
  export let elapsed: number
  export let language: 'fr' | 'en'
  $: fr = language === 'fr'
  $: line =
    elapsed < 1.2
      ? fr
        ? 'Une seule porte.'
        : 'One door.'
      : elapsed >= 2.2 && elapsed < 3.4
        ? fr
          ? 'Derrière toi.'
          : 'Behind you.'
        : elapsed >= 5.7 && elapsed < 6.4
          ? fr
            ? 'Tu cherchais la sortie ?'
            : 'Looking for a way out?'
          : ''
</script>

{#if line}<div class="luini-line"><span>{line}</span></div>{/if}

<style>
  .luini-line {
    position: absolute;
    bottom: 14%;
    left: 5%;
    right: 5%;
    text-align: center;
    color: #e7e9f0;
    text-shadow: 0 2px 10px #000;
    font-family: Georgia, serif;
    font-size: clamp(14px, 2vw, 30px);
  }
</style>
