<script lang="ts">
  import { onMount } from 'svelte'
  import { activeHatsu } from './hatsuState.js'

  type Point = { x: number; y: number; label: string; id: number }
  let points: Point[] = []
  let cursor = { x: -100, y: -100 }
  let sequence = 0
  let seconds = 0
  let cardIndex = 0
  let status = ''
  let previousId: string | null = null
  const tribunalCards = ['BLEU · ADMISSION', 'JAUNE · AVERTISSEMENT', 'JAUNE · RESTRAINT', 'ROUGE · EXPULSION']

  $: profile = $activeHatsu
  $: if (profile?.id !== previousId) {
    previousId = profile?.id ?? null
    points = []
    seconds = 0
    cardIndex = 0
    status = profile ? profile.action : ''
  }

  function targetLabel(target: HTMLElement) {
    return (target.getAttribute('aria-label') || target.textContent || target.tagName).trim().replace(/\s+/g, ' ').slice(0, 34)
  }

  function addPoint(x: number, y: number, label: string) {
    points = [...points.slice(-7), { x, y, label, id: ++sequence }]
  }

  function interact(event: MouseEvent) {
    const eventElement = event.target as Element
    if (!profile || eventElement.closest('[data-hatsu-ui], [data-hatsu-pass]')) return
    const target = eventElement.closest('a, button, article, section, li, [role="button"], h1, h2, h3, p') as HTMLElement | null
    if (!target) return
    // Navigation remains usable while a Hatsu is active. Ordinary page
    // targets are captured by the technique instead of firing their action.
    if (!target.closest('nav')) {
      event.preventDefault()
      event.stopPropagation()
    }
    const rect = target.getBoundingClientRect()
    const x = Math.max(rect.left, Math.min(event.clientX, rect.right))
    const y = Math.max(rect.top, Math.min(event.clientY, rect.bottom))
    const label = targetLabel(target)

    if (profile.kind === 'tribunal') {
      cardIndex = (cardIndex + 1) % tribunalCards.length
      status = tribunalCards[cardIndex]
    } else if (profile.kind === 'resurrection') {
      status = status.includes('RÉSURRECTION') ? 'Simuler la mort' : 'MORT → CONTRE-ATTAQUE → RÉSURRECTION'
    } else if (profile.kind === 'inherit') {
      status = `${Math.min(points.length + 1, 4)}/4 étoiles héritées`
    } else if (profile.kind === 'vehicle') {
      status = `${Math.min(points.length + 1, 5)}/5 passagers · aura partagée`
    } else if (profile.kind === 'future') {
      status = `Vision : T + 10 s · présent : ${seconds}s`
    } else if (profile.kind === 'portal') {
      status = points.length % 2 === 0 ? 'Porte de départ ouverte' : 'Porte de retour matérialisée'
    } else if (profile.kind === 'arrow') {
      status = points.length === 0 ? 'Arc matérialisé · relâchez pour tirer' : 'IMPACT · transfert de conscience'
    } else {
      status = `${profile.action} · ${label || 'cible acquise'}`
    }
    addPoint(x, y, label)
  }

  onMount(() => {
    const move = (event: PointerEvent) => cursor = { x: event.clientX, y: event.clientY }
    const click = (event: MouseEvent) => interact(event)
    const timer = window.setInterval(() => { if (profile) seconds += 1 }, 1000)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('click', click, true)
    return () => {
      clearInterval(timer)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('click', click, true)
    }
  })

  $: anchor = points.length ? points[points.length - 1] : null
  $: chainPairs = points.slice(1).map((point, index) => ({ from: points[index], to: point }))
</script>

