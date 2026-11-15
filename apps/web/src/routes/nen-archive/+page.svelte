<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import NenArchiveScene from '$lib/nen/NenArchiveScene.svelte'
  import { NEN_ARCHIVE_ENTRIES, archiveCopy, type NenArchiveEntry } from '$lib/nen/archive'
  import { locale } from '$lib/i18n'

  type Filter = 'all' | NenArchiveEntry['category']

  let selected = NEN_ARCHIVE_ENTRIES[0]
  let filter: Filter = 'all'
  let query = ''
  let command = ''
  let techniqueSignal = 0
  let crySignal = 0
  let techniqueActive = false
  let status = ''
  let statusTimeout: ReturnType<typeof setTimeout> | undefined
  let audioContext: AudioContext | undefined

  $: copy = $locale === 'fr'
  $: visibleEntries = NEN_ARCHIVE_ENTRIES.filter((entry) => {
    const needle = query.trim().toLocaleLowerCase($locale)
    const haystack =
      `${archiveCopy(entry.name, $locale)} ${archiveCopy(entry.alias, $locale)} ${archiveCopy(entry.description, $locale)}`.toLocaleLowerCase(
        $locale,
      )
    return (filter === 'all' || entry.category === filter) && (!needle || haystack.includes(needle))
  })

  function announce(message: string) {
    status = message
    if (statusTimeout) clearTimeout(statusTimeout)
    statusTimeout = setTimeout(() => (status = ''), 4200)
  }

  function choose(entry: NenArchiveEntry) {
    selected = entry
    techniqueActive = false
    announce(
      copy
        ? `${archiveCopy(entry.name, 'fr')} chargé dans le scanner.`
        : `${archiveCopy(entry.name, 'en')} loaded into the scanner.`,
    )
  }

  function context() {
    audioContext ??= new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume()
    return audioContext
  }

  function tone(
    ctx: AudioContext,
    frequency: number,
    at: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.07,
    endFrequency?: number,
  ) {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, at)
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, at + duration)
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(volume, at + Math.min(0.035, duration / 4))
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(at)
    oscillator.stop(at + duration + 0.02)
  }

  function playCry() {
    crySignal += 1
    const ctx = context()
    const now = ctx.currentTime + 0.015
    if (selected.sound === 'growl') {
      tone(ctx, 92, now, 0.68, 'sawtooth', 0.045, 46)
      tone(ctx, 136, now + 0.08, 0.52, 'triangle', 0.055, 71)
      tone(ctx, 210, now + 0.32, 0.22, 'square', 0.018, 120)
    } else if (selected.sound === 'paper') {
      for (let index = 0; index < 7; index += 1)
        tone(ctx, 900 - index * 78, now + index * 0.045, 0.08, 'triangle', 0.018)
      tone(ctx, 118, now + 0.28, 0.38, 'sine', 0.055, 82)
    } else if (selected.sound === 'signal') {
      tone(ctx, 880, now, 0.1, 'square', 0.035)
      tone(ctx, 1174, now + 0.14, 0.1, 'square', 0.035)
      tone(ctx, 1568, now + 0.28, 0.24, 'square', 0.03)
    } else if (selected.sound === 'whisper') {
      tone(ctx, 310, now, 0.8, 'sine', 0.025, 178)
      tone(ctx, 467, now + 0.08, 0.68, 'triangle', 0.025, 233)
      tone(ctx, 620, now + 0.18, 0.5, 'sine', 0.018, 350)
    } else {
      tone(ctx, 523, now, 0.24, 'sine', 0.055)
      tone(ctx, 659, now + 0.16, 0.24, 'sine', 0.05)
      tone(ctx, 784, now + 0.32, 0.5, 'sine', 0.045)
    }
    announce(
      copy
        ? `Cri de ${archiveCopy(selected.name, 'fr')} reproduit.`
        : `${archiveCopy(selected.name, 'en')} call reproduced.`,
    )
  }

  function activateTechnique() {
    techniqueSignal += 1
    techniqueActive = true
    const ctx = context()
    const now = ctx.currentTime + 0.015
    tone(ctx, 86, now, 0.85, 'sine', 0.055, 210)
    tone(ctx, 172, now + 0.14, 0.7, 'triangle', 0.035, 420)
    setTimeout(() => (techniqueActive = false), 3600)
    announce(
      copy
        ? `${archiveCopy(selected.technique, 'fr')} activée.`
        : `${archiveCopy(selected.technique, 'en')} activated.`,
    )
  }

  function moveSelection(direction: 1 | -1) {
    const entries = visibleEntries.length ? visibleEntries : NEN_ARCHIVE_ENTRIES
    const index = entries.findIndex((entry) => entry.id === selected.id)
    choose(entries[(Math.max(index, 0) + direction + entries.length) % entries.length])
  }

  function runCommand() {
    const request = command.trim().toLocaleLowerCase($locale)
    if (!request) return
    command = ''
    if (/technique|pouvoir|hatsu|active|activate|ability|ouvre|open/.test(request)) {
      activateTechnique()
      return
    }
    if (/cri|bruit|son|cry|sound|roar|voix/.test(request)) {
      playCry()
      return
    }
    if (/suivant|next/.test(request)) {
      moveSelection(1)
      return
    }
    if (/précédent|precedent|previous|back/.test(request)) {
      moveSelection(-1)
      return
    }
    const match = NEN_ARCHIVE_ENTRIES.find((entry) => {
      const names =
        `${archiveCopy(entry.name, 'fr')} ${archiveCopy(entry.name, 'en')} ${archiveCopy(entry.alias, 'fr')}`.toLocaleLowerCase(
          $locale,
        )
      return names.split(/\s+/).some((word) => word.length > 4 && request.includes(word))
    })
    if (match) {
      choose(match)
      return
    }
    announce(
      copy
        ? 'Commande inconnue. Essaie « active sa technique », « fais son cri » ou « suivant ».'
        : 'Unknown command. Try “activate its ability”, “play its cry” or “next”.',
    )
  }
