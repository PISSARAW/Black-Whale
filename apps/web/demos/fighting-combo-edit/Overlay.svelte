<script lang="ts">
  import type { ComboClip } from './jCombo'
  import type { Shot } from './timeline'

  let { shot, clip, total }: { shot: Shot; clip?: ComboClip; total: number } = $props()

  const SITE = 'exploreblackwhale.com/fighting'
  const ENDING_LABEL = {
    ground: 'FIN AU SOL',
    air: 'FIN AÉRIENNE',
    close: 'FIN RAPPROCHÉE',
    carry: 'FIN EN POUSSÉE',
  } as const
  const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)
  /** Slam in: oversized, then snaps to size with a small overshoot. */
  const slam = (local: number, at = 0) => {
    const t = (local - at) / 5
    if (t < 0) return 'opacity:0'
    const s = t >= 1 ? 1 : 2.4 - 1.4 * ease(t) - Math.sin(t * Math.PI) * 0.08
    return `opacity:${Math.min(1, t * 2.5)};transform:scale(${s})`
  }
  let fx = $derived(shot.kind === 'clip' ? shot.fx : undefined)
  let nameOut = $derived(shot.kind === 'clip' ? Math.max(0, (shot.local - 40) / 6) : 0)
  let counterPop = $derived(shot.kind === 'clip' && fx ? 1 + Math.min(0.6, fx.split * 0.35) : 1)
  let words = $derived(
    shot.kind === 'title'
      ? [`${total} PERSOS`, '4 FINS', '1 TOUCHE', 'J']
      : ['BLACK', 'WHALE', 'CLASH', ''],
  )
</script>

