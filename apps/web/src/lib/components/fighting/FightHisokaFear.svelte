<script lang="ts">
  export let elapsed: number
  $: focus = (elapsed >= 3 && elapsed < 4.7) || (elapsed >= 5.4 && elapsed < 5.8)
  $: pressure = Math.min(0.92, 0.18 + elapsed * 0.12)
</script>

<div class="fear-vignette" style:opacity={pressure} aria-hidden="true"></div>
{#if focus}<span class="gyo-sight" aria-hidden="true">GYŌ</span>{/if}

<style>
  .fear-vignette {
    position: absolute;
    inset: 7% 0;
    z-index: -1;
    pointer-events: none;
    background: radial-gradient(ellipse at center, transparent 21%, #02000755 60%, #010004ee 100%);
    box-shadow: inset 0 0 8vw 2vw #05010970;
  }
  .gyo-sight {
    position: absolute;
    right: 5%;
    top: 12%;
    font-size: clamp(10px, 1.1vw, 16px);
    letter-spacing: 0.35em;
    color: #dbd2bd;
    opacity: 0.7;
    border-bottom: 1px solid #e2d6bd66;
    padding-bottom: 0.5rem;
  }
</style>
