<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import type { PageData } from './$types'
  import MapContainer from '$lib/components/map/MapContainer.svelte'
  import LocationDetails from '$lib/components/map/LocationDetails.svelte'
  import UnknownPositions from '$lib/components/map/UnknownPositions.svelte'
  import { mapState } from '$lib/state/mapState.svelte'
  import Seo from '$lib/components/Seo.svelte'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import PerspectiveSelector from '$lib/components/perspective/PerspectiveSelector.svelte'
  import PerspectiveTimeline from '$lib/components/perspective/PerspectiveTimeline.svelte'
  import WhyPanel from '$lib/components/perspective/WhyPanel.svelte'
  import ConsciousnessTransferTransition from '$lib/components/perspective/ConsciousnessTransferTransition.svelte'
  import type {
    FollowMode,
    PerspectiveContext,
    PerspectiveOption,
  } from '$lib/components/perspective/types'
  import { toEnglishDisplayName } from '$lib/utils/displayNames'

  let { data }: { data: PageData } = $props()

  // Toolbar & Factions setup
  const factions = [
    { id: 'princes', label: 'Royal houses', code: 'KKN', mark: '♛', color: '#d9bc69' },
    { id: 'guards', label: 'Royal guard', code: 'GRD', mark: '◆', color: '#a9b5b5' },
    { id: 'hunters', label: 'Hunters', code: 'HXA', mark: '✦', color: '#69b8ad' },
    { id: 'spider', label: 'Phantom Troupe', code: '№13', mark: '✳', color: '#9b78bf' },
    { id: 'mafia', label: 'Mafia families', code: '3F', mark: '⬡', color: '#b96552' },
  ]

  const tierProfiles: Record<
    string,
    {
      number: string
      title: string
      subtitle: string
      clearance: string
      density: number
      pressure: string
      danger: string
      signal: string
      anomaly: string
      report: string
    }
  > = {
    overview: {
      number: '00',
      title: 'Ship overview',
      subtitle: 'Five societies under one hull',
      clearance: 'ARCHIVE / GLOBAL',
      density: 42,
      pressure: 'Layered control',
      danger: 'ELEVATED',
      signal: 'Cross-deck surveillance active',
      anomaly: 'Parasitic aura signatures remain unresolved',
      report: 'Passenger manifests disagree with security counts on the lower decks.',
    },
    'tier-1': {
      number: '01',
      title: 'Royal precinct',
      subtitle: 'Ceremonial calm · concealed succession war',
      clearance: 'KAKIN / ROYAL',
      density: 18,
      pressure: 'Silent hostility',
      danger: 'SEVERE',
      signal: 'Private armies monitoring all corridors',
      anomaly: 'Multiple guardian entities inferred · direct observation impossible',
      report: 'Four deaths in Room 1014. Cause redacted by royal authority.',
    },
    'tier-2': {
      number: '02',
      title: 'VVIP district',
      subtitle: 'Privilege behind controlled access',
      clearance: 'VVIP / BLUE',
      density: 34,
      pressure: 'Controlled access',
      danger: 'GUARDED',
      signal: 'Detention and transit channels monitored',
      anomaly: 'Residual aura detected near restricted suites',
      report: 'Intercepted routing order references an unregistered holding area.',
    },
    'tier-3': {
      number: '03',
      title: 'Civic deck',
      subtitle: 'Hospitals, courts and public movement',
      clearance: 'CIVIL / AMBER',
      density: 61,
      pressure: 'Information overload',
      danger: 'UNSTABLE',
      signal: 'Justice Bureau feeds partially synchronized',
      anomaly: 'Unattributed Nen activity reported through civilian channels',
      report: 'Witness statements conflict after a disappearance near the medical district.',
    },
    'tier-4': {
      number: '04',
      title: 'Industrial passage',
      subtitle: 'Cargo routes contested by three families',
      clearance: 'CREW / RED',
      density: 79,
      pressure: 'Faction friction',
      danger: 'CRITICAL',
      signal: 'Blind corridors and mafia relays detected',
      anomaly: 'Spatial discontinuities reported by multiple teams',
      report: 'Three intercepted transmissions use mutually exclusive location codes.',
    },
    'tier-5': {
      number: '05',
      title: 'Lower machinery',
      subtitle: 'Crowding, scarcity and failing oversight',
      clearance: 'RESTRICTED / BLACK',
      density: 96,
      pressure: 'Systemic collapse',
      danger: 'EXTREME',
      signal: 'Official surveillance coverage below threshold',
      anomaly: 'Hostile aura bloom · classification unavailable',
      report: 'Casualty ledger sealed. Seventeen passenger IDs no longer resolve.',
    },
  }

  const followLabel: Record<FollowMode, string> = {
    consciousness: 'follow consciousness',
    body: 'follow body',
    appearance: 'follow public appearance',
  }

  let perspectiveOptions = $derived.by(() => {
    const fromCharacters: PerspectiveOption[] = (data.worldState?.characters || []).map(
      (char: any) => ({
        id: char.id,
        label: toEnglishDisplayName(char.canonicalName),
        kind: 'character',
      }),
    )

    return [{ id: 'reader', label: 'Reader view', kind: 'reader' as const }, ...fromCharacters]
  })

  let currentEvt = $derived(
    data.events.find((event: any) => event.id === data.selectedEventId) ||
      data.events[data.events.length - 1],
  )

  let unknownPositionCount = $derived.by(() => {
    const locations = new Map(
      (data.worldState?.locations || []).map((location: any) => [location.id, location]),
    )
    return (data.worldState?.presences || []).filter((presence: any) => {
      const location: any = presence.locationId ? locations.get(presence.locationId) : null
      return !location || location.type === 'UNKNOWN'
    }).length
  })

  let selectedPerspective = $derived(
    perspectiveOptions.find((opt) => opt.id === mapState.selectedPerspectiveId) ||
      perspectiveOptions[0],
  )

  let contextState = $derived.by((): PerspectiveContext => {
    const perspectiveName = selectedPerspective?.label || 'Reader view'
    const observer = data.perspective?.observer
    const observerCharacter = data.worldState?.characters?.find(
      (char: any) => char.id === observer?.characterId,
    )
    const occupiedBody = data.worldState?.bodies?.find(
      (body: any) => body.id === observer?.currentBodyId,
    )
    const anomaly = Boolean(observer?.isDissonant)

    const canonicalPerspective = observerCharacter?.canonicalName || perspectiveName
    const occupiedBodyLabel = occupiedBody?.label || occupiedBody?.id || canonicalPerspective

    return {
      chapter: currentEvt?.chapter?.number || 0,
      eventLabel: `${currentEvt?.sequence ?? 0}`,
      spoilerLimit: data.spoilerLimit ?? null,
      perspectiveName: canonicalPerspective,
      followedConsciousness: canonicalPerspective,
      occupiedBody: occupiedBodyLabel,
      apparentIdentity:
        data.worldState?.characters?.find((char: any) => char.id === observer?.apparentCharacterId)
          ?.canonicalName || occupiedBodyLabel,
      followMode: mapState.followMode,
      hasAnomaly: anomaly,
    }
  })

  let timelinePoints = $derived.by(() => {
    const baseSequence = data.selectedEventIndex || 0

    return {
      reality: [
        { id: 'r0', label: 'Canonical event', index: baseSequence - 2 },
        { id: 'r1', label: currentEvt?.title || 'Current state', index: baseSequence },
      ],
      body: [
        { id: 'b0', label: 'Body movement', index: baseSequence - 1 },
        { id: 'b1', label: 'Biological state', index: baseSequence },
      ],
      consciousness: [
        { id: 'c0', label: 'Mental anchor', index: baseSequence - 1 },
        { id: 'c1', label: 'Transfer', index: baseSequence, emphasis: contextState.hasAnomaly },
      ],
      knowledge: [
        { id: 'k0', label: 'Information received', index: baseSequence - 2 },
        {
          id: 'k1',
          label: 'Perspective update',
          index: baseSequence,
          detail:
            selectedPerspective?.kind === 'reader'
              ? 'Spoiler-filtered canon'
              : 'Subjective point of view',
        },
      ],
    }
  })

  let currentDeckLabel = $derived(
    mapState.currentZoomLevel === 'OVERVIEW'
      ? 'Overview'
      : mapState.currentZoomLevel === 'LOCAL'
        ? (mapState.selectedLocationId || 'Local area').replaceAll('-', ' ')
        : `Tier ${mapState.selectedTier?.replace('tier-', '') || ''}`,
  )

  let eventProgress = $derived.by(() => {
    if (data.events.length < 2) return 100
    return Math.max(0, Math.min(100, (data.selectedEventIndex / (data.events.length - 1)) * 100))
  })

  const deckClearance: Record<string, string> = {
    overview: 'Global scan',
    'tier-1': 'Royal clearance',
    'tier-2': 'VIP clearance',
    'tier-3': 'Public access',
    'tier-4': 'Crew clearance',
    'tier-5': 'Restricted systems',
  }

  let mappedZoneCount = $derived.by(() => {
    const locations = data.worldState?.locations || []
    if (!mapState.selectedTier) return locations.length
    return locations.filter(
      (location: any) =>
        location.slug === mapState.selectedTier ||
        location.slug?.startsWith(`${mapState.selectedTier}-`),
    ).length
  })

  let trackedPresenceCount = $derived(data.worldState?.presences?.length || 0)
  let activeClearance = $derived(deckClearance[mapState.selectedTier || 'overview'])
  let activeTierProfile = $derived(tierProfiles[mapState.selectedTier || 'overview'])
  let activeTierKey = $derived(mapState.selectedTier || 'overview')

  $effect(() => {
    mapState.setFollowMode((data.followMode as FollowMode) || 'consciousness')

    const selectedByUrl = perspectiveOptions.find(
      (option) => option.id === data.selectedPerspectiveId,
    )
    if (selectedByUrl) {
      mapState.setPerspective(selectedByUrl.id, selectedByUrl.label, selectedByUrl.kind)
    }

    if (!selectedPerspective) {
      return
    }

    mapState.setPerspective(
      selectedPerspective.id,
      selectedPerspective.label,
      selectedPerspective.kind,
    )
  })

  // Timeline slider change
  function handleTimelineChange(e: Event) {
    const input = e.target as HTMLInputElement
    const eventIndex = parseInt(input.value)
    const selectedEvent = data.events[eventIndex]
    if (!selectedEvent) return

    const url = new URL($page.url)
    url.searchParams.set('eventId', selectedEvent.id)
    url.searchParams.delete('sequence')
    goto(url.toString(), { keepFocus: true, replaceState: true })
  }

  function handlePerspectiveSelect(id: string) {
    const found = perspectiveOptions.find((option) => option.id === id)
    if (!found) return

    mapState.setPerspective(found.id, found.label, found.kind)

    const url = new URL($page.url)
    url.searchParams.set('perspective', found.id)
    url.searchParams.set('follow', mapState.followMode)
    goto(url.toString(), { keepFocus: true })
  }

  function handleFollowModeSelect(mode: FollowMode) {
    mapState.setFollowMode(mode)

    const url = new URL($page.url)
    url.searchParams.set('perspective', mapState.selectedPerspectiveId)
    url.searchParams.set('follow', mode)
    goto(url.toString(), { keepFocus: true, replaceState: true })
  }
