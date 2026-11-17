<script lang="ts">
  import { onMount } from 'svelte'
  import { clashPresentation } from '$lib/fighting/presentation/profile'
  import {
    PALETTES,
    paletteUnlocked,
    type Palette,
    type Title,
  } from '$lib/fighting/presentation/collection'
  import { SOLO_ROUTES } from '$lib/fighting/solo/catalogue'
  import FightWardrobePreview from './FightWardrobePreview.svelte'
  export let language: 'fr' | 'en'
  $: fr = language === 'fr'
  $: profile = $clashPresentation
  onMount(() => {
    clashPresentation.load()
    const refresh = () => clashPresentation.load()
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  })
</script>

<section class="wardrobe" aria-label={fr ? 'Collection et tenues' : 'Collection and outfits'}>
  <h2>{fr ? 'Collection et tenues' : 'Collection and outfits'}</h2>
  <p>
    {fr
      ? 'Palettes originales de Clash : mêmes coupes, armes et repères de Nen. Sélections locales pour P1 et P2, sans bonus de combat.'
      : 'Original Clash palettes: same cuts, weapons and Nen cues. Local selections for P1 and P2, with no combat bonus.'}
  </p>
  <label
    >{fr ? 'Titre du profil local' : 'Local profile title'}
    <select
      aria-label={fr ? 'Titre du profil local' : 'Local profile title'}
      value={profile.preferences.title}
      on:change={(event) =>
        clashPresentation.configure({ title: event.currentTarget.value as Title })}
    >
      <option value="none">{fr ? 'Aucun titre' : 'No title'}</option>
      {#each SOLO_ROUTES as route (route.id)}
        <option value={route.id} disabled={!profile.routes.includes(route.id)}
          >{route.reward[fr ? 0 : 1]}{profile.routes.includes(route.id)
            ? ''
            : fr
              ? ' · à débloquer'
              : ' · locked'}</option
        >
      {/each}
    </select>
  </label>
  <div class="seats">
    {#each ['player', 'opponent'] as const as side (side)}
      <label
        >{side === 'player' ? 'P1' : 'P2'} · {fr ? 'tenue' : 'outfit'}
        <select
          aria-label={`${side === 'player' ? 'P1' : 'P2'} · ${fr ? 'tenue' : 'outfit'}`}
          value={profile.preferences[side]}
          on:change={(event) =>
            clashPresentation.configure({ [side]: event.currentTarget.value as Palette })}
        >
          {#each PALETTES as palette (palette.id)}
            <option value={palette.id} disabled={!paletteUnlocked(palette.id, profile.routes)}
              >{palette.label[fr ? 0 : 1]}</option
            >
          {/each}
        </select>
      </label>
    {/each}
  </div>
  <ul>
    {#each SOLO_ROUTES as route (route.id)}
      <li>
        <strong>{route.reward[fr ? 0 : 1]}</strong> · {route.title[fr ? 0 : 1]} — {profile.routes.includes(
          route.id,
        )
          ? fr
            ? 'obtenu'
            : 'earned'
          : fr
            ? 'terminer le parcours'
            : 'complete the route'}{route.id === 'escort'
          ? fr
            ? ' · débloque aussi la tenue ivoire'
            : ' · also unlocks the ivory outfit'
          : ''}
      </li>
    {/each}
  </ul>
  <p class="note">
    {fr
      ? 'Les titres proviennent des fins des parcours solo sauvegardées sur cet appareil. Les transformations, déguisements et vidéos de victoire gardent leurs tenues de référence.'
      : 'Titles come from solo route endings saved on this device. Transformations, disguises and victory videos retain their reference outfits.'}
  </p>
  {#if !profile.persisted}<p role="status">
      {fr
        ? 'Stockage indisponible : sélection pour cette session.'
        : 'Storage unavailable: selection lasts for this session.'}
    </p>{/if}
  <FightWardrobePreview {language} />
</section>

<style>
  .wardrobe {
    margin-block: 1rem;
    padding: 1rem;
    border: 1px solid #53647b;
    border-radius: 0.6rem;
    background: #101b2b;
    color: #e2e8f0;
  }
  h2 {
    margin-top: 0;
  }
  p,
  li {
    font-size: 0.85rem;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  label {
    display: grid;
    gap: 0.4rem;
    min-width: 0;
    margin-block: 0.75rem;
  }
  select {
    width: 100%;
    min-width: 0;
    min-height: 44px;
    color: #f8fafc;
    background: #17263b;
    border: 1px solid #73839a;
    border-radius: 0.3rem;
    padding: 0.5rem;
  }
  .seats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
  ul {
    padding-left: 1.1rem;
  }
  .note {
    color: #bdccdf;
  }
  @media (max-width: 420px) {
    .seats {
      grid-template-columns: 1fr;
    }
  }
</style>
