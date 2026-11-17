<script lang="ts">
  export let elapsed: number
  export let language: 'fr' | 'en'
  $: pressure =
    Math.min(0.7, Math.max(0, (elapsed - 3.9) / 3)) *
    (1 - Math.min(1, Math.max(0, (elapsed - 7.2) / 1.4)))
</script>

<div class="curse-pressure" style:opacity={pressure}></div>
{#if elapsed >= 2.6 && elapsed < 3.9}
  <p class="curse-caption">{language === 'fr' ? 'NEN POST MORTEM' : 'POST-MORTEM NEN'}</p>
{/if}

<style>
  .curse-pressure {
    position: absolute;
    inset: 7% 0;
    background: radial-gradient(ellipse, transparent 28%, #210c26 75%, #08050c 100%);
  }
  .curse-caption {
    position: absolute;
    bottom: 15%;
    width: 100%;
    margin: 0;
    text-align: center;
    color: #d9a5b4;
    font-size: clamp(11px, 1.4vw, 21px);
    letter-spacing: 0.35em;
    text-shadow: 0 2px 8px #000;
  }
</style>
