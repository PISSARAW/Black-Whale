<script lang="ts">
  import { onMount } from 'svelte'
  import {
    activeHatsu,
    activateHatsu,
    deactivateHatsu,
    forcedZetsuUntil,
    hatsuGate,
    hatsuIsBlocked,
    hatsuPanelOpen,
    hydrateHatsuSession,
    refreshForcedZetsu,
  } from './hatsuState.js'
  import { HATSU_PROFILES, hatsuById } from './hatsuRegistry.js'
  import { locale, t } from '$lib/i18n'
  import { localizeHatsu, localizeHatsuList } from '$lib/i18n/hatsu'

  let query = ''
  let now = Date.now()

  // Searching the visitor's own names, not the English ones behind them.
  $: localizedProfiles = localizeHatsuList(HATSU_PROFILES, $locale)
  $: filtered = localizedProfiles.filter((profile) =>
    `${profile.name} ${profile.owner}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  $: activeProfile = $activeHatsu ? localizeHatsu($activeHatsu, $locale) : null
  $: zetsuRemaining = Math.max(0, $forcedZetsuUntil - now)

  // What the room in charge still admits. The dock does not know what that
  // room is — it shows the sentence the room handed it and disables the rest.
  $: blockedIds = new Set(
    localizedProfiles.filter((profile) => hatsuIsBlocked(profile, $hatsuGate)).map(({ id }) => id),
  )
  $: admitted = filtered.filter((profile) => !blockedIds.has(profile.id)).length
  $: activeIsBlocked = Boolean($activeHatsu) && hatsuIsBlocked($activeHatsu!, $hatsuGate)

  function formatRemaining(milliseconds: number) {
    const totalSeconds = Math.ceil(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    return `${String(minutes).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`
  }

  onMount(() => {
    hydrateHatsuSession()
    const remembered = hatsuById(sessionStorage.getItem('black-whale:hatsu'))
    if (remembered) activateHatsu(remembered)

    const clock = window.setInterval(() => {
      now = Date.now()
      refreshForcedZetsu()
    }, 1000)

    const handleActivate = (event: Event) => {
      const id = (event as CustomEvent<string>).detail
      const profile = hatsuById(id)
      if (profile) activateHatsu(profile)
    }
    window.addEventListener('black-whale:activate-hatsu', handleActivate)
    return () => {
      clearInterval(clock)
      window.removeEventListener('black-whale:activate-hatsu', handleActivate)
    }
  })
</script>

<div class="hatsu-dock" data-hatsu-ui>
  {#if zetsuRemaining > 0}
    <section class="zetsu-card" aria-live="polite">
      <span class="zetsu-mark">絶</span>
      <div>
        <span class="eyebrow">{$t.nen.forcedZetsu}</span>
        <strong>{$t.nen.nenSealed(formatRemaining(zetsuRemaining))}</strong>
        <small>{$t.nen.zetsuCost}</small>
      </div>
    </section>
  {:else if activeProfile}
    <section class="active-card" style:--hatsu={activeProfile.color} aria-live="polite">
      <button
        class="sigil active"
        onclick={() => hatsuPanelOpen.update((open) => !open)}
        aria-label={$t.nen.changeHatsu}
      >
        <span class="aura-dot"></span>
        NEN
      </button>
      <div class="active-copy">
        <span class="eyebrow">{$t.nen.activeHatsu(activeProfile.owner)}</span>
        <strong>{activeProfile.name}</strong>
        <!-- Still in hand, and still doing nothing: the room said so, and it
             is better said here than left for the visitor to work out. -->
        <span class="instruction" class:sealed={activeIsBlocked}>
          {activeIsBlocked && $hatsuGate ? $hatsuGate.reason : activeProfile.instruction}
        </span>
      </div>
      <button type="button" class="release" data-hatsu-release onclick={deactivateHatsu}
        >{$t.nen.release}</button
      >
    </section>
  {:else}
    <button
      class="sigil launcher"
      onclick={() => hatsuPanelOpen.set(true)}
      aria-label={$t.nen.activateAHatsu}
    >
      <span class="aura-dot"></span>
      NEN
    </button>
  {/if}

  {#if $hatsuPanelOpen}
    <div class="backdrop" onclick={() => hatsuPanelOpen.set(false)} role="presentation"></div>
    <section class="picker" aria-label={$t.nen.pickerLabel}>
      <header>
        <div>
          <span class="eyebrow">{$t.nen.globalAura}</span>
          <h2>{$t.nen.activateTechnique}</h2>
        </div>
        <button class="close" onclick={() => hatsuPanelOpen.set(false)} aria-label={$t.common.close}
          >×</button
        >
      </header>
      <input
        bind:value={query}
        placeholder={$t.nen.searchPlaceholder}
        aria-label={$t.nen.searchHatsu}
      />
      <div class="ability-list">
        {#each filtered as profile (profile.id)}
          <button
            class:current={$activeHatsu?.id === profile.id}
            class:blocked={blockedIds.has(profile.id)}
            disabled={blockedIds.has(profile.id)}
            title={blockedIds.has(profile.id) && $hatsuGate
              ? $hatsuGate.reason
              : profile.instruction}
            onclick={() => activateHatsu(profile)}
            style:--hatsu={profile.color}
          >
            <span class="mini-sigil"></span>
            <span
              ><strong>{profile.name}</strong><small
                >{profile.owner} · {blockedIds.has(profile.id)
                  ? $t.nen.gateBadge
                  : profile.action}</small
              ></span
            >
          </button>
        {/each}
      </div>
      <footer>
        {$hatsuGate
          ? $t.nen.gateFooter(admitted, $hatsuGate.reason)
          : $t.nen.pickerFooter(HATSU_PROFILES.length)}
      </footer>
    </section>
  {/if}
</div>

<style>
  .hatsu-dock {
    position: fixed;
    z-index: 100;
    right: 1rem;
    bottom: 1rem;
    font-family: 'Space Grotesk', sans-serif;
  }
  .sigil {
    position: relative;
    display: grid;
    width: 3.65rem;
    height: 3.65rem;
    place-items: center;
    border: 1px solid rgba(216, 184, 94, 0.5);
    border-radius: 50%;
    background: #0a1620ef;
    color: #e7cf8a;
    box-shadow:
      0 8px 35px #0009,
      inset 0 0 20px rgba(216, 184, 94, 0.08);
    font:
      700 0.62rem/1 'IBM Plex Sans Condensed',
      sans-serif;
    letter-spacing: 0.12em;
    cursor: pointer;
  }
  .sigil::before,
  .sigil::after {
    content: '';
    position: absolute;
    border: 1px solid currentColor;
    border-radius: 50%;
    opacity: 0.22;
  }
  .sigil::before {
    inset: 0.35rem;
  }
  .sigil::after {
    inset: 0.72rem;
  }
  .sigil:hover {
    transform: translateY(-2px);
    box-shadow:
      0 12px 40px #000b,
      0 0 24px color-mix(in srgb, var(--hatsu, #d8b85e) 25%, transparent);
  }
  .aura-dot {
    position: absolute;
    top: -0.1rem;
    right: 0.1rem;
    width: 0.65rem;
    height: 0.65rem;
    border: 2px solid #071019;
    border-radius: 50%;
    background: var(--hatsu, #d8b85e);
    box-shadow: 0 0 12px var(--hatsu, #d8b85e);
  }
  .active-card {
    display: flex;
    width: min(37rem, calc(100vw - 2rem));
    align-items: center;
    gap: 0.8rem;
    padding: 0.6rem 0.7rem;
    border: 1px solid color-mix(in srgb, var(--hatsu) 45%, #263747);
    border-radius: 1rem;
    background: linear-gradient(110deg, #0b1722f5, #101a26f2);
    box-shadow:
      0 18px 55px #000b,
      0 0 28px color-mix(in srgb, var(--hatsu) 11%, transparent);
    backdrop-filter: blur(16px);
  }
  .zetsu-card {
    display: flex;
    width: min(25rem, calc(100vw - 2rem));
    align-items: center;
    gap: 0.8rem;
    padding: 0.7rem 0.9rem;
    border: 1px solid #52606b;
    border-radius: 1rem;
    background: #080d12f5;
    box-shadow: 0 18px 55px #000c;
  }
  .zetsu-card > div {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }
  .zetsu-card .eyebrow {
    color: #a8b0b5;
  }
  .zetsu-card strong {
    margin-top: 0.15rem;
    color: #eef0eb;
    font-size: 0.8rem;
  }
  .zetsu-card small {
    margin-top: 0.15rem;
    color: #758087;
    font-size: 0.6rem;
  }
  .zetsu-mark {
    display: grid;
    width: 2.8rem;
    height: 2.8rem;
    flex: none;
    place-items: center;
    border: 1px solid #52606b;
    border-radius: 50%;
    color: #a8b0b5;
    font-size: 1rem;
  }
  .active-card .sigil {
    flex: none;
    width: 3rem;
    height: 3rem;
    color: var(--hatsu);
  }
  .active-copy {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
  }
  .active-copy strong {
    overflow: hidden;
    color: #f4f3eb;
    font-size: 0.86rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .eyebrow {
    color: color-mix(in srgb, var(--hatsu, #d8b85e) 85%, white);
    font: 600 0.55rem/1.2 'IBM Plex Sans Condensed';
    letter-spacing: 0.12em;
  }
  .instruction {
    margin-top: 0.18rem;
    overflow: hidden;
    color: #9da9aa;
    font-size: 0.65rem;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .release {
    flex: none;
    border: 1px solid #394655;
    border-radius: 0.45rem;
    background: transparent;
    padding: 0.48rem 0.6rem;
    color: #9ba6aa;
    font-size: 0.62rem;
    cursor: pointer;
  }
  .release:hover {
    border-color: var(--hatsu);
    color: #fff;
  }
  .backdrop {
    position: fixed;
    z-index: -1;
    inset: 0;
    background: #02060ab8;
    backdrop-filter: blur(3px);
  }
  .picker {
    position: absolute;
    right: 0;
    bottom: 4.5rem;
    display: flex;
    width: min(31rem, calc(100vw - 2rem));
    max-height: min(42rem, calc(100vh - 7rem));
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #344555;
    border-radius: 1rem;
    background: #0b151ff8;
    box-shadow: 0 25px 80px #000e;
  }
  .picker header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 1rem 1rem 0.7rem;
  }
  .picker h2 {
    margin: 0.25rem 0 0;
    color: #f3f1e9;
    font-size: 1.2rem;
  }
  .close {
    border: 0;
    background: transparent;
    color: #7f8b93;
    font-size: 1.5rem;
    cursor: pointer;
  }
  .picker input {
    margin: 0 1rem 0.75rem;
    border: 1px solid #2a3a49;
    border-radius: 0.45rem;
    outline: none;
    background: #070e15;
    padding: 0.65rem 0.8rem;
    color: #e8ece6;
    font-size: 0.75rem;
  }
  .picker input:focus {
    border-color: #ad9350;
  }
  .ability-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.35rem;
    overflow-y: auto;
    padding: 0 0.75rem 0.75rem;
  }
  .ability-list button {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.6rem;
    border: 1px solid #243443;
    border-radius: 0.55rem;
    background: #101b26;
    padding: 0.55rem;
    color: #d9dfda;
    text-align: left;
    cursor: pointer;
  }
  /* Turned away rather than hidden: knowing a technique exists and does not
     work here is worth more than a shorter list. */
  .ability-list button.blocked {
    border-color: #1b2530;
    background: #0a1017;
    color: #4d585f;
    cursor: not-allowed;
  }
  .ability-list button.blocked .mini-sigil {
    border-color: #3a464f;
    background: transparent;
    box-shadow: none;
  }
  .instruction.sealed {
    color: #7d878c;
    font-style: italic;
    white-space: normal;
  }
  .ability-list button:hover:not(.blocked),
  .ability-list button.current {
    border-color: var(--hatsu);
    background: color-mix(in srgb, var(--hatsu) 8%, #101b26);
  }
  .ability-list button > span:last-child {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }
  .ability-list strong {
    overflow: hidden;
    font-size: 0.7rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ability-list small {
    overflow: hidden;
    margin-top: 0.15rem;
    color: #78858c;
    font-size: 0.57rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mini-sigil {
    width: 0.65rem;
    height: 0.65rem;
    flex: none;
    border: 1px solid var(--hatsu);
    border-radius: 50%;
    background: color-mix(in srgb, var(--hatsu) 25%, transparent);
    box-shadow: 0 0 8px color-mix(in srgb, var(--hatsu) 40%, transparent);
  }
  .picker footer {
    border-top: 1px solid #22313e;
    padding: 0.65rem 1rem;
    color: #68757d;
    font-size: 0.6rem;
  }
  @media (max-width: 620px) {
    .active-copy .instruction {
      display: none;
    }
    .release {
      padding: 0.45rem;
    }
    .ability-list {
      grid-template-columns: 1fr;
    }
  }
</style>
