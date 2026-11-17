<script lang="ts">
  export let elapsed: number
  export let language: 'fr' | 'en'
  const ease = (n: number) => {
    const t = Math.max(0, Math.min(1, n))
    return t * t * (3 - 2 * t)
  }
  $: age = elapsed * 60
  $: fr = language === 'fr'
  $: darkness = ease((age - 90) / 8) * (1 - ease((age - 130) / 10))
  $: amplitude = 1 - ease((age - 162) / 12)
  $: waveform = Array.from(
    { length: 49 },
    (_, i) => `${i * 8},${32 + Math.sin(i * 0.85 + age * 0.6) * 20 * amplitude}`,
  ).join(' ')
</script>

{#if darkness > 0}
  <div class="lost-vision" style:opacity={darkness} aria-hidden="true">
    <b>MIZARU</b><span>{fr ? 'SA VISION S’ÉTEINT' : 'VISION GOES DARK'}</span>
  </div>
{/if}
{#if age >= 140 && age < 162}
  <p class="sense-caption">MIZARU <span>{fr ? 'VUE PERDUE' : 'SIGHT LOST'}</span></p>
{/if}
{#if age >= 150 && age < 222}
  <div class="lost-hearing" aria-hidden="true">
    <b>KIKAZARU</b>
    <svg viewBox="0 0 384 64"><polyline points={waveform} /></svg>
    <span
      >{age >= 174
        ? fr
          ? 'OUÏE PERDUE'
          : 'SOUND IS GONE'
        : fr
          ? 'LES SONS DISPARAISSENT'
          : 'SOUND FADES AWAY'}</span
    >
  </div>
{/if}
{#if age >= 234 && age < 282}
  <div class="silent-cry" aria-hidden="true">
    <b>IWAZARU</b><span>{fr ? 'UN CRI. AUCUN SON.' : 'A SCREAM. NO SOUND.'}</span>
  </div>
{/if}

<style>
  b {
    font:
      600 clamp(14px, 1.8vw, 28px)/1.4 Georgia,
      serif;
    letter-spacing: 0.18em;
  }
  span {
    font:
      500 clamp(10px, 1vw, 16px)/1.6 Arial,
      sans-serif;
    letter-spacing: 0.2em;
  }
  .lost-vision {
    position: absolute;
    inset: 0;
    z-index: 4;
    background: #000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: #c9baa0;
  }
  .sense-caption {
    position: absolute;
    left: 5%;
    top: 17%;
    display: grid;
    gap: 0.6rem;
    color: #dfc78f;
    font:
      600 clamp(13px, 1.6vw, 25px) Georgia,
      serif;
    letter-spacing: 0.12em;
  }
  .lost-hearing {
    position: absolute;
    left: 4%;
    top: 18%;
    width: 24%;
    display: grid;
    gap: 0.6rem;
    color: #a2cac8;
  }
  svg {
    width: 100%;
    overflow: visible;
  }
  polyline {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
  }
  .silent-cry {
    position: absolute;
    left: 4%;
    top: 19%;
    display: grid;
    gap: 0.7rem;
    color: #d5b7db;
  }
  @media (max-width: 600px) {
    .lost-hearing {
      width: 35%;
      top: 12%;
    }
    .silent-cry {
      top: 12%;
    }
    .sense-caption {
      top: 12%;
    }
    span {
      letter-spacing: 0.08em;
    }
  }
</style>
