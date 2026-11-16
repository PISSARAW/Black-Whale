<script lang="ts">
  import { tone } from '$lib/nen/archive-audio'
  import './archive-layout.css'
  import './archive-details.css'
  import './archive-responsive.css'

  import { NEN_ARCHIVE_ENTRIES, archiveCopy, type NenArchiveEntry } from '$lib/nen/archive'
  import Seo from '$lib/components/Seo.svelte'
  import NenArchiveScene from '$lib/nen/NenArchiveScene.svelte'
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

  function playCry() {
    crySignal += 1
    const ctx = context()
    const now = ctx.currentTime + 0.015
    if (selected.sound === 'growl') {
      tone(ctx, 92, { at: now, duration: 0.68, type: 'sawtooth', volume: 0.045, endFrequency: 46 })
      tone(ctx, 136, {
        at: now + 0.08,
        duration: 0.52,
        type: 'triangle',
        volume: 0.055,
        endFrequency: 71,
      })
      tone(ctx, 210, {
        at: now + 0.32,
        duration: 0.22,
        type: 'square',
        volume: 0.018,
        endFrequency: 120,
      })
    } else if (selected.sound === 'paper') {
      for (let index = 0; index < 7; index += 1)
        tone(ctx, 900 - index * 78, {
          at: now + index * 0.045,
          duration: 0.08,
          type: 'triangle',
          volume: 0.018,
        })
      tone(ctx, 118, {
        at: now + 0.28,
        duration: 0.38,
        type: 'sine',
        volume: 0.055,
        endFrequency: 82,
      })
    } else if (selected.sound === 'signal') {
      tone(ctx, 880, { at: now, duration: 0.1, type: 'square', volume: 0.035 })
      tone(ctx, 1174, { at: now + 0.14, duration: 0.1, type: 'square', volume: 0.035 })
      tone(ctx, 1568, { at: now + 0.28, duration: 0.24, type: 'square', volume: 0.03 })
    } else if (selected.sound === 'whisper') {
      tone(ctx, 310, { at: now, duration: 0.8, type: 'sine', volume: 0.025, endFrequency: 178 })
      tone(ctx, 467, {
        at: now + 0.08,
        duration: 0.68,
        type: 'triangle',
        volume: 0.025,
        endFrequency: 233,
      })
      tone(ctx, 620, {
        at: now + 0.18,
        duration: 0.5,
        type: 'sine',
        volume: 0.018,
        endFrequency: 350,
      })
    } else {
      tone(ctx, 523, { at: now, duration: 0.24, type: 'sine', volume: 0.055 })
      tone(ctx, 659, { at: now + 0.16, duration: 0.24, type: 'sine', volume: 0.05 })
      tone(ctx, 784, { at: now + 0.32, duration: 0.5, type: 'sine', volume: 0.045 })
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
    tone(ctx, 86, { at: now, duration: 0.85, type: 'sine', volume: 0.055, endFrequency: 210 })
    tone(ctx, 172, {
      at: now + 0.14,
      duration: 0.7,
      type: 'triangle',
      volume: 0.035,
      endFrequency: 420,
    })
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
          {#each [['all', copy ? 'Tout' : 'All'], ['beast', copy ? 'Bêtes' : 'Beasts'], ['object', copy ? 'Objets' : 'Objects'], ['construct', copy ? 'Constructions' : 'Constructs']] as option (option[0])}
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
          {#each archiveCopy(selected.traits, $locale) as trait (trait)}
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
