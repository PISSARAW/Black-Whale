<script lang="ts">
  import '../app.css'
  import { page } from '$app/stores'
  import GlobalHatsuController from '$lib/nen/GlobalHatsuController.svelte'
  import GlobalHatsuEffects from '$lib/nen/GlobalHatsuEffects.svelte'
  import CommandPalette from '$lib/components/CommandPalette.svelte'
  import AmbientToggle from '$lib/audio/AmbientToggle.svelte'
  import { tick } from 'svelte'

  let menuOpen = false
  let paletteOpen = false
  let menuPanel: HTMLElement | undefined
  let menuButton: HTMLButtonElement | undefined

  const primaryNavigation = [
    { href: '/ship', label: 'Explore' },
    { href: '/timeline', label: 'Timeline' },
    { href: '/characters', label: 'Characters' },
    { href: '/perspectives', label: 'Knowledge' },
  ]

  const secondaryNavigation = [
    { href: '/abilities', label: 'Ability Archive', index: '01' },
    { href: '/compare', label: 'Compare Perspectives', index: '02' },
    { href: '/relationships', label: 'Faction Network', index: '03' },
    { href: '/simulations', label: 'Simulations', index: '04' },
  ]

  const isActive = (href: string) => $page.url.pathname.startsWith(href)

  function closeMenu() {
    menuOpen = false
  }

  async function toggleMenu() {
    menuOpen = !menuOpen
    if (menuOpen) {
      await tick()
      menuPanel?.focus()
    } else {
      menuButton?.focus()
    }
  }

  function openPalette() {
    menuOpen = false
    paletteOpen = true
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && menuOpen) {
      menuOpen = false
      menuButton?.focus()
    }
  }

  // A drawer covering the viewport must not let the page scroll behind it.
  $: if (typeof document !== 'undefined') {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
  }

  // Any navigation (including browser back) closes the drawer.
  $: if ($page.url.pathname) menuOpen = false
</script>

