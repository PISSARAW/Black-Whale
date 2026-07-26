<script lang="ts">
  import { onMount } from 'svelte'
  import { activeHatsu, activateHatsu, deactivateHatsu, hatsuPanelOpen } from './hatsuState.js'
  import { HATSU_PROFILES, hatsuById } from './hatsuRegistry.js'

  let query = ''

  $: filtered = HATSU_PROFILES.filter((profile) =>
    `${profile.name} ${profile.owner}`.toLowerCase().includes(query.trim().toLowerCase())
  )

  onMount(() => {
    const remembered = hatsuById(localStorage.getItem('black-whale:hatsu'))
    if (remembered) activeHatsu.set(remembered)

    const handleActivate = (event: Event) => {
      const id = (event as CustomEvent<string>).detail
      const profile = hatsuById(id)
      if (profile) activateHatsu(profile)
    }
    window.addEventListener('black-whale:activate-hatsu', handleActivate)
    return () => window.removeEventListener('black-whale:activate-hatsu', handleActivate)
  })
</script>

<div class="hatsu-dock" data-hatsu-ui>
  {#if $activeHatsu}
    <section class="active-card" style:--hatsu={$activeHatsu.color} aria-live="polite">
      <button class="sigil active" onclick={() => hatsuPanelOpen.update((open) => !open)} aria-label="Changer de Hatsu">
        <span class="aura-dot"></span>
        NEN
      </button>
      <div class="active-copy">
        <span class="eyebrow">HATSU ACTIF · {$activeHatsu.owner}</span>
        <strong>{$activeHatsu.name}</strong>
        <span class="instruction">{$activeHatsu.instruction}</span>
      </div>
      <button class="release" onclick={deactivateHatsu}>Zetsu · couper</button>
    </section>
  {:else}
    <button class="sigil launcher" onclick={() => hatsuPanelOpen.set(true)} aria-label="Activer un Hatsu">
      <span class="aura-dot"></span>
      NEN
    </button>
  {/if}

  {#if $hatsuPanelOpen}
    <div class="backdrop" onclick={() => hatsuPanelOpen.set(false)} role="presentation"></div>
    <section class="picker" aria-label="Sélection du Hatsu">
      <header>
        <div>
          <span class="eyebrow">SYSTÈME D’AURA GLOBAL</span>
          <h2>Activer une technique</h2>
        </div>
        <button class="close" onclick={() => hatsuPanelOpen.set(false)} aria-label="Fermer">×</button>
      </header>
      <input bind:value={query} placeholder="Technique ou utilisateur…" aria-label="Rechercher un Hatsu" />
      <div class="ability-list">
        {#each filtered as profile (profile.id)}
          <button class:current={$activeHatsu?.id === profile.id} onclick={() => activateHatsu(profile)} style:--hatsu={profile.color}>
            <span class="mini-sigil"></span>
            <span><strong>{profile.name}</strong><small>{profile.owner} · {profile.action}</small></span>
          </button>
        {/each}
      </div>
      <footer>{HATSU_PROFILES.length} techniques connues · l’activation persiste pendant la navigation</footer>
    </section>
  {/if}
</div>

<style>
  .hatsu-dock { position: fixed; z-index: 100; right: 1rem; bottom: 1rem; font-family: 'Space Grotesk', sans-serif; }
  .sigil { position: relative; display: grid; width: 3.65rem; height: 3.65rem; place-items: center; border: 1px solid rgba(216,184,94,.5); border-radius: 50%; background: #0a1620eF; color: #e7cf8a; box-shadow: 0 8px 35px #0009, inset 0 0 20px rgba(216,184,94,.08); font: 700 .62rem/1 'IBM Plex Sans Condensed', sans-serif; letter-spacing: .12em; cursor: pointer; }
  .sigil::before, .sigil::after { content: ''; position: absolute; border: 1px solid currentColor; border-radius: 50%; opacity: .22; }
  .sigil::before { inset: .35rem; } .sigil::after { inset: .72rem; }
  .sigil:hover { transform: translateY(-2px); box-shadow: 0 12px 40px #000b, 0 0 24px color-mix(in srgb, var(--hatsu, #d8b85e) 25%, transparent); }
  .aura-dot { position: absolute; top: -.1rem; right: .1rem; width: .65rem; height: .65rem; border: 2px solid #071019; border-radius: 50%; background: var(--hatsu, #d8b85e); box-shadow: 0 0 12px var(--hatsu, #d8b85e); }
  .active-card { display: flex; width: min(37rem, calc(100vw - 2rem)); align-items: center; gap: .8rem; padding: .6rem .7rem; border: 1px solid color-mix(in srgb, var(--hatsu) 45%, #263747); border-radius: 1rem; background: linear-gradient(110deg, #0b1722f5, #101a26f2); box-shadow: 0 18px 55px #000b, 0 0 28px color-mix(in srgb, var(--hatsu) 11%, transparent); backdrop-filter: blur(16px); }
  .active-card .sigil { flex: none; width: 3rem; height: 3rem; color: var(--hatsu); }
  .active-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; }
  .active-copy strong { overflow: hidden; color: #f4f3eb; font-size: .86rem; text-overflow: ellipsis; white-space: nowrap; }
  .eyebrow { color: color-mix(in srgb, var(--hatsu, #d8b85e) 85%, white); font: 600 .55rem/1.2 'IBM Plex Sans Condensed'; letter-spacing: .12em; }
  .instruction { margin-top: .18rem; overflow: hidden; color: #9da9aa; font-size: .65rem; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
  .release { flex: none; border: 1px solid #394655; border-radius: .45rem; background: transparent; padding: .48rem .6rem; color: #9ba6aa; font-size: .62rem; cursor: pointer; }
  .release:hover { border-color: var(--hatsu); color: #fff; }
  .backdrop { position: fixed; z-index: -1; inset: 0; background: #02060ab8; backdrop-filter: blur(3px); }
  .picker { position: absolute; right: 0; bottom: 4.5rem; display: flex; width: min(31rem, calc(100vw - 2rem)); max-height: min(42rem, calc(100vh - 7rem)); flex-direction: column; overflow: hidden; border: 1px solid #344555; border-radius: 1rem; background: #0b151ff8; box-shadow: 0 25px 80px #000e; }
  .picker header { display: flex; align-items: flex-start; justify-content: space-between; padding: 1rem 1rem .7rem; }
  .picker h2 { margin: .25rem 0 0; color: #f3f1e9; font-size: 1.2rem; }
  .close { border: 0; background: transparent; color: #7f8b93; font-size: 1.5rem; cursor: pointer; }
  .picker input { margin: 0 1rem .75rem; border: 1px solid #2a3a49; border-radius: .45rem; outline: none; background: #070e15; padding: .65rem .8rem; color: #e8ece6; font-size: .75rem; }
  .picker input:focus { border-color: #ad9350; }
  .ability-list { display: grid; grid-template-columns: 1fr 1fr; gap: .35rem; overflow-y: auto; padding: 0 .75rem .75rem; }
  .ability-list button { display: flex; min-width: 0; align-items: center; gap: .6rem; border: 1px solid #243443; border-radius: .55rem; background: #101b26; padding: .55rem; color: #d9dfda; text-align: left; cursor: pointer; }
  .ability-list button:hover, .ability-list button.current { border-color: var(--hatsu); background: color-mix(in srgb, var(--hatsu) 8%, #101b26); }
  .ability-list button > span:last-child { display: flex; min-width: 0; flex-direction: column; }
  .ability-list strong { overflow: hidden; font-size: .7rem; text-overflow: ellipsis; white-space: nowrap; }
  .ability-list small { overflow: hidden; margin-top: .15rem; color: #78858c; font-size: .57rem; text-overflow: ellipsis; white-space: nowrap; }
  .mini-sigil { width: .65rem; height: .65rem; flex: none; border: 1px solid var(--hatsu); border-radius: 50%; background: color-mix(in srgb, var(--hatsu) 25%, transparent); box-shadow: 0 0 8px color-mix(in srgb, var(--hatsu) 40%, transparent); }
  .picker footer { border-top: 1px solid #22313e; padding: .65rem 1rem; color: #68757d; font-size: .6rem; }
  @media (max-width: 620px) { .active-copy .instruction { display: none; } .release { padding: .45rem; } .ability-list { grid-template-columns: 1fr; } }
</style>
