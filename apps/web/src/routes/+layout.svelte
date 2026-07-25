<script lang="ts">
  import '../app.css'
  import { page } from '$app/stores'

  const navigation = [
    { href: '/ship', label: 'Ship Map' },
    { href: '/timeline', label: 'Timeline' },
    { href: '/characters', label: 'Characters' },
    { href: '/abilities', label: 'Abilities' },
    { href: '/nen', label: 'Nen' },
    { href: '/perspectives', label: 'Perspectives' },
    { href: '/compare', label: 'Compare' },
    { href: '/simulations', label: 'Simulations' },
    { href: '/theories', label: 'Theories' },
    { href: '/sources', label: 'Sources' }
  ];
</script>

<div class="app min-h-screen bg-bw-dark text-white">
  <nav class="app-nav" aria-label="Navigation principale">
    <a href="/" class="brand" aria-label="Black Whale — Accueil">
      <span class="brand-mark">BW</span>
      <span>Black Whale</span>
    </a>
    <div class="nav-links">
      {#each navigation as item}
        <a href={item.href} class:active={$page.url.pathname.startsWith(item.href)} aria-current={$page.url.pathname.startsWith(item.href) ? 'page' : undefined}>
          {item.label}
        </a>
      {/each}
    </div>
  </nav>

  <main class="flex-1">
    <slot />
  </main>
</div>

<style>
  .app-nav {
    position: relative;
    z-index: 60;
    display: flex;
    min-height: 3.25rem;
    align-items: stretch;
    border-bottom: 1px solid rgba(201, 164, 74, .16);
    background: rgba(10, 22, 32, .96);
    box-shadow: 0 8px 30px rgba(0,0,0,.14);
  }

  .brand {
    display: flex;
    flex: none;
    align-items: center;
    gap: .55rem;
    padding: 0 1.35rem;
    color: #d8b85e;
    font-size: .9rem;
    font-weight: 700;
    text-decoration: none;
  }

  .brand-mark {
    display: grid;
    width: 1.65rem;
    height: 1.65rem;
    place-items: center;
    border: 1px solid rgba(216,184,94,.45);
    border-radius: 50%;
    font: 600 .55rem/1 'IBM Plex Sans Condensed', sans-serif;
    letter-spacing: .06em;
  }

  .nav-links {
    display: flex;
    min-width: 0;
    align-items: stretch;
    gap: .1rem;
    overflow-x: auto;
    padding-right: 1rem;
    scrollbar-width: none;
  }

  .nav-links::-webkit-scrollbar { display: none; }

  .nav-links a {
    position: relative;
    display: flex;
    flex: none;
    align-items: center;
    padding: 0 .7rem;
    color: #aab5b1;
    font-size: .73rem;
    font-weight: 500;
    text-decoration: none;
    transition: color .18s ease, background .18s ease;
  }

  .nav-links a:hover { color: #f0f2e9; background: rgba(255,255,255,.025); }
  .nav-links a.active { color: #e7cf8a; }
  .nav-links a.active::after { content: ''; position: absolute; right: .7rem; bottom: 0; left: .7rem; height: 2px; background: #c9a44a; box-shadow: 0 -2px 8px rgba(201,164,74,.3); }

  @media (max-width: 680px) {
    .app-nav { min-height: 3rem; }
    .brand { padding: 0 .8rem; }
    .brand > span:last-child { display: none; }
    .nav-links a { padding: 0 .65rem; font-size: .68rem; }
  }
</style>