<svelte:head>
  <meta name="theme-color" content="#070a0c" />
  <meta name="color-scheme" content="dark" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

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
      {#each primaryNavigation as item (item.href)}
        <a
          href={item.href}
          class:active={isActive(item.href)}
          aria-current={isActive(item.href) ? 'page' : undefined}
        >
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="header-meta">
      <AmbientToggle />
      <button type="button" onclick={openPalette} aria-label="Open quick navigation">
        <span>Quick find</span><kbd>⌘K</kbd>
      </button>
      <span aria-hidden="true">EN</span>
    </div>

    <button
      bind:this={menuButton}
      class="menu-toggle"
      class:open={menuOpen}
      type="button"
      aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={menuOpen}
      aria-controls="site-menu"
      onclick={toggleMenu}
    >
      <span></span>
      <span></span>
    </button>
  </header>

  {#if menuOpen}
    <div class="menu-backdrop" role="presentation" onclick={closeMenu}></div>
    <div
      bind:this={menuPanel}
      id="site-menu"
      class="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      tabindex="-1"
      data-hatsu-pass
    >
      <div class="menu-scroll">
        <div class="menu-heading">
          <p>Navigation dossier</p>
          <span>CLASSIFIED / 05 SECTIONS</span>
        </div>

        <nav class="menu-primary" aria-label="Main sections">
          {#each primaryNavigation as item (item.href)}
            <a
              href={item.href}
              class:active={isActive(item.href)}
              aria-current={isActive(item.href) ? 'page' : undefined}
              onclick={closeMenu}
            >
              {item.label}
            </a>
          {/each}
        </nav>

        <nav class="menu-sections" aria-label="Archive sections">
          {#each secondaryNavigation as item (item.href)}
            <a href={item.href} class:active={isActive(item.href)} onclick={closeMenu}>
              <span>{item.index}</span>
              <strong>{item.label}</strong>
              <i aria-hidden="true">↗</i>
            </a>
          {/each}
        </nav>

        <button class="menu-search" type="button" onclick={openPalette}>
          <span aria-hidden="true">⌕</span>
          <span>Quick find</span>
        </button>

        <!-- The header meta row is hidden on mobile, so the theme toggle rides here. -->
        <div class="menu-audio">
          <AmbientToggle />
        </div>

        <div class="menu-footer">
          <span>Dark Continent Expedition</span>
          <span>Archive status: active</span>
        </div>
      </div>
    </div>
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
  <CommandPalette bind:open={paletteOpen} />
</div>

<style>
  .app-shell {
    min-height: 100vh;
  }

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
    box-shadow: 0 12px 42px rgba(0, 0, 0, 0.2);
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
    opacity: 0.25;
  }

  .brand {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.75rem;
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
    font-size: 0.55rem;
    letter-spacing: 0.08em;
  }

  .brand-mark::before,
  .brand-mark::after {
    position: absolute;
    width: 0.25rem;
    height: 0.25rem;
    border-radius: 50%;
    background: var(--accent-gold);
    content: '';
  }

  .brand-mark::before {
    top: -0.14rem;
  }
  .brand-mark::after {
    bottom: -0.14rem;
  }

  .brand-copy {
    display: grid;
    line-height: 1;
  }
  .brand-copy strong {
    font-family: var(--font-display);
    font-size: 1.05rem;
    letter-spacing: 0.025em;
  }
  .brand-copy small {
    margin-top: 0.28rem;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.47rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .primary-nav {
    display: flex;
    align-items: stretch;
  }

  .primary-nav a {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 1.1rem;
    color: var(--text-secondary);
    font-size: 0.73rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-decoration: none;
    transition:
      color var(--duration-fast) var(--ease-out),
      background var(--duration-fast) var(--ease-out);
  }

  .primary-nav a:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.025);
  }
  .primary-nav a.active {
    color: var(--accent-gold-bright);
  }
  .primary-nav a.active::after {
    position: absolute;
    right: 1.1rem;
    bottom: 0;
    left: 1.1rem;
    height: 2px;
    background: var(--accent-gold);
    box-shadow: 0 -3px 12px var(--accent-gold-glow);
    content: '';
  }

  .header-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.8rem;
    padding: 0 var(--space-4);
    color: var(--text-faint);
    font-family: var(--font-mono);
    font-size: 0.54rem;
    letter-spacing: 0.12em;
  }

  .header-meta button {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.45rem;
    border: 0;
    border-radius: 0.3rem;
    background: transparent;
    color: var(--text-faint);
    cursor: pointer;
    font: inherit;
    letter-spacing: inherit;
    text-transform: uppercase;
  }
  .header-meta button:hover {
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-primary);
  }
  .header-meta kbd {
    padding: 0.18rem 0.28rem;
    border: 1px solid var(--line-default);
    border-radius: 0.2rem;
    color: var(--accent-gold);
    font: 0.48rem/1 var(--font-mono);
  }

  .header-meta > span {
    padding-left: 0.8rem;
    border-left: 1px solid var(--line-subtle);
  }

  .menu-toggle {
    display: grid;
    min-width: 3rem;
    place-content: center;
    gap: 0.35rem;
    border: 0;
    border-left: 1px solid var(--line-subtle);
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
  }

  .menu-toggle span {
    display: block;
    width: 1.1rem;
    height: 1px;
    background: currentColor;
    transition: transform var(--duration-base) var(--ease-out);
  }
  .menu-toggle.open span:first-child {
    transform: translateY(0.2rem) rotate(45deg);
  }
  .menu-toggle.open span:last-child {
    transform: translateY(-0.2rem) rotate(-45deg);
  }

  .menu-backdrop {
    position: fixed;
    z-index: 68;
    inset: var(--header-height) 0 0;
    background: rgba(0, 0, 0, 0.62);
    backdrop-filter: blur(4px);
    animation: fade-in var(--duration-base) var(--ease-out);
  }

  .site-menu {
    position: fixed;
    z-index: 72;
    top: var(--header-height);
    right: 0;
    bottom: 0;
    width: min(34rem, 100%);
    border-left: 1px solid var(--line-default);
    background: linear-gradient(145deg, rgba(18, 28, 34, 0.98), rgba(6, 9, 11, 0.99));
    box-shadow: -30px 0 80px rgba(0, 0, 0, 0.36);
    animation: menu-in var(--duration-slow) var(--ease-expo);
  }

  .site-menu:focus {
    outline: none;
  }

  .menu-scroll {
    display: grid;
    height: 100%;
    grid-template-rows: auto 1fr auto;
    overflow-y: auto;
    padding: clamp(1.5rem, 4vw, 3.5rem);
    padding-bottom: max(clamp(1.5rem, 4vw, 3.5rem), env(safe-area-inset-bottom));
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  .menu-heading,
  .menu-footer {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    color: var(--text-faint);
    font-family: var(--font-mono);
    font-size: 0.56rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .menu-heading p {
    margin: 0;
    color: var(--accent-gold);
  }
  .menu-sections {
    align-self: center;
  }

  /* Primary destinations and search live in the header on desktop. */
  .menu-primary,
  .menu-search {
    display: none;
  }

  .menu-sections a {
    display: grid;
    grid-template-columns: 2.5rem 1fr auto;
    align-items: baseline;
    gap: 1rem;
    padding: 0.9rem 0;
    border-bottom: 1px solid var(--line-subtle);
    color: var(--text-primary);
    text-decoration: none;
    transition:
      color var(--duration-fast) var(--ease-out),
      padding var(--duration-base) var(--ease-out);
  }

  .menu-sections a:hover {
    padding-left: 0.5rem;
    color: var(--accent-gold-bright);
  }
  .menu-sections a.active {
    color: var(--accent-gold-bright);
  }
  .menu-sections a.active > span {
    color: var(--accent-gold);
  }
  .menu-sections a > span {
    color: var(--text-faint);
    font-family: var(--font-mono);
    font-size: 0.56rem;
  }
  .menu-sections a strong {
    font-family: var(--font-display);
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    font-weight: 500;
    letter-spacing: -0.02em;
  }
  .menu-sections a i {
    color: var(--accent-gold);
    font-style: normal;
    font-size: 0.8rem;
  }
  .menu-footer {
    align-self: end;
    padding-top: 1rem;
    border-top: 1px solid var(--line-subtle);
  }

  .route-shell {
    min-height: calc(100vh - var(--header-height));
    animation: route-enter var(--duration-slow) var(--ease-expo) both;
  }

  @keyframes route-enter {
    from {
      opacity: 0;
      transform: translateY(0.65rem);
      clip-path: inset(0 0 4% 0);
    }
    to {
      opacity: 1;
      transform: translateY(0);
      clip-path: inset(0);
    }
  }

  @keyframes menu-in {
    from {
      opacity: 0;
      transform: translateX(2rem);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (max-width: 800px) {
    .app-header {
      grid-template-columns: 1fr auto;
    }
    .primary-nav,
    .header-meta {
      display: none;
    }
    .brand {
      padding-inline: 1rem;
    }
    .brand-copy small {
      display: none;
    }

    .menu-toggle {
      min-width: 3.25rem;
    }
    .menu-toggle span {
      width: 1.25rem;
    }

    .menu-backdrop {
      inset: 0;
    }

    .site-menu {
      top: 0;
      left: 0;
      width: 100%;
      border-left: 0;
      border-top: 1px solid var(--line-subtle);
    }

    .menu-scroll {
      grid-template-rows: auto auto auto auto auto;
      align-content: start;
      gap: 1.25rem;
      padding: calc(var(--header-height) + 1rem) 1.25rem max(1.5rem, env(safe-area-inset-bottom));
    }

    .menu-heading {
      flex-direction: column;
      gap: 0.3rem;
    }

    /* The primary destinations are unreachable from the header on mobile,
       so the drawer carries them as a compact pill row. */
    .menu-primary {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .menu-primary a {
      display: flex;
      min-height: 3rem;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      border: 1px solid var(--line-subtle);
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.02);
      color: var(--text-secondary);
      font-size: 0.82rem;
      font-weight: 600;
      text-align: center;
      text-decoration: none;
    }

    .menu-primary a.active {
      border-color: var(--line-strong);
      background: var(--accent-gold-glow);
      color: var(--accent-gold-bright);
    }

    .menu-sections {
      align-self: start;
    }
    .menu-sections a {
      min-height: 3.25rem;
      align-items: center;
      padding: 0.55rem 0;
      gap: 0.75rem;
      grid-template-columns: 1.75rem 1fr auto;
    }
    .menu-sections a strong {
      font-size: 1.4rem;
    }
    .menu-sections a:hover {
      padding-left: 0;
    }

    .menu-search {
      display: flex;
      min-height: 3rem;
      align-items: center;
      gap: 0.6rem;
      padding: 0 0.9rem;
      border: 1px solid var(--line-default);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: 0.62rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .menu-search > span:first-child {
      color: var(--accent-gold);
      font-size: 1rem;
    }

    .menu-footer {
      flex-direction: column;
      gap: 0.3rem;
      align-self: start;
      padding-top: 0.75rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .route-shell,
    .site-menu,
    .menu-backdrop {
      animation: none;
    }
  }
</style>
