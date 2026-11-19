<script lang="ts">
  import type { Shot } from './timeline'
  import { TECHNIQUES } from './techniques'
  import type { HeroConfig } from './hero'

  let { shot, mask, hero }: { shot: Shot; mask: number; hero: HeroConfig } = $props()

  const SITE = 'exploreblackwhale.com/fighting'
  const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)
  const slam = (local: number, at = 0) => {
    const t = (local - at) / 5
    if (t < 0) return 'opacity:0'
    const s = t >= 1 ? 1 : 2.4 - 1.4 * ease(t) - Math.sin(t * Math.PI) * 0.08
    return `opacity:${Math.min(1, t * 2.5)};transform:scale(${s})`
  }
  /** Impact glyphs average half an em: long names shrink to fit the 680 px line. */
  const fit = (text: string, size: number) =>
    `;font-size:${Math.min(size, Math.floor(680 / (0.52 * text.length)))}px`
  let fx = $derived(shot.kind === 'clip' ? shot.fx : undefined)
  let callout = $derived(shot.kind === 'clip' && shot.beat && shot.beat.age < 34 ? shot.beat : null)
</script>

{#if shot.kind === 'clip' && shot.title}
  <div class="vignette" style="opacity:0.75"></div>
  <div class="opener">
    <div class="kicker" style={slam(shot.local, 4)}>{hero.kicker}</div>
    <div class="word" style={slam(shot.local, 14) + fit(hero.first, 150)}>{hero.first}</div>
    <div class="word gold small" style={slam(shot.local, 22) + fit(hero.last, 110)}>
      {hero.last}
    </div>
    <div class="kicker" style={slam(shot.local, 34)}>JOINS BLACK WHALE CLASH</div>
  </div>
  <div class="flash" style={`opacity:${shot.local < 3 ? 0.8 - shot.local * 0.26 : 0}`}></div>
{:else if shot.kind === 'clip' && fx}
  <div class="lines" style={`opacity:${fx.lines * 0.85}`}></div>
  <div class="vignette" style={`opacity:${0.5 + fx.split * 0.25}`}></div>
  <div class="split" style={`opacity:${Math.min(0.7, fx.split * 0.45)}`}></div>
  <div class="site">{SITE}</div>
  <div class="who">{hero.first}</div>
  {#if callout}
    <div class="callout" style={`opacity:${callout.age > 28 ? 1 - (callout.age - 28) / 6 : 1}`}>
      {#if callout.word}<b class:long={callout.word.length > 7} style={slam(callout.age)}
          >{callout.word}</b
        >{/if}
      {#if callout.line}<span class:big={!callout.word} style={slam(callout.age, 3)}
          >{callout.line}</span
        >{/if}
    </div>
  {/if}
  <div class="flash" style={`opacity:${fx.flash}`}></div>
{:else if shot.kind !== 'clip'}
  <div class="card" class:outro={shot.kind === 'outro'}>
    <div class="beam" style={`opacity:${0.4 + 0.6 * Math.abs(Math.sin(shot.local * 0.55))}`}></div>
    {#if shot.kind === 'title'}
      <div class="kicker" style={slam(shot.local, 0)}>{hero.kicker}</div>
      <div class="word" style={slam(shot.local, 10)}>{hero.first}</div>
      <div class="word gold small" style={slam(shot.local, 20)}>{hero.last}</div>
      <div class="kicker" style={slam(shot.local, 34)}>JOINS BLACK WHALE CLASH</div>
    {:else}
      <div class="word" style={slam(shot.local, 0) + fit(hero.first, 150)}>{hero.first}</div>
      <div class="kicker" style={slam(shot.local, 10)}>IS PLAYABLE NOW</div>
      <div class="tag" style={slam(shot.local, 22)}>YOUR TURN</div>
      <div class="url" style={slam(shot.local, 30)}>{SITE}</div>
    {/if}
    <div class="flash" style={`opacity:${Math.max(0, 1 - (shot.local % 12) / 3) * 0.5}`}></div>
  </div>
{/if}
{#if shot.kind !== 'title' && !(shot.kind === 'clip' && shot.title)}
  <div class="strip">
    {#each TECHNIQUES as name, i (name)}
      <i class:on={(mask & (1 << i)) !== 0}>{name}</i>
    {/each}
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
  .site {
    position: absolute;
    top: 66px;
    left: 34px;
    font:
      24px/1 Impact,
      'Arial Black',
      sans-serif;
    color: rgba(255, 255, 255, 0.85);
    text-shadow: 0 2px 0 #000;
  }
  .who {
    position: absolute;
    top: 58px;
    right: 34px;
    font:
      40px/1 Impact,
      'Arial Black',
      sans-serif;
    color: #fff;
    letter-spacing: 2px;
    text-shadow: 0 3px 0 #000;
  }
  .callout {
    position: absolute;
    left: 24px;
    right: 24px;
    top: 150px;
    text-align: center;
  }
  .callout b {
    display: block;
    font:
      150px/0.95 Impact,
      'Arial Black',
      sans-serif;
    font-weight: normal;
    color: #fff;
    -webkit-text-stroke: 4px #000;
    text-shadow:
      -6px 0 0 #ff1e50,
      6px 0 0 #00e1ff,
      0 12px 30px #000;
  }
  .callout b.long {
    font-size: 112px;
  }
  .callout span {
    display: inline-block;
    margin-top: 14px;
    padding: 8px 16px;
    background: var(--aura);
    color: #05070b;
    font:
      34px/1.1 Impact,
      'Arial Black',
      sans-serif;
  }
  .callout span.big {
    margin-top: 820px;
    font-size: 54px;
    background: #d9b674;
  }
  .strip {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 40px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  .strip i {
    padding: 6px 10px;
    border: 2px solid rgba(255, 255, 255, 0.25);
    border-radius: 6px;
    background: rgba(5, 7, 11, 0.6);
    color: rgba(255, 255, 255, 0.35);
    font:
      normal 24px/1 Impact,
      'Arial Black',
      sans-serif;
    letter-spacing: 1px;
  }
  .strip i.on {
    border-color: var(--aura);
    background: color-mix(in srgb, var(--aura) 35%, #05070b);
    color: #fff;
    box-shadow: 0 0 18px color-mix(in srgb, var(--aura) 60%, transparent);
  }
  .opener {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 150px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: radial-gradient(circle at 50% 45%, #1d1830, #05070b 70%);
  }
  .beam {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      -62deg,
      transparent 0 70px,
      rgba(155, 123, 255, 0.12) 70px 74px
    );
  }
  .word {
    position: relative;
    font:
      150px/0.9 Impact,
      'Arial Black',
      sans-serif;
    color: #fff;
    -webkit-text-stroke: 4px #000;
    text-shadow:
      -7px 0 0 #ff1e50,
      7px 0 0 #00e1ff;
  }
  .word.gold {
    color: #d9b674;
  }
  .word.small {
    font-size: 110px;
  }
  .kicker {
    position: relative;
    font:
      34px/1 Impact,
      'Arial Black',
      sans-serif;
    color: #c8d3de;
    letter-spacing: 2px;
  }
  .tag {
    position: relative;
    margin-top: 30px;
    font:
      64px/1 Impact,
      'Arial Black',
      sans-serif;
    color: #fff;
    -webkit-text-stroke: 2px #000;
  }
  .url {
    position: relative;
    margin-top: 18px;
    padding: 14px 22px;
    background: #d9b674;
    color: #05070b;
    font:
      38px/1 Impact,
      'Arial Black',
      sans-serif;
  }
</style>