{#if shot.kind === 'clip' && clip && fx}
  <div class="lines" style={`opacity:${fx.lines * 0.85}`}></div>
  <div class="vignette" style={`opacity:${0.5 + fx.split * 0.25}`}></div>
  <div class="split" style={`opacity:${Math.min(0.7, fx.split * 0.45)}`}></div>
  <div class="site">{SITE}</div>
  <div class="index">{String(shot.clip + 1).padStart(2, '0')}<small>/{total}</small></div>
  {#if nameOut < 1}
    <div class="nameplate" style={`opacity:${1 - nameOut};transform:translateX(${-nameOut * 80}px)`}>
      <div class="name" style={slam(shot.local)}>{clip.name.toUpperCase()}</div>
      <div class="route" style={slam(shot.local, 4)}>{ENDING_LABEL[clip.ending]}</div>
    </div>
  {/if}
  {#if clip.signature && shot.pressed >= 3}
    <div class="technique" style={slam(shot.local - (shot.final ? 0 : 0), 0)}>{clip.finish}</div>
  {/if}
  <div class="keys">
    {#each clip.presses as press, i (i)}
      <div class="key" class:on={shot.pressed > i} class:last={i === 2}>
        <b>{press.key}</b><small>{press.technique === 'ko' ? 'KO' : 'RYU'}</small>
      </div>
    {/each}
  </div>
  {#if shot.hits >= 2}
    <div class="counter" class:final={shot.final} style={`transform:scale(${counterPop}) rotate(-6deg)`}>
      <b>{shot.hits}</b><span>HITS</span>
      {#if shot.final}<em>{clip.damage} DÉGÂTS</em>{/if}
    </div>
  {/if}
  <div class="flash" style={`opacity:${fx.flash}`}></div>
{:else if shot.kind !== 'clip'}
  <div class="card" class:outro={shot.kind === 'outro'}>
    <div class="beam" style={`opacity:${0.4 + 0.6 * Math.abs(Math.sin(shot.local * 0.55))}`}></div>
    {#each words as word, i (i)}
      {#if word}
        <div
          class="word"
          class:gold={i % 2 === 1}
          class:giant={word === 'J'}
          style={slam(shot.local, i * (shot.kind === 'title' ? 10 : 8))}
        >
          {word}
        </div>
      {/if}
    {/each}
    {#if shot.kind === 'outro'}
      <div class="tag" style={slam(shot.local, 26)}>À TOI DE JOUER</div>
      <div class="url" style={slam(shot.local, 34)}>{SITE}</div>
    {/if}
    <div class="flash" style={`opacity:${Math.max(0, 1 - (shot.local % 12) / 3) * 0.5}`}></div>
  </div>
{/if}

<style>
  .lines,
  .vignette,
  .split,
  .flash,
  .card {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .lines {
    background: repeating-conic-gradient(
      from 0deg at 50% 52%,
      rgba(255, 255, 255, 0.5) 0deg 0.6deg,
      transparent 0.6deg 7deg
    );
    mask-image: radial-gradient(circle at 50% 52%, transparent 28%, black 70%);
  }
  .vignette {
    background: radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0, 0, 0, 0.9) 100%);
  }
  .split {
    mix-blend-mode: screen;
    background:
      linear-gradient(90deg, rgba(255, 0, 70, 0.35), transparent 18%),
      linear-gradient(270deg, rgba(0, 220, 255, 0.35), transparent 18%);
  }
  .flash {
    background: #fff;
  }
  .index {
    position: absolute;
    top: 58px;
    right: 34px;
    font: 54px/1 Impact, 'Arial Black', sans-serif;
    color: #fff;
    text-shadow: 0 4px 0 #000;
  }
  .index small {
    font-size: 26px;
    opacity: 0.7;
  }
  .nameplate {
    position: absolute;
    left: 34px;
    right: 34px;
    top: 150px;
  }
  .name {
    transform-origin: 0 50%;
    font: 108px/0.92 Impact, 'Arial Black', sans-serif;
    color: #fff;
    letter-spacing: 1px;
    -webkit-text-stroke: 3px #000;
    text-shadow:
      -5px 0 0 color-mix(in srgb, var(--aura) 85%, #f03),
      5px 0 0 #00e1ff,
      0 10px 24px rgba(0, 0, 0, 0.8);
    overflow-wrap: anywhere;
  }
  .route {
    transform-origin: 0 50%;
    display: inline-block;
    margin-top: 14px;
    padding: 6px 14px;
    background: var(--aura);
    color: #000;
    font: 30px/1 Impact, 'Arial Black', sans-serif;
    text-transform: uppercase;
  }
  .counter {
    position: absolute;
    right: 40px;
    bottom: 210px;
    transform-origin: 100% 100%;
    text-align: right;
    font-family: Impact, 'Arial Black', sans-serif;
    color: #fff;
  }
  .counter b {
    display: block;
    font-size: 190px;
    line-height: 0.85;
    font-weight: normal;
    -webkit-text-stroke: 4px #000;
    text-shadow:
      -6px 0 0 #ff1e50,
      6px 0 0 #00e1ff,
      0 12px 30px #000;
  }
  .counter span {
    font-size: 58px;
    color: var(--aura);
    -webkit-text-stroke: 2px #000;
  }
  .counter em {
    display: block;
    margin-top: 10px;
    font-style: normal;
    font-size: 40px;
    color: #ffd25a;
    -webkit-text-stroke: 1.5px #000;
  }
  .counter.final b {
    color: #ffd25a;
  }
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: radial-gradient(circle at 50% 45%, #1b2333, #05070b 70%);
  }
  .beam {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      -62deg,
      transparent 0 70px,
      rgba(217, 182, 116, 0.12) 70px 74px
    );
  }
  .word {
    position: relative;
    font: 190px/0.9 Impact, 'Arial Black', sans-serif;
    color: #fff;
    -webkit-text-stroke: 4px #000;
    text-shadow:
      -7px 0 0 #ff1e50,
      7px 0 0 #00e1ff;
  }
  .word.giant {
    font-size: 420px;
    line-height: 0.8;
    color: var(--aura, #d9b674);
  }
  .card:not(.outro) .word:not(.giant) {
    font-size: 112px;
  }
  .word.gold {
    color: #d9b674;
  }
  .outro .word {
    font-size: 170px;
  }
  .tag {
    position: relative;
    margin-top: 36px;
    font: 64px/1 Impact, 'Arial Black', sans-serif;
    color: #fff;
    letter-spacing: 2px;
    -webkit-text-stroke: 2px #000;
  }
  .url {
    position: relative;
    margin-top: 22px;
    padding: 14px 22px;
    background: #d9b674;
    color: #05070b;
    font: 38px/1 Impact, 'Arial Black', sans-serif;
    letter-spacing: 1px;
  }
  .site {
    position: absolute;
    top: 66px;
    left: 34px;
    font: 24px/1 Impact, 'Arial Black', sans-serif;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 1px;
    text-shadow: 0 2px 0 #000;
  }
  .technique {
    position: absolute;
    left: 30px;
    right: 30px;
    top: 330px;
    text-align: center;
    font: 64px/1 Impact, 'Arial Black', sans-serif;
    color: var(--aura);
    -webkit-text-stroke: 2px #000;
    text-shadow: 0 6px 18px #000;
    text-transform: uppercase;
  }
  .keys {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 56px;
    display: flex;
    justify-content: center;
    gap: 18px;
  }
  .key {
    min-width: 104px;
    padding: 12px 16px 8px;
    border: 3px solid rgba(255, 255, 255, 0.35);
    border-bottom-width: 9px;
    border-radius: 14px;
    background: rgba(8, 12, 19, 0.7);
    color: rgba(255, 255, 255, 0.4);
    text-align: center;
    font-family: Impact, 'Arial Black', sans-serif;
  }
  .key b {
    display: block;
    font-size: 54px;
    font-weight: normal;
    line-height: 1;
  }
  .key small {
    font-size: 20px;
    letter-spacing: 2px;
  }
  .key.on {
    border-color: var(--aura);
    background: color-mix(in srgb, var(--aura) 30%, #05070b);
    color: #fff;
    transform: translateY(4px);
    border-bottom-width: 5px;
    box-shadow: 0 0 34px color-mix(in srgb, var(--aura) 70%, transparent);
  }
  .key.last.on {
    transform: translateY(4px) scale(1.12);
  }
</style>
