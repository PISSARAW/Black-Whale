<script lang="ts">
  import '../app.css'
  import { page } from '$app/stores'
  import GlobalHatsuController from '$lib/nen/GlobalHatsuController.svelte'
  import GlobalHatsuEffects from '$lib/nen/GlobalHatsuEffects.svelte'

  let menuOpen = false

  const primaryNavigation = [
    { href: '/ship', label: 'Explore' },
    { href: '/timeline', label: 'Timeline' },
    { href: '/characters', label: 'Characters' },
    { href: '/perspectives', label: 'Knowledge' }
  ]

  const secondaryNavigation = [
    { href: '/abilities', label: 'Ability Archive', index: '01' },
    { href: '/nen', label: 'Nen System', index: '02' },
    { href: '/compare', label: 'Compare Perspectives', index: '03' },
    { href: '/relationships', label: 'Faction Network', index: '04' },
    { href: '/simulations', label: 'Simulations', index: '05' }
  ]

  const isActive = (href: string) => $page.url.pathname.startsWith(href)

  function closeMenu() {
    menuOpen = false
  }
</script>

<svelte:head>
  <meta name="theme-color" content="#070a0c" />
  <meta name="color-scheme" content="dark" />
</svelte:head>

<div class="app-shell">
  <a class="skip-link" href="#main-content">Skip to main content</a>

  <header class="app-header" data-hatsu-pass>
    <a href="/" class="brand" aria-label="Black Whale — Home" onclick={closeMenu}>
      <span class="brand-mark" aria-hidden="true">
        <span>BW</span>
      </span>
      <span class="brand-copy">
        <strong>Black Whale</strong>
        <small>Succession Archive</small>
      </span>
    </a>

    <nav class="primary-nav" aria-label="Primary navigation">
      {#each primaryNavigation as item}
        <a href={item.href} class:active={isActive(item.href)} aria-current={isActive(item.href) ? 'page' : undefined}>
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="header-meta" aria-hidden="true">
      <span>BW–01</span>
      <span>EN</span>
    </div>

    <button
      class="menu-toggle"
      class:open={menuOpen}
      type="button"
      aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={menuOpen}
      aria-controls="site-menu"
      onclick={() => (menuOpen = !menuOpen)}
    >
      <span></span>
      <span></span>
    </button>
  </header>

  {#if menuOpen}
    <div class="menu-backdrop" role="presentation" onclick={closeMenu}></div>
    <aside id="site-menu" class="site-menu" aria-label="Site navigation" data-hatsu-pass>
      <div class="menu-heading">
        <p>Navigation dossier</p>
        <span>CLASSIFIED / 05 SECTIONS</span>
      </div>

      <nav aria-label="Archive sections">
        {#each secondaryNavigation as item}
          <a href={item.href} class:active={isActive(item.href)} onclick={closeMenu}>
            <span>{item.index}</span>
            <strong>{item.label}</strong>
            <i aria-hidden="true">↗</i>
          </a>
        {/each}
      </nav>

      <div class="menu-footer">
        <span>Dark Continent Expedition</span>
        <span>Archive status: active</span>
      </div>
    </aside>
  {/if}

  <main id="main-content">
    {#key $page.url.pathname}
      <div class="route-shell">
        <slot />
      </div>
    {/key}
  </main>

  <!-- The Hatsu layer lives at the root so its state and mechanics survive navigation. -->
  <GlobalHatsuEffects />
  <GlobalHatsuController />
</div>

<style>
  .app-shell { min-height: 100vh; }

  .app-header {
    position: sticky;
    top: 0;
    z-index: 80;
    display: grid;
    grid-template-columns: minmax(12rem, 1fr) auto minmax(8rem, 1fr) 3.75rem;
    min-height: var(--header-height);
    align-items: stretch;
    border-bottom: 1px solid var(--line-subtle);
    background: color-mix(in srgb, var(--surface-void) 91%, transparent);
    box-shadow: 0 12px 42px rgba(0, 0, 0, .2);
    backdrop-filter: blur(18px) saturate(120%);
  }

  .app-header::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent-gold) 45%, transparent 80%);
    content: '';
    opacity: .25;
  }

  .brand {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: .75rem;
    padding: 0 var(--space-5);
    color: var(--text-primary);
    text-decoration: none;
  }

  .brand-mark {
    position: relative;
    display: grid;
    width: 2rem;
    height: 2rem;
    flex: none;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--accent-gold) 60%, transparent);
    border-radius: 50%;
    color: var(--accent-gold-bright);
    font-family: var(--font-mono);
    font-size: .55rem;
    letter-spacing: .08em;
  }

  .brand-mark::before,
  .brand-mark::after {
    position: absolute;
    width: .25rem;
    height: .25rem;
    border-radius: 50%;
    background: var(--accent-gold);
    content: '';
  }

  .brand-mark::before { top: -.14rem; }
  .brand-mark::after { bottom: -.14rem; }

  .brand-copy { display: grid; line-height: 1; }
  .brand-copy strong { font-family: var(--font-display); font-size: 1.05rem; letter-spacing: .025em; }
  .brand-copy small { margin-top: .28rem; color: var(--text-muted); font-family: var(--font-mono); font-size: .47rem; letter-spacing: .14em; text-transform: uppercase; }

  .primary-nav { display: flex; align-items: stretch; }

  .primary-nav a {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 1.1rem;
    color: var(--text-secondary);
    font-size: .73rem;
    font-weight: 600;
    letter-spacing: .02em;
    text-decoration: none;
    transition: color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out);
  }

  .primary-nav a:hover { color: var(--text-primary); background: rgba(255, 255, 255, .025); }
  .primary-nav a.active { color: var(--accent-gold-bright); }
  .primary-nav a.active::after { position: absolute; right: 1.1rem; bottom: 0; left: 1.1rem; height: 2px; background: var(--accent-gold); box-shadow: 0 -3px 12px var(--accent-gold-glow); content: ''; }

  .header-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: .8rem;
    padding: 0 var(--space-4);
    color: var(--text-faint);
    font-family: var(--font-mono);
    font-size: .54rem;
    letter-spacing: .12em;
  }

  .header-meta span + span { padding-left: .8rem; border-left: 1px solid var(--line-subtle); }

  .menu-toggle {
    display: grid;
    place-content: center;
    gap: .35rem;
    border: 0;
    border-left: 1px solid var(--line-subtle);
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
  }

  .menu-toggle span { display: block; width: 1.1rem; height: 1px; background: currentColor; transition: transform var(--duration-base) var(--ease-out); }
  .menu-toggle.open span:first-child { transform: translateY(.2rem) rotate(45deg); }
  .menu-toggle.open span:last-child { transform: translateY(-.2rem) rotate(-45deg); }

  .menu-backdrop { position: fixed; z-index: 68; inset: var(--header-height) 0 0; background: rgba(0, 0, 0, .62); backdrop-filter: blur(4px); animation: fade-in var(--duration-base) var(--ease-out); }

  .site-menu {
    position: fixed;
    z-index: 72;
    top: var(--header-height);
    right: 0;
    bottom: 0;
    display: grid;
    width: min(34rem, 100%);
    grid-template-rows: auto 1fr auto;
    padding: clamp(1.5rem, 4vw, 3.5rem);
    border-left: 1px solid var(--line-default);
    background: linear-gradient(145deg, rgba(18, 28, 34, .98), rgba(6, 9, 11, .99));
    box-shadow: -30px 0 80px rgba(0, 0, 0, .36);
    animation: menu-in var(--duration-slow) var(--ease-expo);
  }

  .menu-heading,
  .menu-footer { display: flex; justify-content: space-between; gap: 1rem; color: var(--text-faint); font-family: var(--font-mono); font-size: .56rem; letter-spacing: .12em; text-transform: uppercase; }
  .menu-heading p { margin: 0; color: var(--accent-gold); }
  .site-menu nav { align-self: center; }

  .site-menu nav a {
    display: grid;
    grid-template-columns: 2.5rem 1fr auto;
    align-items: baseline;
    gap: 1rem;
    padding: .9rem 0;
    border-bottom: 1px solid var(--line-subtle);
    color: var(--text-primary);
    text-decoration: none;
    transition: color var(--duration-fast) var(--ease-out), padding var(--duration-base) var(--ease-out);
  }

  .site-menu nav a:hover { padding-left: .5rem; color: var(--accent-gold-bright); }
  .site-menu nav a > span { color: var(--text-faint); font-family: var(--font-mono); font-size: .56rem; }
  .site-menu nav a strong { font-family: var(--font-display); font-size: clamp(1.75rem, 4vw, 2.75rem); font-weight: 500; letter-spacing: -.02em; }
  .site-menu nav a i { color: var(--accent-gold); font-style: normal; font-size: .8rem; }
  .menu-footer { align-self: end; padding-top: 1rem; border-top: 1px solid var(--line-subtle); }

  .route-shell { min-height: calc(100vh - var(--header-height)); animation: route-enter var(--duration-slow) var(--ease-expo) both; }

  @keyframes route-enter {
    from { opacity: 0; transform: translateY(.65rem); clip-path: inset(0 0 4% 0); }
    to { opacity: 1; transform: translateY(0); clip-path: inset(0); }
  }

  @keyframes menu-in { from { opacity: 0; transform: translateX(2rem); } to { opacity: 1; transform: translateX(0); } }
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

  @media (max-width: 800px) {
    .app-header { grid-template-columns: 1fr auto; }
    .primary-nav, .header-meta { display: none; }
    .brand { padding-inline: 1rem; }
    .brand-copy small { display: none; }
    .site-menu { border-left: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .route-shell, .site-menu, .menu-backdrop { animation: none; }
  }
</style>