</script>

<Seo
  title={copy ? 'NenDex — Archives vivantes du Nen' : 'NenDex — Living Nen Archive'}
  description={copy
    ? 'Explorez des bêtes, objets et constructions de Nen en 360°, déclenchez leurs techniques et écoutez leurs signatures sonores.'
    : 'Explore Nen beasts, objects and constructs in 360°, trigger their abilities and hear their sound signatures.'}
/>

<svelte:head>
  <meta name="theme-color" content="#061011" />
</svelte:head>

<div
  class="archive"
  class:technique-active={techniqueActive}
  style={`--specimen-color:${selected.color};--specimen-accent:${selected.accent}`}
>
  <header class="archive-header">
    <div class="title-block">
      <p class="eyebrow">{copy ? 'ARCHIVES DE NEN' : 'NEN ARCHIVE'}</p>
      <h1>Nen<span>Dex</span></h1>
      <p>{copy ? 'Archives vivantes · Black Whale' : 'Living archive · Black Whale'}</p>
    </div>
    <div class="archive-status" aria-label={copy ? 'Taille de la collection' : 'Collection size'}>
      <strong>{NEN_ARCHIVE_ENTRIES.length}</strong>
      <span>{copy ? 'entrées documentées' : 'documented entries'}</span>
    </div>
  </header>

  <div class="archive-grid">
    <aside class="catalogue" aria-label={copy ? 'Catalogue du Nen' : 'Nen catalogue'}>
      <div class="catalogue-tools">
        <label>
          <span>{copy ? 'RECHERCHER' : 'SEARCH'}</span>
          <input
            bind:value={query}
            type="search"
            placeholder={copy ? 'Nom, type, capacité…' : 'Name, type, ability…'}
          />
        </label>
        <div class="filters" aria-label={copy ? 'Filtres' : 'Filters'}>
          {#each [['all', copy ? 'Tout' : 'All'], ['beast', copy ? 'Bêtes' : 'Beasts'], ['object', copy ? 'Objets' : 'Objects'], ['construct', copy ? 'Constructions' : 'Constructs']] as option}
            <button
              class:active={filter === option[0]}
              type="button"
              onclick={() => (filter = option[0] as Filter)}
            >
              {option[1]}
            </button>
          {/each}
        </div>
      </div>

      <div class="entry-list">
        {#each visibleEntries as entry (entry.id)}
          <button
            class="entry"
            class:selected={selected.id === entry.id}
            type="button"
            aria-pressed={selected.id === entry.id}
            onclick={() => choose(entry)}
          >
            <span class="entry-index">{entry.number}</span>
            <span class="entry-mark" style={`--entry-color:${entry.color}`}>
              {#if entry.category === 'beast'}◉{:else if entry.category === 'object'}▰{:else}✦{/if}
            </span>
            <span class="entry-copy">
              <strong>{archiveCopy(entry.name, $locale)}</strong>
              <small>{archiveCopy(entry.alias, $locale)}</small>
            </span>
            <span class="entry-arrow" aria-hidden="true">↗</span>
          </button>
        {:else}
          <p class="empty">{copy ? 'Aucune entrée ne correspond.' : 'No matching entry.'}</p>
        {/each}
      </div>
    </aside>

    <main class="specimen-panel">
      <div class="viewer">
        <div class="viewer-grid" aria-hidden="true"></div>
        <div class="viewer-vignette" aria-hidden="true"></div>
        <NenArchiveScene
          kind={selected.kind}
          color={selected.color}
          {techniqueSignal}
          {crySignal}
          label={copy
            ? `Modèle 3D de ${archiveCopy(selected.name, 'fr')}. Glissez pour tourner autour.`
            : `3D model of ${archiveCopy(selected.name, 'en')}. Drag to rotate.`}
          loadingLabel={copy ? 'Construction du modèle…' : 'Loading model…'}
        />

        <div class="viewer-topline">
          <span>{archiveCopy(selected.environment, $locale)}</span>
          <span>{selected.number}</span>
        </div>
        <div class="interaction-hint">
          <span>↔</span>
          {copy ? 'GLISSEZ POUR EXAMINER' : 'DRAG TO EXAMINE'}
        </div>
        {#if techniqueActive}
          <div class="technique-flash" aria-hidden="true">
            <span>{archiveCopy(selected.technique, $locale)}</span>
          </div>
        {/if}
      </div>

      <section class="dossier" aria-labelledby="specimen-name">
        <div class="dossier-heading">
          <div>
            <p class="dossier-number">{selected.number} // {selected.category.toUpperCase()}</p>
            <h2 id="specimen-name">{archiveCopy(selected.name, $locale)}</h2>
            <p>{archiveCopy(selected.alias, $locale)}</p>
          </div>
          <div class="aura-sample" aria-label={copy ? 'Signature d’aura' : 'Aura signature'}>
            <i></i><i></i><i></i><i></i><i></i>
          </div>
        </div>

        <p class="description">{archiveCopy(selected.description, $locale)}</p>

        <div class="traits" aria-label={copy ? 'Propriétés' : 'Properties'}>
          {#each archiveCopy(selected.traits, $locale) as trait}
            <span>{trait}</span>
          {/each}
        </div>

        <div class="technique-card">
          <div>
            <span>{copy ? 'TECHNIQUE OBSERVÉE' : 'OBSERVED ABILITY'}</span>
            <h3>{archiveCopy(selected.technique, $locale)}</h3>
            <p>{archiveCopy(selected.techniqueDescription, $locale)}</p>
          </div>
          <button type="button" onclick={activateTechnique}>
            <span aria-hidden="true">✦</span>
            {copy ? 'ACTIVER' : 'ACTIVATE'}
          </button>
        </div>

        <div class="action-row">
          <button class="cry-button" type="button" onclick={playCry}>
            <span class="sound-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
            <span
              ><small>{copy ? 'SIGNATURE SONORE' : 'SOUND SIGNATURE'}</small>{copy
                ? 'Faire son cri'
                : 'Play its call'}</span
            >
          </button>
          <div class="command-line">
            <label for="nen-command"
              >{copy ? 'COMMANDE VOCALE / TEXTE' : 'VOICE / TEXT COMMAND'}</label
            >
            <form
              onsubmit={(event) => {
                event.preventDefault()
                runCommand()
              }}
            >
              <span aria-hidden="true">›</span>
              <input
                id="nen-command"
                bind:value={command}
                autocomplete="off"
                placeholder={copy ? 'Ex. « Active sa technique »' : 'E.g. “Activate its ability”'}
              />
              <button type="submit" aria-label={copy ? 'Envoyer la commande' : 'Send command'}
                >↵</button
              >
            </form>
          </div>
        </div>
      </section>
    </main>
  </div>

  <div class="sr-status" aria-live="polite">{status}</div>
  {#if status}<div class="toast" role="status">{status}</div>{/if}
</div>

<style>
  :global(.route-shell:has(.archive)) {
    background: var(--surface-void);
  }

  .archive {
    box-sizing: border-box;
    width: 100%;
    min-height: calc(100vh - var(--header-height));
    max-width: 1440px;
    margin: 0 auto;
    padding: clamp(2rem, 4vw, 3.5rem) var(--page-gutter) 4rem;
    color: var(--text-primary);
  }

  .archive-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--line-default);
  }

  .title-block .eyebrow {
    margin: 0 0 0.75rem;
    color: var(--accent-gold-bright);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .title-block h1 {
    margin: 0;
    font-size: clamp(2.8rem, 5vw, 4.4rem);
    font-weight: 450;
    letter-spacing: -0.035em;
    line-height: 1;
  }

  .title-block h1 span {
    color: var(--accent-gold-bright);
  }

  .title-block > p:last-child {
    margin: 1rem 0 0;
    color: var(--text-secondary);
    font-size: 0.92rem;
  }

  .archive-status {
    display: grid;
    grid-template-columns: auto auto;
    align-items: baseline;
    gap: 0.55rem;
    padding-left: 1.5rem;
    border-left: 1px solid var(--line-default);
    color: var(--text-secondary);
  }

  .archive-status strong {
    color: var(--accent-gold-bright);
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 400;
  }

  .archive-status span {
    max-width: 8rem;
    font-size: 0.72rem;
    line-height: 1.4;
  }

  .archive-grid {
    display: grid;
    grid-template-columns: minmax(14rem, 17rem) minmax(0, 1fr);
    align-items: start;
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .catalogue {
    min-width: 0;
  }

  .catalogue-tools {
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--line-default);
  }

  .catalogue-tools label > span,
  .command-line > label {
    display: block;
    margin-bottom: 0.45rem;
    color: var(--text-secondary);
    font-size: 0.7rem;
  }

  .catalogue-tools input {
    width: 100%;
    min-height: 44px;
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--line-default);
    border-radius: var(--radius-sm);
    background: var(--surface-deep);
    color: var(--text-primary);
    font-size: 0.82rem;
  }

  .catalogue-tools input:focus {
    border-color: var(--accent-gold);
    outline: none;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.75rem;
  }

  .filters button {
    min-height: 34px;
    padding: 0.4rem 0.6rem;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.68rem;
  }

  .filters button:hover,
  .filters button.active {
    border-color: var(--line-default);
    background: var(--surface-panel);
    color: var(--accent-gold-bright);
  }

  .entry-list {
    display: grid;
    max-height: clamp(25rem, calc(100dvh - 26rem), 34.5rem);
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-color: var(--line-default) transparent;
    scrollbar-width: thin;
  }

  .entry {
    position: relative;
    display: grid;
    min-height: 5.25rem;
    grid-template-columns: 2.25rem minmax(0, 1fr) 1rem;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 0.65rem;
    border: 0;
    border-bottom: 1px solid var(--line-subtle);
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-align: left;
  }

  .entry:hover,
  .entry.selected {
    background: var(--surface-panel);
  }

  .entry.selected::before {
    position: absolute;
    inset: 0 auto 0 0;
    width: 2px;
    background: var(--accent-gold-bright);
    content: '';
  }

  .entry-index {
    position: absolute;
    top: 0.45rem;
    right: 0.6rem;
    color: var(--text-faint);
    font-family: var(--font-mono);
    font-size: 0.48rem;
  }

  .entry-mark {
    display: grid;
    width: 2.1rem;
    height: 2.1rem;
    place-items: center;
    border: 1px solid var(--line-default);
    border-radius: var(--radius-sm);
    color: var(--entry-color);
    font-size: 0.7rem;
  }

  .entry-copy {
    min-width: 0;
  }

  .entry-copy strong,
  .entry-copy small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entry-copy strong {
    color: var(--text-primary);
    font-size: 0.82rem;
    font-weight: 600;
  }

  .entry-copy small {
    margin-top: 0.3rem;
    color: var(--text-muted);
    font-size: 0.65rem;
  }

  .entry-arrow {
    color: var(--text-faint);
    font-size: 0.7rem;
  }

  .entry:hover .entry-arrow,
  .entry.selected .entry-arrow {
    color: var(--accent-gold-bright);
  }

  .empty {
    margin: 0;
    padding: 1.5rem 0;
    color: var(--text-secondary);
    font-size: 0.8rem;
  }

  .specimen-panel {
    display: grid;
    height: clamp(34rem, calc(100dvh - 18.5rem), 42rem);
    min-width: 0;
    min-height: 0;
    grid-template-columns: minmax(0, 1.35fr) minmax(18rem, 0.75fr);
    overflow: hidden;
    border: 1px solid var(--line-default);
    border-radius: var(--radius-md);
    background: var(--surface-deep);
  }

  .viewer {
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border-right: 1px solid var(--line-default);
    background:
      radial-gradient(
        circle at 50% 44%,
        color-mix(in srgb, var(--specimen-color) 9%, transparent),
        transparent 42%
      ),
      var(--surface-void);
  }

  .viewer-grid {
    display: none;
  }

  .viewer-vignette {
    position: absolute;
    z-index: 2;
    inset: 0;
    pointer-events: none;
    box-shadow: inset 0 0 7rem 1rem rgba(0, 0, 0, 0.62);
  }

  .viewer-topline,
  .interaction-hint {
    position: absolute;
    z-index: 4;
    pointer-events: none;
  }

  .viewer-topline {
    top: 1.25rem;
    right: 1.25rem;
    left: 1.25rem;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    color: var(--text-muted);
    font-size: 0.68rem;
  }

  .viewer-topline span:last-child {
    color: var(--accent-gold-bright);
    font-family: var(--font-mono);
  }

  .interaction-hint {
    bottom: 1.25rem;
    left: 50%;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    color: var(--text-secondary);
    font-size: 0.68rem;
    transform: translateX(-50%);
    white-space: nowrap;
  }

  .interaction-hint span {
    color: var(--accent-gold-bright);
    font-size: 1rem;
  }

  .technique-flash {
    position: absolute;
    z-index: 5;
    inset: 0;
    display: grid;
    place-items: center;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--specimen-color) 18%, transparent),
      transparent 55%
    );
    pointer-events: none;
    animation: flash 1.5s ease both;
  }

  .technique-flash span {
    padding: 0.75rem 1rem;
    border: 1px solid var(--accent-gold);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--surface-deep) 92%, transparent);
    color: var(--text-primary);
    font-size: 0.75rem;
  }

  @keyframes flash {
    0% {
      opacity: 0;
      transform: scale(0.98);
    }
    12%,
    70% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.02);
    }
  }

  .dossier {
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: clamp(1.5rem, 3vw, 2.5rem);
    background: var(--surface-deep);
    scrollbar-color: var(--line-default) transparent;
    scrollbar-width: thin;
  }

  .dossier-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--line-default);
  }

  .dossier-number {
    margin: 0 0 0.7rem;
    color: var(--accent-gold-bright);
    font-family: var(--font-mono);
    font-size: 0.58rem;
    letter-spacing: 0.08em;
  }

  .dossier h2 {
    max-width: 14ch;
    margin: 0;
    font-size: clamp(1.75rem, 2.35vw, 2.55rem);
    font-weight: 450;
    letter-spacing: -0.025em;
    line-height: 1.05;
  }

  .dossier-heading p:last-child {
    margin: 0.75rem 0 0;
    color: var(--text-secondary);
    font-size: 0.8rem;
    line-height: 1.5;
  }

  .aura-sample {
    display: flex;
    height: 2.4rem;
    align-items: flex-end;
    gap: 0.18rem;
  }

  .aura-sample i {
    width: 0.16rem;
    height: 35%;
    background: var(--accent-gold);
    animation: meter 1.2s ease-in-out infinite alternate;
  }

  .aura-sample i:nth-child(2) {
    height: 75%;
    animation-delay: -0.8s;
  }
  .aura-sample i:nth-child(3) {
    height: 100%;
    animation-delay: -0.35s;
  }
  .aura-sample i:nth-child(4) {
    height: 58%;
    animation-delay: -1s;
  }
  .aura-sample i:nth-child(5) {
    height: 28%;
    animation-delay: -0.6s;
  }

  @keyframes meter {
    to {
      transform: scaleY(0.45);
      opacity: 0.45;
    }
  }

  .description {
    margin: 1.5rem 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.75;
  }

  .traits {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-bottom: 1.75rem;
  }

  .traits span {
    padding: 0.35rem 0.55rem;
    border: 1px solid var(--line-default);
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    font-size: 0.62rem;
  }

  .technique-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 1.25rem;
    padding: 1.35rem 0;
    border-top: 1px solid var(--line-default);
    border-bottom: 1px solid var(--line-default);
  }

  .technique-card > div > span,
  .cry-button small {
    color: var(--accent-gold-bright);
    font-size: 0.62rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .technique-card h3 {
    margin: 0.45rem 0 0.5rem;
    font: 600 1rem/1.4 var(--font-sans);
  }

  .technique-card p {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.72rem;
    line-height: 1.6;
  }

  .technique-card button {
    align-self: center;
    min-height: 44px;
    padding: 0.65rem 0.9rem;
    border: 1px solid var(--accent-gold);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--accent-gold-bright);
    cursor: pointer;
    font-size: 0.72rem;
  }

  .technique-card button span {
    margin-right: 0.3rem;
  }

  .technique-card button:hover {
    background: var(--accent-gold);
    color: var(--surface-void);
  }

  .action-row {
    display: grid;
    grid-template-columns: 0.8fr 1.2fr;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .cry-button {
    display: flex;
    min-width: 0;
    min-height: 4.5rem;
    align-items: center;
    gap: 0.85rem;
    padding: 0.85rem;
    border: 1px solid var(--line-default);
    border-radius: var(--radius-sm);
    background: var(--surface-panel);
    color: var(--text-primary);
    cursor: pointer;
    text-align: left;
  }

  .cry-button:hover {
    border-color: var(--accent-gold);
  }

  .cry-button small,
  .cry-button span:last-child {
    display: block;
  }

  .cry-button span:last-child {
    font-size: 0.78rem;
    font-weight: 600;
  }

  .cry-button small {
    margin-bottom: 0.3rem;
    font-size: 0.54rem;
  }

  .sound-bars {
    display: flex;
    height: 1.5rem;
    align-items: center;
    gap: 0.16rem;
  }

  .sound-bars i {
    width: 0.12rem;
    height: 40%;
    background: var(--accent-gold);
  }

  .sound-bars i:nth-child(2) {
    height: 90%;
  }
  .sound-bars i:nth-child(3) {
    height: 65%;
  }
  .sound-bars i:nth-child(4) {
    height: 30%;
  }

  .cry-button:hover .sound-bars i {
    animation: meter 0.45s ease-in-out infinite alternate;
  }

  .command-line {
    min-width: 0;
    padding: 0.8rem;
    border: 1px solid var(--line-default);
    border-radius: var(--radius-sm);
    background: var(--surface-void);
  }

  .command-line form {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.45rem;
  }

  .command-line form > span {
    color: var(--accent-gold-bright);
  }

  .command-line input {
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text-primary);
    font-size: 0.72rem;
  }

  .command-line button {
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--line-default);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--accent-gold-bright);
    cursor: pointer;
  }

  .command-line button:hover {
    border-color: var(--accent-gold);
  }

  .sr-status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .toast {
    position: fixed;
    z-index: 100;
    right: 1.25rem;
    bottom: 1.25rem;
    max-width: min(24rem, calc(100vw - 2.5rem));
    padding: 0.8rem 1rem;
    border: 1px solid var(--accent-gold);
    border-radius: var(--radius-sm);
    background: var(--surface-panel);
    color: var(--text-primary);
    font-size: 0.72rem;
    box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 1100px) {
    .archive-grid {
      grid-template-columns: 1fr;
    }

    .catalogue-tools {
      display: grid;
      grid-template-columns: minmax(14rem, 1fr) auto;
      align-items: end;
      gap: 1rem;
    }

    .filters {
      margin-top: 0;
    }

    .entry-list {
      max-height: none;
      grid-auto-columns: minmax(13rem, 26vw);
      grid-auto-flow: column;
      grid-template-columns: none;
      overflow-x: auto;
      overflow-y: hidden;
      border-bottom: 1px solid var(--line-default);
      scroll-snap-type: x proximity;
    }

    .entry {
      border-right: 1px solid var(--line-subtle);
      scroll-snap-align: start;
    }

    .specimen-panel {
      height: clamp(34rem, calc(100dvh - 16rem), 40rem);
      grid-template-columns: minmax(0, 1.2fr) minmax(18rem, 0.8fr);
    }
  }

  @media (max-width: 760px) {
    .archive {
      padding-top: 2rem;
    }

    .archive-header {
      align-items: flex-start;
    }

    .archive-status {
      display: none;
    }

    .catalogue-tools {
      grid-template-columns: 1fr;
    }

    .filters {
      margin-top: 0.25rem;
    }

    .entry-list {
      grid-auto-columns: minmax(12rem, 72vw);
    }

    .specimen-panel {
      height: auto;
      grid-template-columns: 1fr;
    }

    .viewer {
      aspect-ratio: 4 / 3;
      min-height: 23rem;
      border-right: 0;
      border-bottom: 1px solid var(--line-default);
    }

    .dossier {
      max-height: none;
      overflow: visible;
    }

    .viewer-topline span:first-child {
      max-width: 70%;
    }

    .dossier {
      padding: 1.25rem;
    }

    .technique-card,
    .action-row {
      grid-template-columns: 1fr;
    }

    .technique-card button {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .archive {
      padding-right: 1rem;
      padding-left: 1rem;
    }

    .archive-header {
      padding-bottom: 1.5rem;
    }

    .title-block h1 {
      font-size: clamp(2.75rem, 18vw, 4rem);
    }

    .title-block > p:last-child {
      margin-top: 0.65rem;
      font-size: 0.8rem;
    }

    .archive-grid {
      gap: 1rem;
      margin-top: 1.25rem;
    }

    .filters {
      flex-wrap: nowrap;
      overflow-x: auto;
      padding-bottom: 0.2rem;
    }

    .filters button {
      flex: 0 0 auto;
    }

    .entry-list {
      grid-auto-columns: minmax(11.5rem, 82vw);
    }

    .entry {
      min-height: 4.75rem;
    }

    .viewer {
      aspect-ratio: 1 / 1;
      min-height: 20rem;
    }

    .viewer-topline {
      top: 0.85rem;
      right: 0.85rem;
      left: 0.85rem;
      font-size: 0.6rem;
    }

    .interaction-hint {
      bottom: 0.9rem;
      font-size: 0.6rem;
    }

    .dossier-heading {
      padding-bottom: 1.1rem;
    }

    .dossier h2 {
      max-width: 12ch;
      font-size: clamp(1.8rem, 12vw, 2.45rem);
    }

    .aura-sample {
      transform: scale(0.8);
      transform-origin: top right;
    }

    .description {
      margin: 1.15rem 0;
    }

    .toast {
      right: 1rem;
      bottom: 1rem;
      left: 1rem;
      max-width: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .aura-sample i,
    .cry-button:hover .sound-bars i,
    .technique-flash {
      animation: none;
    }
  }
</style>
