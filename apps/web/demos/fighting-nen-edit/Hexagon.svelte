<script lang="ts">
  import { HEXAGON, COLOURS, type Category } from './groups'

  let { active, size = 22 }: { active: Category; size?: number } = $props()
  const LABELS = ['ENH', 'TRA', 'CON', 'SPE', 'MAN', 'EMI']
  // Classic layout: Enhancement on top, then clockwise.
  const points = HEXAGON.map((_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2
    return {
      x: 50 + Math.cos(a) * 34,
      y: 50 + Math.sin(a) * 34,
      lx: 50 + Math.cos(a) * 46,
      ly: 50 + Math.sin(a) * 46,
    }
  })
  const outline = points.map((p) => `${p.x},${p.y}`).join(' ')
</script>

<svg viewBox="0 0 100 100" style={`width:${size}vw`} aria-hidden="true">
  <polygon points={outline} fill="#00000035" stroke="#ffffffb0" stroke-width="1.4" />
  {#each HEXAGON as category, i (category)}
    {@const p = points[i]}
    {@const on = category === active}
    <circle
      cx={p.x}
      cy={p.y}
      r={on ? 6.5 : 3.4}
      fill={on ? COLOURS[category] : '#ffffff40'}
      stroke={on ? '#fff' : 'none'}
      stroke-width="1"
    />
    <text
      x={p.lx}
      y={p.ly + 2.5}
      text-anchor="middle"
      font-size={on ? 10 : 8}
      font-family="system-ui"
      font-weight={on ? 800 : 600}
      stroke="#000"
      stroke-width="0.4"
      fill={on ? COLOURS[category] : '#ffffffd0'}>{LABELS[i]}</text
    >
  {/each}
  {#if active === 'unknown'}
    <text x="50" y="59" text-anchor="middle" font-size="26" font-family="Impact" fill="#fff">?</text
    >
  {/if}
</svg>

<style>
  svg {
    display: block;
    filter: drop-shadow(0 1vw 2vw #000);
  }
</style>