{#if profile}
  <div class="world-effect kind-{profile.kind}" style:--hatsu={profile.color} data-hatsu-ui aria-hidden="true">
    <div class="atmosphere"></div>
    {#if profile.kind === 'future'}
      <div class="future-frame"><span>PRÉDICTION</span><strong>+10.00 s</strong></div>
      <div class="future-ghost" style:left={`${cursor.x + 26}px`} style:top={`${cursor.y}px`}></div>
    {/if}
    {#if profile.kind === 'guardian'}
      <div class="guardian"><span>♙</span><small>KACHO · NEN POST-MORTEM</small></div>
    {/if}
    {#if profile.kind === 'scout' || profile.kind === 'dowsing'}
      <div class="scout" style:left={`${cursor.x}px`} style:top={`${cursor.y}px`}><span>{profile.kind === 'scout' ? '◉' : '◇'}</span><i></i></div>
    {/if}
    {#if anchor && ['elastic', 'chain-rule', 'chain-bind', 'control', 'arrow'].includes(profile.kind)}
      <svg class="connections">
        {#each chainPairs as pair (pair.to.id)}
          <line x1={pair.from.x} y1={pair.from.y} x2={pair.to.x} y2={pair.to.y}></line>
        {/each}
        <line class="live" x1={anchor.x} y1={anchor.y} x2={cursor.x} y2={cursor.y}></line>
      </svg>
    {/if}
    {#each points as point, i (point.id)}
      <div class="impact" class:paired={i % 2 === 1} style:left={`${point.x}px`} style:top={`${point.y}px`}>
        <span>
          {#if profile.kind === 'growth'}✦
          {:else if profile.kind === 'surveillance'}◉
          {:else if profile.kind === 'portal'}{i % 2 ? 'RETURN' : 'DOOR'}
          {:else if profile.kind === 'inherit'}★
          {:else if profile.kind === 'curse'}⌁
          {:else if profile.kind === 'capture'}▣
          {:else if profile.kind === 'tribunal'}{cardIndex === 3 ? '■' : cardIndex === 0 ? '●' : '◆'}
          {:else if profile.kind === 'vehicle'}{i + 1}
          {:else}×{/if}
        </span>
        <small>{point.label}</small>
      </div>
    {/each}
    {#if profile.kind === 'resurrection' && points.length}
      <div class="cat">CAT<br/><b>POST-MORTEM</b></div>
    {/if}
    <div class="readout">
      <span>{profile.name}</span>
      <strong>{status}</strong>
      <small>{profile.rule}</small>
      {#if profile.kind === 'scarlet'}<em>VIE CONSOMMÉE · {seconds} H</em>{/if}
    </div>
  </div>
{/if}

<style>
  .world-effect { position: fixed; z-index: 80; inset: 0; overflow: hidden; pointer-events: none; }
  .atmosphere { position: absolute; inset: 0; border: 1px solid color-mix(in srgb, var(--hatsu) 38%, transparent); background: radial-gradient(500px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--hatsu) 5%, transparent), transparent 70%); box-shadow: inset 0 0 80px color-mix(in srgb, var(--hatsu) 4%, transparent); }
  .kind-scarlet .atmosphere { background: radial-gradient(circle at 50% 10%, #e6193030, transparent 45%); box-shadow: inset 0 0 120px #e6193020; animation: scarlet 2.2s ease-in-out infinite; }
  .kind-disguise .atmosphere { backdrop-filter: contrast(.88) sepia(.12); background: repeating-linear-gradient(115deg, transparent 0 9px, color-mix(in srgb, var(--hatsu) 2%, transparent) 10px 11px); }
  .kind-enhance .atmosphere, .kind-blast .atmosphere { animation: power 1.1s ease-in-out infinite; }
  .kind-guardian .atmosphere { background: linear-gradient(90deg, transparent 0 48%, color-mix(in srgb, var(--hatsu) 5%, transparent) 50%, transparent 52%); }
  .connections { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .connections line { stroke: var(--hatsu); stroke-width: 2; filter: drop-shadow(0 0 5px var(--hatsu)); stroke-dasharray: 4 3; }
  .kind-elastic .connections line { stroke-width: 3; stroke-dasharray: none; animation: elastic .7s ease-in-out infinite alternate; }
  .connections .live { opacity: .65; stroke-dasharray: 2 5; }
  .impact { position: absolute; display: grid; width: 2.3rem; height: 2.3rem; place-items: center; transform: translate(-50%, -50%); border: 1px solid var(--hatsu); border-radius: 50%; background: color-mix(in srgb, var(--hatsu) 14%, #071019); color: var(--hatsu); box-shadow: 0 0 0 5px color-mix(in srgb, var(--hatsu) 7%, transparent), 0 0 22px color-mix(in srgb, var(--hatsu) 38%, transparent); animation: arrive .35s ease-out; }
  .impact small { position: absolute; top: 2.6rem; width: 8rem; overflow: hidden; color: #d9dfdc; font: 500 .52rem/1.2 'IBM Plex Sans Condensed'; text-align: center; text-overflow: ellipsis; text-shadow: 0 1px 4px #000; white-space: nowrap; }
  .kind-growth .impact { border-radius: 45% 0 45% 0; font-size: 1.4rem; animation: grow 1.6s ease-out both; }
  .kind-portal .impact { width: 4rem; height: 6rem; border-width: 2px; border-radius: 50%; font: 700 .5rem/1 monospace; animation: portal 2s linear infinite; }
  .kind-surveillance .impact { animation: owl 2s ease-in-out infinite; }
  .kind-curse .impact { border-style: dashed; animation: curse 5s linear infinite; }
  .kind-capture .impact { width: 3.3rem; height: 4.6rem; border-radius: .3rem; }
  .kind-blast .impact { animation: blast .8s ease-out both; }
  .kind-arrow .impact:last-of-type { animation: blast 1.1s ease-out both; }
  .readout { position: absolute; top: 4.2rem; left: 1rem; display: flex; width: min(23rem, calc(100vw - 2rem)); flex-direction: column; border-left: 2px solid var(--hatsu); background: linear-gradient(90deg, #071019e8, #07101955, transparent); padding: .55rem .75rem; text-shadow: 0 1px 3px #000; }
  .readout > span { color: var(--hatsu); font: 600 .56rem/1 'IBM Plex Sans Condensed'; letter-spacing: .14em; text-transform: uppercase; }
  .readout strong { margin-top: .25rem; color: #f3f4ee; font-size: .75rem; }
  .readout small { margin-top: .18rem; color: #8f9b9c; font-size: .58rem; line-height: 1.25; }
  .readout em { margin-top: .4rem; color: #ff6672; font: normal 700 .62rem/1 monospace; }
  .future-frame { position: absolute; top: 4rem; right: 1rem; display: flex; flex-direction: column; align-items: flex-end; color: var(--hatsu); font: .6rem monospace; }
  .future-frame strong { font-size: 1.6rem; text-shadow: 0 0 15px var(--hatsu); }
  .future-ghost { position: absolute; width: 1rem; height: 1rem; transform: translate(-50%,-50%); border: 1px solid var(--hatsu); border-radius: 50%; opacity: .45; }
  .scout { position: absolute; width: 1.8rem; height: 1.8rem; transform: translate(-50%,-50%); border: 1px solid var(--hatsu); border-radius: 50%; color: var(--hatsu); text-align: center; line-height: 1.65rem; box-shadow: 0 0 15px var(--hatsu); }
  .scout i { position: absolute; inset: -3rem; border: 1px dashed color-mix(in srgb, var(--hatsu) 40%, transparent); border-radius: 50%; }
  .guardian { position: absolute; right: 4%; bottom: 6rem; display: flex; align-items: center; gap: .5rem; color: var(--hatsu); opacity: .55; }
  .guardian span { font-size: 5rem; filter: drop-shadow(0 0 15px var(--hatsu)); }
  .guardian small { writing-mode: vertical-rl; font: .5rem monospace; letter-spacing: .1em; }
  .cat { position: absolute; top: 50%; left: 50%; display: grid; width: 14rem; height: 14rem; place-items: center; transform: translate(-50%,-50%); border: 2px solid var(--hatsu); border-radius: 50% 50% 44% 44%; background: radial-gradient(circle, color-mix(in srgb, var(--hatsu) 20%, #071019), transparent 70%); color: var(--hatsu); font: 700 1rem/1.1 monospace; text-align: center; filter: drop-shadow(0 0 35px var(--hatsu)); animation: cat .7s ease-out; }
  .cat b { font-size: .55rem; }
  @keyframes arrive { from { opacity: 0; transform: translate(-50%,-50%) scale(2); } }
  @keyframes elastic { to { stroke-width: 5; } }
  @keyframes scarlet { 50% { opacity: .72; } }
  @keyframes power { 50% { box-shadow: inset 0 0 140px color-mix(in srgb, var(--hatsu) 10%, transparent); } }
  @keyframes grow { from { transform: translate(-50%,-50%) scale(.15) rotate(-50deg); } to { transform: translate(-50%,-50%) scale(1.4) rotate(0); } }
  @keyframes portal { to { box-shadow: 0 0 25px var(--hatsu), inset 0 0 30px var(--hatsu); } }
  @keyframes owl { 50% { transform: translate(-50%,-60%); } }
  @keyframes curse { to { transform: translate(-50%,-50%) rotate(360deg); } }
  @keyframes blast { from { box-shadow: 0 0 0 0 var(--hatsu); } to { box-shadow: 0 0 0 14rem transparent; opacity: 0; } }
  @keyframes cat { from { transform: translate(-50%,-50%) scale(3); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .world-effect * { animation: none !important; } }
</style>
