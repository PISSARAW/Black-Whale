<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import { link, t } from '$lib/i18n'
  import { breadcrumbSchema } from '$lib/seo/schema'

  const modes = $derived([
    { key: 'free', href: '/tour', number: '01', accent: '#FFD700', copy: $t.tour.modes.free },
    { key: 'morena', href: '/tour/morena', number: '02', accent: '#d94f68', copy: $t.tour.modes.morena },
    { key: 'reconstruction', href: '/reconstruction', number: '03', accent: '#79b8ff', copy: $t.tour.modes.reconstruction },
    { key: 'infiltration', href: '/infiltration', number: '04', accent: '#6ee7b7', copy: $t.tour.modes.infiltration },
    { key: 'hunt', href: '/hunt', number: '05', accent: '#fb923c', copy: $t.tour.modes.hunt },
    { key: 'arena', href: '/arena', number: '06', accent: '#ef4444', copy: $t.tour.modes.arena },
    { key: 'investigation', href: '/investigation', number: '07', accent: '#c4b5fd', copy: $t.tour.modes.investigation },
  ])
</script>

<Seo
  title={$t.tour.modes.seoTitle}
  description={$t.tour.modes.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.nav.virtualTour, path: $link('/tour') },
    { name: $t.nav.tourModes, path: $link('/tour/modes') },
  ])}
/>

<main class="modes-shell">
  <div class="modes-glow" aria-hidden="true"></div>
  <header>
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <a href={$link('/tour')}>{$t.nav.virtualTour}</a><span>/</span><span>{$t.nav.tourModes}</span>
    </nav>
    <p class="eyebrow">{$t.tour.modes.eyebrow}</p>
    <h1>{$t.tour.modes.title}</h1>
    <p class="intro">{$t.tour.modes.intro}</p>
  </header>

  <section class="mode-grid" aria-label={$t.nav.tourModes}>
    {#each modes as mode (mode.key)}
      <a class="mode-card" href={$link(mode.href)} style={`--accent: ${mode.accent}`}>
        <span class="number">{mode.number}</span>
        <span class="tag">{mode.copy.tag}</span>
        <h2>{mode.copy.title}</h2>
        <p>{mode.copy.description}</p>
        <span class="action">{$t.tour.modes.open}<span aria-hidden="true"> →</span></span>
      </a>
    {/each}
  </section>
</main>

<style>
  .modes-shell { position: relative; isolation: isolate; min-height: 75vh; overflow: hidden; padding: clamp(2.5rem, 7vw, 6rem) max(1rem, calc((100vw - 1400px) / 2)); background: #07090a; color: #fffff0; }
  .modes-glow { position: absolute; z-index: -1; top: -20rem; left: 35%; width: 45rem; height: 45rem; border-radius: 999px; background: radial-gradient(circle, rgba(255,215,0,.09), transparent 68%); }
  header { max-width: 52rem; margin-bottom: clamp(2.5rem, 5vw, 4.5rem); }
  .breadcrumb { display: flex; gap: .65rem; margin-bottom: 2rem; color: rgba(255,255,240,.45); font-size: .75rem; text-transform: uppercase; letter-spacing: .14em; }
  .breadcrumb a:hover { color: #ffd700; }
  .eyebrow { color: #ffd700; font-size: .72rem; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; }
  h1 { margin-top: .8rem; font-size: clamp(2.6rem, 7vw, 5.5rem); font-weight: 800; line-height: .92; letter-spacing: -.05em; }
  .intro { max-width: 45rem; margin-top: 1.5rem; color: rgba(255,255,240,.65); font-size: clamp(1rem, 2vw, 1.2rem); line-height: 1.7; }
  .mode-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1rem; }
  .mode-card { --accent: #ffd700; position: relative; display: flex; min-height: 19rem; grid-column: span 4; flex-direction: column; overflow: hidden; border: 1px solid rgba(255,255,240,.12); border-radius: .4rem; padding: 1.6rem; background: linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.015)); transition: transform .25s ease, border-color .25s ease, background .25s ease; }
  .mode-card::before { position: absolute; top: 0; right: 0; left: 0; height: 2px; background: var(--accent); content: ''; transform: scaleX(.22); transform-origin: left; transition: transform .3s ease; }
  .mode-card:hover, .mode-card:focus-visible { transform: translateY(-4px); border-color: var(--accent); background: rgba(255,255,255,.065); outline: none; }
  .mode-card:hover::before, .mode-card:focus-visible::before { transform: scaleX(1); }
  .number { align-self: flex-end; color: rgba(255,255,240,.25); font: 600 .75rem/1 monospace; }
  .tag { width: fit-content; margin-top: 2rem; color: var(--accent); font-size: .68rem; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
  h2 { margin-top: .65rem; font-size: 1.55rem; font-weight: 750; letter-spacing: -.025em; }
  .mode-card p { margin-top: .8rem; color: rgba(255,255,240,.58); font-size: .9rem; line-height: 1.6; }
  .action { margin-top: auto; padding-top: 1.5rem; color: var(--accent); font-size: .76rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }
  @media (max-width: 900px) { .mode-card { grid-column: span 6; } }
  @media (max-width: 580px) { .mode-card { min-height: 16rem; grid-column: 1 / -1; } }
</style>