</script>

<Seo
  title="Black Whale Map — Hunter × Hunter"
  description="Explore the five tiers of the Black Whale deck by deck: rooms, known character positions and the perspective of anyone aboard, chapter by chapter."
  jsonLd={breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Ship map', path: '/ship' },
  ])}
/>

<div class="ship-page">
  <header class="ship-hero">
    <div class="hero-copy">
      <div class="eyebrow"><span></span> Dark Continent Expedition</div>
      <h1>Black Whale <em>01</em></h1>
      <p>Tactical mapping of decks, presences, and zones of influence.</p>
    </div>

    <div class="hero-status" aria-label="Map status">
      <div>
        <span>Event</span><strong
          >Ch. {currentEvt?.chapter?.number ?? '—'} · Ev. {currentEvt?.sequence ?? '—'}</strong
        >
      </div>
      <div><span>Active zone</span><strong class="capitalize">{currentDeckLabel}</strong></div>
      <div><span>Perspective</span><strong>{contextState.perspectiveName}</strong></div>
    </div>

    <div class="hero-actions">
      <button
        class:active={mapState.compareWithReader}
        aria-pressed={mapState.compareWithReader}
        onclick={() => mapState.setCompareWithReader(!mapState.compareWithReader)}
      >
        <span class="action-icon">◫</span>
        {mapState.compareWithReader ? 'Canon visible' : 'Compare with canon'}
      </button>
      <a href="/compare">Compare perspectives <span>↗</span></a>
    </div>
  </header>

  {#if contextState.hasAnomaly}
    <ConsciousnessTransferTransition
      visible={true}
      fromBody={contextState.perspectiveName}
      toBody={contextState.occupiedBody}
      consciousness={contextState.followedConsciousness}
    />
  {/if}

  <section class="map-workspace tier-pressure-{activeTierKey}" data-tier={activeTierKey}>
    <aside class="control-deck">
      <div class="panel-heading">
        <div>
          <span>Navigation</span>
          <h2>Ship decks</h2>
        </div>
        <span class="deck-count">05</span>
      </div>

      <nav class="tier-nav" aria-label="Black Whale decks">
        <button
          class:active={mapState.currentZoomLevel === 'OVERVIEW'}
          aria-current={mapState.currentZoomLevel === 'OVERVIEW' ? 'page' : undefined}
          onclick={() => mapState.selectTier(null)}
        >
          <span class="tier-number">00</span>
          <span><strong>Overview</strong><small>Ship structure</small></span>
          <span class="tier-arrow">↗</span>
        </button>

        {#each [1, 2, 3, 4, 5] as tierNum (tierNum)}
          <button
            class:active={mapState.selectedTier === `tier-${tierNum}`}
            aria-current={mapState.selectedTier === `tier-${tierNum}` ? 'page' : undefined}
            onclick={() => mapState.selectTier(`tier-${tierNum}`)}
          >
            <span class="tier-number">0{tierNum}</span>
            <span
              ><strong>Tier {tierNum}</strong><small
                >{[
                  'Royalty & VVIP',
                  'VIP & amenities',
                  'Public & medical',
                  'Crew & cargo',
                  'Machinery & storage',
                ][tierNum - 1]}</small
              ><i class="density-line"
                ><b style={`width:${tierProfiles[`tier-${tierNum}`].density}%`}></b></i
              ></span
            >
            <span class="tier-arrow">→</span>
          </button>
        {/each}
      </nav>

      <div class="filter-section">
        <div class="section-label">
          <span>Factions</span><small>{mapState.filters.factions.length} active</small>
        </div>
        <div class="filter-grid faction-identities">
          {#each factions as faction (faction.id)}
            <label
              class:active={mapState.filters.factions.includes(faction.id)}
              style={`--faction:${faction.color}`}
            >
              <input
                type="checkbox"
                checked={mapState.filters.factions.includes(faction.id)}
                onchange={() => mapState.toggleFactionFilter(faction.id)}
              />
              <span class="faction-mark">{faction.mark}</span><span class="faction-name"
                >{faction.label}<small>{faction.code}</small></span
              >
            </label>
          {/each}
        </div>
        {#if mapState.filters.factions.length}
          <button
            class="clear-filters"
            type="button"
            onclick={() => (mapState.filters.factions = [])}>Clear faction filters</button
          >
        {/if}
      </div>

      <div class="deck-signal" aria-label="Current map intelligence">
        <span>Current signal</span>
        <dl>
          <div>
            <dt>Tracked</dt>
            <dd>{trackedPresenceCount}</dd>
          </div>
          <div>
            <dt>Zones</dt>
            <dd>{mappedZoneCount}</dd>
          </div>
        </dl>
        <p><i></i>{activeClearance}</p>
      </div>

      <div class="clearance-card" aria-label="Archive clearance">
        <div><span>Access level</span><strong>{activeTierProfile.clearance}</strong></div>
        <p><span>██████</span> ██ ███████ ███</p>
        <small>Portions withheld by order of the Kakin Crown</small>
      </div>
    </aside>

    <div class="map-stage">
      <header class="map-toolbar">
        <div class="map-breadcrumb">
          <span>Black Whale</span><i>/</i><strong class="capitalize">{currentDeckLabel}</strong>
        </div>
        <div class="map-tools">
          <label class="quick-track">
            <span>Track</span>
            <select
              aria-label="Quickly track a perspective"
              value={mapState.selectedPerspectiveId}
              onchange={(event) => handlePerspectiveSelect(event.currentTarget.value)}
            >
              {#each perspectiveOptions as option (option.id)}<option value={option.id}
                  >{option.label}</option
                >{/each}
            </select>
          </label>
          <span class="live-indicator"><i></i> Live data synchronized</span>
          <span class="map-hint">Drag to navigate · Scroll to zoom</span>
        </div>
      </header>

      <div class="map-canvas" role="region" aria-label="Interactive Black Whale map">
        <MapContainer />
        <div class="pressure-field" aria-hidden="true"></div>
        <div class="nen-anomaly" aria-hidden="true">
          <i></i><i></i><i></i><span>UNRESOLVED</span>
        </div>
        <div class="map-coordinate north">N</div>
        <div class="map-scale"><span></span> STRUCTURAL LEVEL</div>
        <div class="scan-readout" data-hatsu-pass aria-live="polite">
          <span>ACTIVE SCAN</span>
          <strong class="capitalize">{currentDeckLabel}</strong>
          <small>{mappedZoneCount} mapped zones · {trackedPresenceCount} tracked presences</small>
        </div>
        <WhyPanel
          open={mapState.explainPanelOpen && !!mapState.explainTarget}
          subject={mapState.explainTarget?.subject || ''}
          displayedValue={mapState.explainTarget?.value || ''}
          source={mapState.explainTarget?.source || ''}
          observedAt={mapState.explainTarget?.observedAt || ''}
          freshness={mapState.explainTarget?.freshness || ''}
          state={mapState.explainTarget?.knowledgeState || 'unknown'}
          revealReality={mapState.compareWithReader}
          canonicalValue={mapState.explainTarget?.canonicalValue || 'unknown'}
          onClose={() => mapState.closeExplainPanel()}
        />

        <LocationDetails />
        <UnknownPositions />
      </div>
    </div>
  </section>

  <section class="intelligence-strip" aria-label="Current intelligence assessment">
    <article class="tier-brief">
      <div class="brief-index">{activeTierProfile.number}</div>
      <div>
        <span>Active environment</span>
        <h2>{activeTierProfile.title}</h2>
        <p>{activeTierProfile.subtitle}</p>
      </div>
      <div class="density-gauge" style={`--density:${activeTierProfile.density}%`}>
        <span>Human density</span><strong>{activeTierProfile.density}<small>%</small></strong><i
          ><b></b></i
        ><em>{activeTierProfile.pressure}</em>
      </div>
    </article>

    <article class="threat-brief">
      <header><span>Threat assessment</span><strong>{activeTierProfile.danger}</strong></header>
      <div class="threat-row">
        <i class="threat-icon murder">†</i>
        <p><span>Incident marker</span>{activeTierProfile.report}</p>
      </div>
      <div class="threat-row">
        <i class="threat-icon watch">◉</i>
        <p><span>Surveillance</span>{activeTierProfile.signal}</p>
      </div>
    </article>

    <article class="anomaly-brief">
      <header><span>Nen phenomenon</span><strong>UNVERIFIED</strong></header>
      <div class="anomaly-specimen" aria-hidden="true"><i></i><i></i><i></i><b></b></div>
      <p>{activeTierProfile.anomaly}</p>
      <small>Do not assign intent · observer contamination possible</small>
    </article>

    <article class="intercept-brief">
      <header>
        <span>Intercepted report</span><strong>INT/██-{activeTierProfile.number}</strong>
      </header>
      <p>
        Source <b>████████</b> reports that <b>█████</b> crossed the secured boundary without a matching
        body record.
      </p>
      <footer>
        <span>CHAIN OF CUSTODY DISPUTED</span><em
          >LEVEL {activeTierProfile.number === '00' ? '5' : activeTierProfile.number}</em
        >
      </footer>
    </article>
  </section>

  <section class="intel-panel">
    <div class="perspective-panel">
      <div class="panel-heading compact">
        <div>
          <span>Point of view</span>
          <h2>Observation filter</h2>
        </div>
        <span class="mode-pill">{followLabel[mapState.followMode]}</span>
      </div>
      <PerspectiveSelector
        options={perspectiveOptions}
        selectedPerspective={mapState.selectedPerspectiveId}
        followMode={mapState.followMode}
        onPerspectiveSelect={handlePerspectiveSelect}
        onFollowModeSelect={handleFollowModeSelect}
      />
    </div>

    <div class="legend-panel">
      <div class="panel-heading compact">
        <div>
          <span>Map legend</span>
          <h2>Temporal certainty</h2>
        </div>
      </div>
      <div class="position-legend" aria-label="Colors by temporal certainty">
        {#each [{ label: 'Current event', color: '#55d1e2' }, { label: 'Confirmed period', color: '#ad8bea' }, { label: 'Current chapter', color: '#6ac890' }, { label: 'Confirmed', color: '#5bb9ad' }, { label: 'Assumed', color: '#f0b75e' }, { label: 'Last known position', color: '#e47f61' }, { label: 'Unknown', color: '#8a9798' }] as status (status)}
          <span style={`--status-color: ${status.color}`}><i></i>{status.label}</span>
        {/each}
      </div>
      <div class="display-toggles">
        <button
          class:active={mapState.filters.showUnknownPositions}
          onclick={() =>
            (mapState.filters.showUnknownPositions = !mapState.filters.showUnknownPositions)}
        >
          <span>{mapState.filters.showUnknownPositions ? '✓' : '+'}</span> Unknown positions ({unknownPositionCount})
        </button>
        <button
          class="danger"
          class:active={mapState.filters.spoilersEnabled}
          onclick={() => (mapState.filters.spoilersEnabled = !mapState.filters.spoilersEnabled)}
        >
          <span>{mapState.filters.spoilersEnabled ? '!' : '×'}</span> Spoilers
        </button>
      </div>
    </div>
  </section>

  <footer class="timeline-shell">
    <div class="timeline-header">
      <div>
        <span>Timeline</span>
        <strong>{currentEvt?.title || 'Current state'}</strong>
      </div>
      <div class="sequence-badge">
        {#if currentEvt?.isFlashback}↶ FLASHBACK ·
        {/if}CH <strong>{currentEvt?.chapter?.number ?? '—'}</strong> · EV
        <strong>{currentEvt?.sequence ?? '—'}</strong>
        {#if currentEvt?.occurredAtLabel}
          · <strong>{currentEvt.occurredAtLabel}</strong>{/if}
      </div>
    </div>

    {#if data.events.length > 0}
      <div class="range-wrap" style={`--progress: ${eventProgress}%`}>
        <span>Ch.{data.events[0].chapter.number}</span>
        <input
          aria-label="Timeline event"
          type="range"
          min="0"
          max={data.events.length - 1}
          value={data.selectedEventIndex}
          oninput={handleTimelineChange}
        />
        <span>Ch.{data.events[data.events.length - 1].chapter.number}</span>
      </div>
    {:else}
      <p class="empty-state">No events available.</p>
    {/if}

    <PerspectiveTimeline
      reality={timelinePoints.reality}
      body={timelinePoints.body}
      consciousness={timelinePoints.consciousness}
      knowledge={timelinePoints.knowledge}
      currentIndex={data.selectedEventIndex || 0}
    />
  </footer>
</div>

<style>
  :global(body) {
    overflow-x: hidden;
  }
  button,
  a {
    -webkit-tap-highlight-color: transparent;
  }

  .ship-page {
    --gold: #d7b65d;
    --gold-bright: #f2d889;
    --surface: rgba(13, 21, 29, 0.92);
    --surface-light: rgba(19, 30, 40, 0.92);
    min-height: calc(100vh - 3.25rem);
    padding: clamp(1rem, 2vw, 1.75rem);
    color: #eef1e8;
    background:
      radial-gradient(900px 420px at 10% -5%, rgba(24, 82, 78, 0.25), transparent 72%),
      radial-gradient(800px 380px at 100% 0%, rgba(121, 90, 37, 0.18), transparent 70%),
      linear-gradient(180deg, #080d12 0%, #070b10 100%);
  }

  .ship-hero {
    max-width: 1600px;
    margin: 0 auto 1.25rem;
    display: grid;
    grid-template-columns: minmax(18rem, 1fr) auto auto;
    gap: 2rem;
    align-items: end;
  }
  .eyebrow {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    margin-bottom: 0.35rem;
    color: #8fa39e;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .eyebrow span {
    width: 1.6rem;
    height: 1px;
    background: var(--gold);
  }
  .hero-copy h1 {
    margin: 0;
    font-size: clamp(2rem, 3.3vw, 3.35rem);
    line-height: 0.95;
    font-weight: 500;
    letter-spacing: -0.035em;
    text-transform: uppercase;
  }
  .hero-copy h1 em {
    color: var(--gold);
    font-size: 0.42em;
    font-style: normal;
    vertical-align: top;
    letter-spacing: 0.08em;
  }
  .hero-copy p {
    margin: 0.55rem 0 0;
    color: #82908f;
    font-size: 0.85rem;
  }
  .hero-status {
    display: flex;
    border: 1px solid rgba(116, 139, 148, 0.22);
    border-radius: 0.7rem;
    background: rgba(11, 18, 25, 0.55);
  }
  .hero-status > div {
    min-width: 7rem;
    padding: 0.65rem 0.9rem;
    border-right: 1px solid rgba(116, 139, 148, 0.16);
  }
  .hero-status > div:last-child {
    border: 0;
    min-width: 9rem;
  }
  .hero-status span,
  .panel-heading span,
  .timeline-header span {
    display: block;
    color: #70817f;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }
  .hero-status strong {
    display: block;
    max-width: 12rem;
    margin-top: 0.25rem;
    overflow: hidden;
    color: #dce4dc;
    font-size: 0.76rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hero-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .hero-actions button,
  .hero-actions a {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 2.4rem;
    padding: 0 0.8rem;
    border: 1px solid #33434b;
    border-radius: 0.55rem;
    color: #cad3ce;
    background: rgba(16, 25, 33, 0.8);
    font-size: 0.72rem;
    text-decoration: none;
    cursor: pointer;
    transition: 0.2s ease;
  }
  .hero-actions button:hover,
  .hero-actions a:hover,
  .hero-actions button.active {
    border-color: #907a40;
    color: var(--gold-bright);
    background: rgba(48, 42, 25, 0.45);
  }
  .action-icon {
    color: var(--gold);
    font-size: 1rem;
  }

  .map-workspace {
    max-width: 1600px;
    height: min(66vh, 690px);
    min-height: 520px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 270px minmax(0, 1fr);
    overflow: hidden;
    border: 1px solid rgba(98, 122, 132, 0.28);
    border-radius: 1rem;
    background: #080d12;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
  }
  .control-deck {
    position: relative;
    z-index: 2;
    padding: 1.2rem;
    overflow-y: auto;
    border-right: 1px solid rgba(99, 120, 128, 0.22);
    background: linear-gradient(180deg, rgba(17, 28, 37, 0.98), rgba(10, 17, 24, 0.98));
  }
  .panel-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .panel-heading h2 {
    margin: 0.15rem 0 0;
    color: #e3e8e1;
    font-size: 1rem;
    font-weight: 500;
    letter-spacing: 0.01em;
  }
  .panel-heading.compact {
    margin-bottom: 0.7rem;
  }
  .deck-count {
    color: rgba(215, 182, 93, 0.35) !important;
    font:
      500 2.4rem/1 'IBM Plex Sans Condensed',
      sans-serif !important;
    letter-spacing: -0.05em !important;
  }
  .tier-nav {
    display: grid;
    gap: 0.35rem;
  }
  .tier-nav button {
    width: 100%;
    display: grid;
    grid-template-columns: 1.65rem 1fr auto;
    gap: 0.7rem;
    align-items: center;
    padding: 0.65rem 0.7rem;
    border: 1px solid transparent;
    border-radius: 0.55rem;
    color: #899795;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: 0.18s ease;
  }
  .tier-nav button:hover {
    color: #e4e8df;
    background: rgba(255, 255, 255, 0.025);
  }
  .tier-nav button.active {
    border-color: rgba(215, 182, 93, 0.34);
    color: var(--gold-bright);
    background: linear-gradient(90deg, rgba(126, 102, 43, 0.23), rgba(126, 102, 43, 0.04));
    box-shadow: inset 2px 0 var(--gold);
  }
  .tier-number {
    color: #586a6b;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.06em;
  }
  .tier-nav button.active .tier-number {
    color: var(--gold);
  }
  .tier-nav strong,
  .tier-nav small {
    display: block;
  }
  .tier-nav strong {
    font-size: 0.78rem;
    font-weight: 600;
  }
  .tier-nav small {
    margin-top: 0.08rem;
    color: #617170;
    font-size: 0.6rem;
  }
  .density-line {
    display: block;
    width: 100%;
    height: 2px;
    margin-top: 0.35rem;
    overflow: hidden;
    background: rgba(117, 132, 133, 0.12);
  }
  .density-line b {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--gold), #b65647);
    opacity: 0.55;
  }
  .tier-arrow {
    opacity: 0.35;
    font-size: 0.75rem;
  }
  .filter-section {
    margin-top: 1.25rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(106, 126, 133, 0.16);
  }
  .section-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.65rem;
  }
  .section-label span {
    color: #82918f;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .section-label small {
    color: #536260;
    font-size: 0.62rem;
  }
  .filter-grid {
    display: grid;
    gap: 0.35rem;
  }
  .filter-grid label {
    display: grid;
    grid-template-columns: 1.5rem 1fr;
    align-items: center;
    gap: 0.5rem;
    padding: 0.42rem 0.5rem;
    border: 1px solid #2a3a42;
    border-radius: 0.35rem;
    color: #7f8c8a;
    background: linear-gradient(90deg, color-mix(in srgb, var(--faction) 7%, #0c151c), #0c151c 45%);
    font-size: 0.65rem;
    cursor: pointer;
    transition: 0.18s ease;
  }
  .filter-grid label.active {
    border-color: color-mix(in srgb, var(--faction) 65%, transparent);
    color: color-mix(in srgb, var(--faction) 74%, white);
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--faction) 22%, #0c151c),
      #0c151c 72%
    );
    box-shadow: inset 2px 0 var(--faction);
  }
  .filter-grid input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .filter-grid .faction-mark {
    display: grid;
    width: 1.5rem;
    height: 1.5rem;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--faction) 48%, transparent);
    border-radius: 50%;
    color: var(--faction);
    font-size: 0.7rem;
  }
  .faction-name {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    align-items: center;
  }
  .faction-name small {
    color: color-mix(in srgb, var(--faction) 65%, #5d6b6b);
    font: 0.45rem/1 var(--font-mono);
    letter-spacing: 0.08em;
  }
  .clear-filters {
    margin-top: 0.65rem;
    padding: 0;
    border: 0;
    border-bottom: 1px solid #495957;
    background: transparent;
    color: #788886;
    font-size: 0.58rem;
    cursor: pointer;
  }
  .clear-filters:hover {
    color: var(--gold-bright);
    border-color: var(--gold);
  }
  .deck-signal {
    margin-top: 1.2rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(106, 126, 133, 0.16);
  }
  .deck-signal > span {
    color: #70817f;
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }
  .deck-signal dl {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    margin: 0.7rem 0;
    gap: 1px;
    background: rgba(106, 126, 133, 0.15);
  }
  .deck-signal dl div {
    padding: 0.6rem;
    background: #0c151c;
  }
  .deck-signal dt {
    color: #617170;
    font-size: 0.5rem;
    text-transform: uppercase;
  }
  .deck-signal dd {
    margin: 0.2rem 0 0;
    color: #dde3dc;
    font: 500 1.15rem/1 var(--font-display);
  }
  .deck-signal p {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
    color: #7e918d;
    font-size: 0.58rem;
  }
  .deck-signal p i {
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 50%;
    background: #72c3a8;
    box-shadow: 0 0 8px rgba(114, 195, 168, 0.55);
  }
  .clearance-card {
    margin-top: 1rem;
    padding: 0.7rem;
    border: 1px solid rgba(164, 75, 64, 0.28);
    background:
      repeating-linear-gradient(-45deg, rgba(164, 75, 64, 0.035) 0 4px, transparent 4px 9px),
      rgba(28, 15, 16, 0.42);
  }
  .clearance-card > div {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .clearance-card span,
  .clearance-card small {
    color: #826d6b;
    font: 0.47rem/1.3 var(--font-mono);
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  .clearance-card strong {
    color: #bd7a70;
    font: 0.49rem/1 var(--font-mono);
  }
  .clearance-card p {
    margin: 0.65rem 0 0.45rem;
    color: #16191a;
    background: #9c9484;
    font: 0.5rem/1 var(--font-mono);
    letter-spacing: 0.04em;
  }
  .clearance-card p span {
    color: #111;
  }

  .map-stage {
    min-width: 0;
    display: grid;
    grid-template-rows: 3rem minmax(0, 1fr);
    background: #060a0e;
  }
  .map-toolbar {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0 1rem;
    border-bottom: 1px solid rgba(97, 120, 128, 0.2);
    background: rgba(11, 18, 24, 0.94);
  }
  .map-breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.68rem;
  }
  .map-breadcrumb span {
    color: #586967;
  }
  .map-breadcrumb i {
    color: #354543;
    font-style: normal;
  }
  .map-breadcrumb strong {
    color: #cbd4ce;
    font-weight: 500;
  }
  .map-tools {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: #5f706f;
    font-size: 0.6rem;
  }
  .quick-track {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding-right: 1rem;
    border-right: 1px solid rgba(97, 120, 128, 0.2);
    color: #657775;
  }
  .quick-track > span {
    font-size: 0.52rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .quick-track select {
    max-width: 10rem;
    border: 0;
    outline: 0;
    background: transparent;
    color: #bcc8c2;
    font-size: 0.62rem;
    cursor: pointer;
  }
  .live-indicator {
    color: #88a49c;
  }
  .live-indicator i {
    display: inline-block;
    width: 0.38rem;
    height: 0.38rem;
    margin-right: 0.35rem;
    border-radius: 50%;
    background: #72c3a8;
    box-shadow: 0 0 8px rgba(114, 195, 168, 0.6);
  }
  .map-canvas {
    position: relative;
    min-height: 0;
    overflow: hidden;
  }
  .pressure-field {
    position: absolute;
    z-index: 1;
    inset: 0;
    pointer-events: none;
    opacity: 0.12;
    transition: opacity 0.45s ease;
    background:
      repeating-linear-gradient(90deg, transparent 0 19px, rgba(191, 72, 57, 0.22) 20px),
      repeating-linear-gradient(0deg, transparent 0 29px, rgba(191, 72, 57, 0.18) 30px);
    mix-blend-mode: screen;
  }
  .tier-pressure-tier-1 .pressure-field {
    opacity: 0.025;
  }
  .tier-pressure-tier-2 .pressure-field {
    opacity: 0.055;
  }
  .tier-pressure-tier-3 .pressure-field {
    opacity: 0.1;
  }
  .tier-pressure-tier-4 .pressure-field {
    opacity: 0.17;
    background-size:
      17px 17px,
      23px 23px;
  }
  .tier-pressure-tier-5 .pressure-field {
    opacity: 0.25;
    background-size:
      11px 11px,
      15px 15px;
    filter: contrast(1.8);
  }
  .nen-anomaly {
    position: absolute;
    z-index: 11;
    top: 17%;
    right: 7%;
    width: 6.5rem;
    height: 6.5rem;
    pointer-events: none;
    opacity: 0.26;
    filter: drop-shadow(0 0 14px rgba(128, 92, 153, 0.24));
  }
  .nen-anomaly i {
    position: absolute;
    inset: 16%;
    border: 1px solid rgba(160, 122, 181, 0.55);
    border-radius: 44% 56% 38% 62%;
    transform: rotate(18deg);
    animation: anomaly-drift 9s ease-in-out infinite alternate;
  }
  .nen-anomaly i:nth-child(2) {
    inset: 28% 10% 20% 32%;
    transform: rotate(78deg);
    animation-delay: -3s;
  }
  .nen-anomaly i:nth-child(3) {
    inset: 7% 32% 34% 15%;
    transform: rotate(-34deg);
    animation-delay: -6s;
  }
  .nen-anomaly span {
    position: absolute;
    right: 0;
    bottom: -0.75rem;
    color: #806b89;
    font: 0.42rem/1 var(--font-mono);
    letter-spacing: 0.13em;
  }
  .tier-pressure-tier-1 .nen-anomaly,
  .tier-pressure-tier-5 .nen-anomaly {
    opacity: 0.58;
  }
  .tier-pressure-tier-4 .nen-anomaly {
    opacity: 0.4;
  }
  @keyframes anomaly-drift {
    to {
      border-radius: 61% 39% 58% 42%;
      transform: rotate(51deg) scale(1.09);
    }
  }
  .map-coordinate {
    position: absolute;
    z-index: 2;
    top: 1rem;
    left: 1rem;
    display: grid;
    width: 2rem;
    height: 2rem;
    place-items: center;
    border: 1px solid rgba(215, 182, 93, 0.25);
    border-radius: 50%;
    color: var(--gold);
    background: rgba(9, 15, 20, 0.72);
    font:
      600 0.67rem/1 'IBM Plex Sans Condensed',
      sans-serif;
    pointer-events: none;
  }
  .map-coordinate::after {
    content: '';
    position: absolute;
    top: -0.32rem;
    border: 0.2rem solid transparent;
    border-bottom-color: var(--gold);
  }
  .map-scale {
    position: absolute;
    z-index: 2;
    right: 1rem;
    bottom: 1rem;
    color: #566765;
    font-size: 0.55rem;
    letter-spacing: 0.12em;
    pointer-events: none;
  }
  .map-scale span {
    display: inline-block;
    width: 2.5rem;
    height: 0.35rem;
    margin-right: 0.4rem;
    border: solid #667876;
    border-width: 0 1px 1px;
  }
  .scan-readout {
    position: absolute;
    z-index: 12;
    bottom: 1rem;
    left: 1rem;
    display: grid;
    min-width: 13rem;
    gap: 0.18rem;
    padding: 0.7rem 0.8rem;
    border: 1px solid rgba(95, 122, 128, 0.25);
    border-radius: 0.45rem;
    background: rgba(8, 14, 18, 0.82);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.24);
    backdrop-filter: blur(10px);
    pointer-events: none;
  }
  .scan-readout > span {
    color: var(--gold);
    font: 0.48rem/1 var(--font-mono);
    letter-spacing: 0.14em;
  }
  .scan-readout strong {
    color: #dce4de;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .scan-readout small {
    color: #647572;
    font-size: 0.52rem;
  }

  .intelligence-strip {
    max-width: 1600px;
    margin: 0.75rem auto 0;
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr 1fr;
    gap: 1px;
    border: 1px solid rgba(98, 122, 132, 0.25);
    border-radius: 0.8rem;
    overflow: hidden;
    background: rgba(98, 122, 132, 0.18);
  }
  .intelligence-strip article {
    min-width: 0;
    padding: 1rem;
    background: linear-gradient(145deg, rgba(16, 25, 32, 0.98), rgba(9, 15, 20, 0.98));
  }
  .intelligence-strip header {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    padding-bottom: 0.65rem;
    border-bottom: 1px solid rgba(112, 132, 136, 0.16);
  }
  .intelligence-strip header span,
  .tier-brief span {
    color: #687b79;
    font: 0.48rem/1 var(--font-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .intelligence-strip header strong {
    color: #bd685c;
    font: 0.5rem/1 var(--font-mono);
    letter-spacing: 0.09em;
  }
  .tier-brief {
    display: grid;
    grid-template-columns: 2.5rem 1fr auto;
    gap: 0.8rem;
    align-items: start;
  }
  .brief-index {
    color: rgba(215, 182, 93, 0.38);
    font: 500 2.35rem/0.8 var(--font-display);
  }
  .tier-brief h2 {
    margin: 0.25rem 0 0.2rem;
    color: #e2e6de;
    font-size: 1.25rem;
  }
  .tier-brief p {
    margin: 0;
    color: #71817f;
    font-size: 0.58rem;
    line-height: 1.45;
  }
  .density-gauge {
    width: 5.5rem;
    text-align: right;
  }
  .density-gauge strong {
    display: block;
    margin: 0.25rem 0;
    color: #d8c681;
    font: 500 1.6rem/1 var(--font-display);
  }
  .density-gauge strong small {
    font-size: 0.55rem;
  }
  .density-gauge i {
    display: block;
    height: 3px;
    background: #263238;
  }
  .density-gauge i b {
    display: block;
    width: var(--density);
    height: 100%;
    background: linear-gradient(90deg, #8d9d83, #c55c4d);
  }
  .density-gauge em {
    display: block;
    margin-top: 0.35rem;
    color: #7b8583;
    font: 0.45rem/1.2 var(--font-mono);
    font-style: normal;
  }
  .threat-row {
    display: grid;
    grid-template-columns: 1.65rem 1fr;
    gap: 0.6rem;
    align-items: center;
    padding-top: 0.7rem;
  }
  .threat-icon {
    display: grid;
    width: 1.65rem;
    height: 1.65rem;
    place-items: center;
    border: 1px solid rgba(191, 87, 73, 0.35);
    border-radius: 50%;
    color: #d16a5d;
    background: rgba(111, 38, 32, 0.17);
    font-style: normal;
  }
  .threat-icon.watch {
    border-color: rgba(106, 173, 161, 0.28);
    color: #76aca4;
    background: rgba(35, 80, 75, 0.15);
  }
  .threat-row p {
    margin: 0;
    color: #8b9692;
    font-size: 0.56rem;
    line-height: 1.4;
  }
  .threat-row p span {
    display: block;
    margin-bottom: 0.15rem;
    color: #667875;
    font: 0.44rem/1 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .anomaly-brief {
    position: relative;
    overflow: hidden;
  }
  .anomaly-specimen {
    position: absolute;
    right: 0.8rem;
    top: 2.9rem;
    width: 3.6rem;
    height: 3.6rem;
    opacity: 0.5;
  }
  .anomaly-specimen i {
    position: absolute;
    inset: 10%;
    border: 1px solid #765a83;
    border-radius: 50% 45% 62% 35%;
    transform: rotate(24deg);
  }
  .anomaly-specimen i:nth-child(2) {
    inset: 22% 5% 8% 29%;
    transform: rotate(81deg);
  }
  .anomaly-specimen i:nth-child(3) {
    inset: 37%;
    border-radius: 50%;
    box-shadow: 0 0 14px #714d7c;
  }
  .anomaly-specimen b {
    position: absolute;
    top: 47%;
    left: 47%;
    width: 0.35rem;
    height: 0.35rem;
    border-radius: 50%;
    background: #ad82bc;
  }
  .anomaly-brief p {
    max-width: 72%;
    margin: 0.8rem 0 0.55rem;
    color: #a498a8;
    font-size: 0.62rem;
    line-height: 1.5;
  }
  .anomaly-brief small {
    color: #665d68;
    font: 0.43rem/1.4 var(--font-mono);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .intercept-brief p {
    margin: 0.8rem 0;
    color: #8c918b;
    font: 0.57rem/1.55 var(--font-mono);
  }
  .intercept-brief p b {
    padding: 0 0.15rem;
    background: #090a0a;
    color: #090a0a;
    box-shadow: 0 0 0 1px #1e2020;
  }
  .intercept-brief footer {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding-top: 0.55rem;
    border-top: 1px dashed rgba(189, 104, 92, 0.24);
    color: #9b5e56;
    font: 0.42rem/1 var(--font-mono);
    letter-spacing: 0.06em;
  }
  .intercept-brief footer em {
    color: #817161;
    font-style: normal;
  }

  .intel-panel {
    max-width: 1600px;
    margin: 0.75rem auto 0;
    display: grid;
    grid-template-columns: 1.35fr 1fr;
    gap: 0.75rem;
  }
  .perspective-panel,
  .legend-panel {
    min-width: 0;
    padding: 0.9rem 1rem;
    border: 1px solid rgba(98, 122, 132, 0.25);
    border-radius: 0.8rem;
    background: var(--surface);
  }
  .mode-pill {
    padding: 0.3rem 0.55rem;
    border: 1px solid rgba(98, 139, 132, 0.28);
    border-radius: 999px;
    color: #9bb4ae !important;
    background: rgba(25, 56, 52, 0.24);
    letter-spacing: 0.04em !important;
  }
  .position-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.7rem;
    margin-top: 0.7rem;
    padding-top: 0.65rem;
    border-top: 1px solid rgba(98, 122, 132, 0.16);
  }
  .position-legend span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: #7e8e8b;
    font-size: 0.6rem;
  }
  .position-legend i {
    width: 0.48rem;
    height: 0.48rem;
    border: 2px solid #091117;
    border-radius: 50%;
    background: var(--status-color);
    box-shadow:
      0 0 0 1px var(--status-color),
      0 0 7px color-mix(in srgb, var(--status-color) 45%, transparent);
  }
  .display-toggles {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.65rem;
  }
  .display-toggles button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.38rem 0.55rem;
    border: 1px solid #304149;
    border-radius: 0.45rem;
    color: #849492;
    background: #0b141b;
    font-size: 0.68rem;
    cursor: pointer;
  }
  .display-toggles button span {
    display: grid;
    width: 1rem;
    height: 1rem;
    place-items: center;
    border-radius: 0.2rem;
    background: #17242c;
    font-size: 0.62rem;
  }
  .display-toggles button.active {
    border-color: rgba(114, 195, 168, 0.42);
    color: #b6d3c9;
  }
  .display-toggles button.danger.active {
    border-color: rgba(201, 94, 84, 0.45);
    color: #e5a09a;
    background: rgba(76, 29, 27, 0.26);
  }
  :global(.perspective-panel .selector) {
    padding: 0;
    border: 0;
    background: transparent;
  }

  .timeline-shell {
    max-width: 1600px;
    margin: 0.75rem auto 0;
    padding: 1rem;
    border: 1px solid rgba(98, 122, 132, 0.25);
    border-radius: 0.85rem;
    background: var(--surface);
  }
  .timeline-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    margin-bottom: 0.8rem;
  }
  .timeline-header strong {
    display: block;
    margin-top: 0.2rem;
    color: #d8dfd9;
    font-size: 0.85rem;
    font-weight: 500;
  }
  .sequence-badge {
    color: #60716f;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
  }
  .sequence-badge strong {
    display: inline;
    color: var(--gold);
    font-family: ui-monospace, monospace;
  }
  .range-wrap {
    display: grid;
    grid-template-columns: 2rem 1fr 2rem;
    gap: 0.65rem;
    align-items: center;
    margin-bottom: 0.8rem;
    color: #60706f;
    font:
      0.62rem ui-monospace,
      monospace;
  }
  .range-wrap input {
    width: 100%;
    height: 2px;
    margin: 0;
    appearance: none;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--gold) var(--progress), #26343b var(--progress));
    cursor: pointer;
  }
  .range-wrap input::-webkit-slider-thumb {
    width: 0.8rem;
    height: 0.8rem;
    appearance: none;
    border: 3px solid #0d151c;
    border-radius: 50%;
    background: var(--gold-bright);
    box-shadow:
      0 0 0 1px var(--gold),
      0 0 12px rgba(215, 182, 93, 0.35);
  }
  .empty-state {
    color: #71817f;
    font-size: 0.75rem;
  }

  @media (max-width: 1100px) {
    .ship-hero {
      grid-template-columns: 1fr auto;
    }
    .hero-status {
      display: none;
    }
    .map-workspace {
      grid-template-columns: 225px minmax(0, 1fr);
    }
    .map-hint {
      display: none;
    }
    .intel-panel {
      grid-template-columns: 1fr;
    }
    .intelligence-strip {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 720px) {
    .ship-page {
      padding: 0.85rem;
    }
    .ship-hero {
      grid-template-columns: 1fr;
      gap: 0.85rem;
      align-items: start;
    }
    .hero-actions {
      flex-wrap: wrap;
    }
    .map-workspace {
      height: auto;
      min-height: 0;
      grid-template-columns: 1fr;
      overflow: visible;
    }
    .control-deck {
      padding: 0.85rem;
      overflow: hidden;
      border-right: 0;
      border-bottom: 1px solid rgba(99, 120, 128, 0.22);
    }
    .tier-nav {
      grid-template-columns: repeat(3, 1fr);
    }
    .tier-nav button {
      grid-template-columns: 1fr;
      gap: 0.15rem;
      padding: 0.55rem;
      text-align: center;
    }
    .tier-nav small,
    .tier-arrow {
      display: none;
    }
    .filter-section {
      margin-top: 0.8rem;
      padding-top: 0.75rem;
    }
    .map-stage {
      height: 460px;
    }
    .map-tools {
      display: none;
    }
    .deck-signal {
      display: none;
    }
    .scan-readout {
      bottom: 0.65rem;
      left: 0.65rem;
      min-width: 0;
    }
    .map-toolbar {
      padding: 0 0.75rem;
    }
    .intel-panel {
      grid-template-columns: 1fr;
    }
    .timeline-shell {
      padding: 0.8rem;
    }
    .intelligence-strip {
      grid-template-columns: 1fr;
    }
    .tier-brief {
      grid-template-columns: 2.5rem 1fr;
    }
    .density-gauge {
      grid-column: 1/-1;
      width: 100%;
      text-align: left;
    }
    .density-gauge strong {
      display: inline-block;
      margin-right: 0.5rem;
    }
  }
</style>
