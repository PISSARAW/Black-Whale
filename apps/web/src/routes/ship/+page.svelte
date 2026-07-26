<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import MapContainer from '$lib/components/map/MapContainer.svelte';
  import LocationDetails from '$lib/components/map/LocationDetails.svelte';
  import UnknownPositions from '$lib/components/map/UnknownPositions.svelte';
  import { mapState } from '$lib/state/mapState.svelte';
  import PerspectiveSelector from '$lib/components/perspective/PerspectiveSelector.svelte';
  import PerspectiveTimeline from '$lib/components/perspective/PerspectiveTimeline.svelte';
  import WhyPanel from '$lib/components/perspective/WhyPanel.svelte';
  import ConsciousnessTransferTransition from '$lib/components/perspective/ConsciousnessTransferTransition.svelte';
  import type { FollowMode, PerspectiveContext, PerspectiveOption } from '$lib/components/perspective/types';
  import { toEnglishDisplayName } from '$lib/utils/displayNames';

  let { data }: { data: PageData } = $props();

  // Toolbar & Factions setup
  const factions = [
    { id: 'princes', label: 'Princes' },
    { id: 'guards', label: 'Guards' },
    { id: 'hunters', label: 'Hunters' },
    { id: 'spider', label: 'Phantom Troupe' },
    { id: 'mafia', label: 'Mafia' }
  ];

  const followLabel: Record<FollowMode, string> = {
    consciousness: 'follow consciousness',
    body: 'follow body',
    appearance: 'follow public appearance'
  };

  let perspectiveOptions = $derived.by(() => {
    const fromCharacters: PerspectiveOption[] = (data.worldState?.characters || []).map((char: any) => ({
      id: char.id,
      label: toEnglishDisplayName(char.canonicalName),
      kind: 'character'
    }));

    return [{ id: 'reader', label: 'Reader view', kind: 'reader' as const }, ...fromCharacters];
  });

  let currentEvt = $derived(data.events.find((event: any) => event.id === data.selectedEventId) || data.events[data.events.length - 1]);

  let selectedPerspective = $derived(
    perspectiveOptions.find((opt) => opt.id === mapState.selectedPerspectiveId) || perspectiveOptions[0]
  );

  let contextState = $derived.by((): PerspectiveContext => {
    const perspectiveName = selectedPerspective?.label || 'Reader view';
    const observer = data.perspective?.observer;
    const observerCharacter = data.worldState?.characters?.find((char: any) => char.id === observer?.characterId);
    const occupiedBody = data.worldState?.bodies?.find((body: any) => body.id === observer?.currentBodyId);
    const anomaly = Boolean(observer?.isDissonant);

    const canonicalPerspective = observerCharacter?.canonicalName || perspectiveName;
    const occupiedBodyLabel = occupiedBody?.label || occupiedBody?.id || canonicalPerspective;

    return {
      chapter: currentEvt?.chapter?.number || 0,
      eventLabel: `${currentEvt?.sequence ?? 0}`,
      spoilerLimit: data.spoilerLimit ?? null,
      perspectiveName: canonicalPerspective,
      followedConsciousness: canonicalPerspective,
      occupiedBody: occupiedBodyLabel,
      apparentIdentity: data.worldState?.characters?.find((char: any) => char.id === observer?.apparentCharacterId)?.canonicalName || occupiedBodyLabel,
      followMode: mapState.followMode,
      hasAnomaly: anomaly
    };
  });

  let timelinePoints = $derived.by(() => {
    const baseSequence = data.selectedEventIndex || 0;

    return {
      reality: [
        { id: 'r0', label: 'Canonical event', index: baseSequence - 2 },
        { id: 'r1', label: currentEvt?.title || 'Current state', index: baseSequence }
      ],
      body: [
        { id: 'b0', label: 'Body movement', index: baseSequence - 1 },
        { id: 'b1', label: 'Biological state', index: baseSequence }
      ],
      consciousness: [
        { id: 'c0', label: 'Mental anchor', index: baseSequence - 1 },
        { id: 'c1', label: 'Transfer', index: baseSequence, emphasis: contextState.hasAnomaly }
      ],
      knowledge: [
        { id: 'k0', label: 'Information received', index: baseSequence - 2 },
        { id: 'k1', label: 'Perspective update', index: baseSequence, detail: selectedPerspective?.kind === 'reader' ? 'Spoiler-filtered canon' : 'Subjective point of view' }
      ]
    };
  });

  let currentDeckLabel = $derived(
    mapState.currentZoomLevel === 'OVERVIEW'
      ? 'Overview'
      : mapState.currentZoomLevel === 'LOCAL'
        ? (mapState.selectedLocationId || 'Local area').replaceAll('-', ' ')
        : `Tier ${mapState.selectedTier?.replace('tier-', '') || ''}`
  );

  let eventProgress = $derived.by(() => {
    if (data.events.length < 2) return 100;
    return Math.max(0, Math.min(100, (data.selectedEventIndex / (data.events.length - 1)) * 100));
  });

  const deckClearance: Record<string, string> = {
    overview: 'Global scan',
    'tier-1': 'Royal clearance',
    'tier-2': 'VIP clearance',
    'tier-3': 'Public access',
    'tier-4': 'Crew clearance',
    'tier-5': 'Restricted systems'
  };

  let mappedZoneCount = $derived.by(() => {
    const locations = data.worldState?.locations || [];
    if (!mapState.selectedTier) return locations.length;
    return locations.filter((location: any) => location.slug === mapState.selectedTier || location.slug?.startsWith(`${mapState.selectedTier}-`)).length;
  });

  let trackedPresenceCount = $derived(data.worldState?.presences?.length || 0);
  let activeClearance = $derived(deckClearance[mapState.selectedTier || 'overview']);

  $effect(() => {
    mapState.setFollowMode((data.followMode as FollowMode) || 'consciousness');

    const selectedByUrl = perspectiveOptions.find((option) => option.id === data.selectedPerspectiveId);
    if (selectedByUrl) {
      mapState.setPerspective(selectedByUrl.id, selectedByUrl.label, selectedByUrl.kind);
    }

    if (!selectedPerspective) {
      return;
    }

    mapState.setPerspective(selectedPerspective.id, selectedPerspective.label, selectedPerspective.kind);
  });

  // Timeline slider change
  function handleTimelineChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const eventIndex = parseInt(input.value);
    const selectedEvent = data.events[eventIndex];
    if (!selectedEvent) return;

    const url = new URL($page.url);
    url.searchParams.set('eventId', selectedEvent.id);
    url.searchParams.delete('sequence');
    goto(url.toString(), { keepFocus: true, replaceState: true });
  }

  function handlePerspectiveSelect(id: string) {
    const found = perspectiveOptions.find((option) => option.id === id);
    if (!found) return;

    mapState.setPerspective(found.id, found.label, found.kind);

    const url = new URL($page.url);
    url.searchParams.set('perspective', found.id);
    url.searchParams.set('follow', mapState.followMode);
    goto(url.toString(), { keepFocus: true });
  }

  function handleFollowModeSelect(mode: FollowMode) {
    mapState.setFollowMode(mode);

    const url = new URL($page.url);
    url.searchParams.set('perspective', mapState.selectedPerspectiveId);
    url.searchParams.set('follow', mode);
    goto(url.toString(), { keepFocus: true, replaceState: true });
  }
</script>

<svelte:head>
  <title>Black Whale Map — Hunter × Hunter</title>
  <meta name="description" content="Explore the Black Whale decks, known positions, and character perspectives." />
</svelte:head>

<div class="ship-page">
  <header class="ship-hero">
    <div class="hero-copy">
      <div class="eyebrow"><span></span> Dark Continent Expedition</div>
      <h1>Black Whale <em>01</em></h1>
      <p>Tactical mapping of decks, presences, and zones of influence.</p>
    </div>

    <div class="hero-status" aria-label="Map status">
      <div><span>Event</span><strong>Ch. {currentEvt?.chapter?.number ?? '—'} · Ev. {currentEvt?.sequence ?? '—'}</strong></div>
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

  <section class="map-workspace">
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

        {#each [1, 2, 3, 4, 5] as tierNum}
          <button
            class:active={mapState.selectedTier === `tier-${tierNum}`}
            aria-current={mapState.selectedTier === `tier-${tierNum}` ? 'page' : undefined}
            onclick={() => mapState.selectTier(`tier-${tierNum}`)}
          >
            <span class="tier-number">0{tierNum}</span>
            <span><strong>Tier {tierNum}</strong><small>{['Royalty & VVIP', 'VIP & amenities', 'Public & medical', 'Crew & cargo', 'Machinery & storage'][tierNum - 1]}</small></span>
            <span class="tier-arrow">→</span>
          </button>
        {/each}
      </nav>

      <div class="filter-section">
        <div class="section-label"><span>Factions</span><small>{mapState.filters.factions.length} active</small></div>
        <div class="filter-grid">
          {#each factions as faction}
            <label class:active={mapState.filters.factions.includes(faction.id)}>
              <input
                type="checkbox"
                checked={mapState.filters.factions.includes(faction.id)}
                onchange={() => mapState.toggleFactionFilter(faction.id)}
              />
              <span></span>{faction.label}
            </label>
          {/each}
        </div>
        {#if mapState.filters.factions.length}
          <button class="clear-filters" type="button" onclick={() => (mapState.filters.factions = [])}>Clear faction filters</button>
        {/if}
      </div>

      <div class="deck-signal" aria-label="Current map intelligence">
        <span>Current signal</span>
        <dl>
          <div><dt>Tracked</dt><dd>{trackedPresenceCount}</dd></div>
          <div><dt>Zones</dt><dd>{mappedZoneCount}</dd></div>
        </dl>
        <p><i></i>{activeClearance}</p>
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
            <select aria-label="Quickly track a perspective" value={mapState.selectedPerspectiveId} onchange={(event) => handlePerspectiveSelect(event.currentTarget.value)}>
              {#each perspectiveOptions as option}<option value={option.id}>{option.label}</option>{/each}
            </select>
          </label>
          <span class="live-indicator"><i></i> Live data synchronized</span>
          <span class="map-hint">Drag to navigate · Scroll to zoom</span>
        </div>
      </header>

      <div class="map-canvas" role="region" aria-label="Interactive Black Whale map">
        <MapContainer />
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

  <section class="intel-panel">
    <div class="perspective-panel">
      <div class="panel-heading compact">
        <div><span>Point of view</span><h2>Observation filter</h2></div>
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
      <div class="panel-heading compact"><div><span>Map legend</span><h2>Temporal certainty</h2></div></div>
      <div class="position-legend" aria-label="Colors by temporal certainty">
        {#each [
          { label: 'Current event', color: '#55d1e2' },
          { label: 'Confirmed period', color: '#ad8bea' },
          { label: 'Current chapter', color: '#6ac890' },
          { label: 'Confirmed', color: '#5bb9ad' },
          { label: 'Assumed', color: '#f0b75e' },
          { label: 'Last known position', color: '#e47f61' },
          { label: 'Unknown', color: '#8a9798' }
        ] as status}
          <span style={`--status-color: ${status.color}`}><i></i>{status.label}</span>
        {/each}
      </div>
      <div class="display-toggles">
        <button class:active={mapState.filters.showUnknownPositions} onclick={() => mapState.filters.showUnknownPositions = !mapState.filters.showUnknownPositions}>
          <span>{mapState.filters.showUnknownPositions ? '✓' : '+'}</span> Unknown positions
        </button>
        <button class="danger" class:active={mapState.filters.spoilersEnabled} onclick={() => mapState.filters.spoilersEnabled = !mapState.filters.spoilersEnabled}>
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
      <div class="sequence-badge">CH <strong>{currentEvt?.chapter?.number ?? '—'}</strong> · EV <strong>{currentEvt?.sequence ?? '—'}</strong></div>
    </div>

    {#if data.events.length > 0}
      <div class="range-wrap" style={`--progress: ${eventProgress}%`}>
        <span>Ch.{data.events[0].chapter.number}</span>
        <input aria-label="Timeline event" type="range" min="0" max={data.events.length - 1} value={data.selectedEventIndex} oninput={handleTimelineChange} />
        <span>Ch.{data.events[data.events.length - 1].chapter.number}</span>
      </div>
    {:else}
      <p class="empty-state">No events available.</p>
    {/if}

    <PerspectiveTimeline reality={timelinePoints.reality} body={timelinePoints.body} consciousness={timelinePoints.consciousness} knowledge={timelinePoints.knowledge} currentIndex={data.selectedEventIndex || 0} />
  </footer>
</div>

<style>
  :global(body) { overflow-x: hidden; }
  button, a { -webkit-tap-highlight-color: transparent; }

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

  .ship-hero { max-width: 1600px; margin: 0 auto 1.25rem; display: grid; grid-template-columns: minmax(18rem, 1fr) auto auto; gap: 2rem; align-items: end; }
  .eyebrow { display: flex; align-items: center; gap: .55rem; margin-bottom: .35rem; color: #8fa39e; font-size: .68rem; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
  .eyebrow span { width: 1.6rem; height: 1px; background: var(--gold); }
  .hero-copy h1 { margin: 0; font-size: clamp(2rem, 3.3vw, 3.35rem); line-height: .95; font-weight: 500; letter-spacing: -.035em; text-transform: uppercase; }
  .hero-copy h1 em { color: var(--gold); font-size: .42em; font-style: normal; vertical-align: top; letter-spacing: .08em; }
  .hero-copy p { margin: .55rem 0 0; color: #82908f; font-size: .85rem; }
  .hero-status { display: flex; border: 1px solid rgba(116, 139, 148, .22); border-radius: .7rem; background: rgba(11, 18, 25, .55); }
  .hero-status > div { min-width: 7rem; padding: .65rem .9rem; border-right: 1px solid rgba(116, 139, 148, .16); }
  .hero-status > div:last-child { border: 0; min-width: 9rem; }
  .hero-status span, .panel-heading span, .timeline-header span { display: block; color: #70817f; font-size: .6rem; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }
  .hero-status strong { display: block; max-width: 12rem; margin-top: .25rem; overflow: hidden; color: #dce4dc; font-size: .76rem; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  .hero-actions { display: flex; align-items: center; gap: .5rem; }
  .hero-actions button, .hero-actions a { display: inline-flex; align-items: center; gap: .45rem; min-height: 2.4rem; padding: 0 .8rem; border: 1px solid #33434b; border-radius: .55rem; color: #cad3ce; background: rgba(16, 25, 33, .8); font-size: .72rem; text-decoration: none; cursor: pointer; transition: .2s ease; }
  .hero-actions button:hover, .hero-actions a:hover, .hero-actions button.active { border-color: #907a40; color: var(--gold-bright); background: rgba(48, 42, 25, .45); }
  .action-icon { color: var(--gold); font-size: 1rem; }

  .map-workspace { max-width: 1600px; height: min(66vh, 690px); min-height: 520px; margin: 0 auto; display: grid; grid-template-columns: 270px minmax(0, 1fr); overflow: hidden; border: 1px solid rgba(98, 122, 132, .28); border-radius: 1rem; background: #080d12; box-shadow: 0 24px 60px rgba(0,0,0,.28); }
  .control-deck { position: relative; z-index: 2; padding: 1.2rem; overflow-y: auto; border-right: 1px solid rgba(99, 120, 128, .22); background: linear-gradient(180deg, rgba(17, 28, 37, .98), rgba(10, 17, 24, .98)); }
  .panel-heading { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-bottom: 1rem; }
  .panel-heading h2 { margin: .15rem 0 0; color: #e3e8e1; font-size: 1rem; font-weight: 500; letter-spacing: .01em; }
  .panel-heading.compact { margin-bottom: .7rem; }
  .deck-count { color: rgba(215,182,93,.35) !important; font: 500 2.4rem/1 'IBM Plex Sans Condensed', sans-serif !important; letter-spacing: -.05em !important; }
  .tier-nav { display: grid; gap: .35rem; }
  .tier-nav button { width: 100%; display: grid; grid-template-columns: 1.65rem 1fr auto; gap: .7rem; align-items: center; padding: .65rem .7rem; border: 1px solid transparent; border-radius: .55rem; color: #899795; background: transparent; text-align: left; cursor: pointer; transition: .18s ease; }
  .tier-nav button:hover { color: #e4e8df; background: rgba(255,255,255,.025); }
  .tier-nav button.active { border-color: rgba(215,182,93,.34); color: var(--gold-bright); background: linear-gradient(90deg, rgba(126,102,43,.23), rgba(126,102,43,.04)); box-shadow: inset 2px 0 var(--gold); }
  .tier-number { color: #586a6b; font-size: .66rem; font-weight: 700; letter-spacing: .06em; }
  .tier-nav button.active .tier-number { color: var(--gold); }
  .tier-nav strong, .tier-nav small { display: block; }
  .tier-nav strong { font-size: .78rem; font-weight: 600; }
  .tier-nav small { margin-top: .08rem; color: #617170; font-size: .6rem; }
  .tier-arrow { opacity: .35; font-size: .75rem; }
  .filter-section { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgba(106, 126, 133, .16); }
  .section-label { display: flex; justify-content: space-between; margin-bottom: .65rem; }
  .section-label span { color: #82918f; font-size: .65rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  .section-label small { color: #536260; font-size: .62rem; }
  .filter-grid { display: flex; flex-wrap: wrap; gap: .4rem; }
  .filter-grid label { display: inline-flex; align-items: center; gap: .35rem; padding: .34rem .5rem; border: 1px solid #2a3a42; border-radius: 999px; color: #7f8c8a; background: #0c151c; font-size: .65rem; cursor: pointer; transition: .18s ease; }
  .filter-grid label.active { border-color: rgba(215,182,93,.45); color: #eadcae; background: rgba(91,74,31,.24); }
  .filter-grid input { position: absolute; opacity: 0; pointer-events: none; }
  .filter-grid label > span { width: .38rem; height: .38rem; border: 1px solid currentColor; border-radius: 50%; }
  .filter-grid label.active > span { background: var(--gold); box-shadow: 0 0 8px rgba(215,182,93,.55); }
  .clear-filters { margin-top: .65rem; padding: 0; border: 0; border-bottom: 1px solid #495957; background: transparent; color: #788886; font-size: .58rem; cursor: pointer; }
  .clear-filters:hover { color: var(--gold-bright); border-color: var(--gold); }
  .deck-signal { margin-top: 1.2rem; padding-top: 1rem; border-top: 1px solid rgba(106,126,133,.16); }
  .deck-signal > span { color: #70817f; font-size: .56rem; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }
  .deck-signal dl { display: grid; grid-template-columns: repeat(2,1fr); margin: .7rem 0; gap: 1px; background: rgba(106,126,133,.15); }
  .deck-signal dl div { padding: .6rem; background: #0c151c; }.deck-signal dt { color: #617170; font-size: .5rem; text-transform: uppercase; }.deck-signal dd { margin: .2rem 0 0; color: #dde3dc; font: 500 1.15rem/1 var(--font-display); }
  .deck-signal p { display: flex; align-items: center; gap: .4rem; margin: 0; color: #7e918d; font-size: .58rem; }.deck-signal p i { width: .4rem; height: .4rem; border-radius: 50%; background: #72c3a8; box-shadow: 0 0 8px rgba(114,195,168,.55); }

  .map-stage { min-width: 0; display: grid; grid-template-rows: 3rem minmax(0,1fr); background: #060a0e; }
  .map-toolbar { position: relative; z-index: 3; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0 1rem; border-bottom: 1px solid rgba(97,120,128,.2); background: rgba(11,18,24,.94); }
  .map-breadcrumb { display: flex; align-items: center; gap: .45rem; font-size: .68rem; }
  .map-breadcrumb span { color: #586967; }
  .map-breadcrumb i { color: #354543; font-style: normal; }
  .map-breadcrumb strong { color: #cbd4ce; font-weight: 500; }
  .map-tools { display: flex; align-items: center; gap: 1rem; color: #5f706f; font-size: .6rem; }
  .quick-track { display: flex; align-items: center; gap: .45rem; padding-right: 1rem; border-right: 1px solid rgba(97,120,128,.2); color: #657775; }
  .quick-track > span { font-size: .52rem; letter-spacing: .1em; text-transform: uppercase; }
  .quick-track select { max-width: 10rem; border: 0; outline: 0; background: transparent; color: #bcc8c2; font-size: .62rem; cursor: pointer; }
  .live-indicator { color: #88a49c; }
  .live-indicator i { display: inline-block; width: .38rem; height: .38rem; margin-right: .35rem; border-radius: 50%; background: #72c3a8; box-shadow: 0 0 8px rgba(114,195,168,.6); }
  .map-canvas { position: relative; min-height: 0; overflow: hidden; }
  .map-coordinate { position: absolute; z-index: 2; top: 1rem; left: 1rem; display: grid; width: 2rem; height: 2rem; place-items: center; border: 1px solid rgba(215,182,93,.25); border-radius: 50%; color: var(--gold); background: rgba(9,15,20,.72); font: 600 .67rem/1 'IBM Plex Sans Condensed', sans-serif; pointer-events: none; }
  .map-coordinate::after { content: ''; position: absolute; top: -.32rem; border: .2rem solid transparent; border-bottom-color: var(--gold); }
  .map-scale { position: absolute; z-index: 2; right: 1rem; bottom: 1rem; color: #566765; font-size: .55rem; letter-spacing: .12em; pointer-events: none; }
  .map-scale span { display: inline-block; width: 2.5rem; height: .35rem; margin-right: .4rem; border: solid #667876; border-width: 0 1px 1px; }
  .scan-readout { position: absolute; z-index: 12; bottom: 1rem; left: 1rem; display: grid; min-width: 13rem; gap: .18rem; padding: .7rem .8rem; border: 1px solid rgba(95,122,128,.25); border-radius: .45rem; background: rgba(8,14,18,.82); box-shadow: 0 10px 30px rgba(0,0,0,.24); backdrop-filter: blur(10px); pointer-events: none; }
  .scan-readout > span { color: var(--gold); font: .48rem/1 var(--font-mono); letter-spacing: .14em; }.scan-readout strong { color: #dce4de; font-size: .75rem; font-weight: 600; }.scan-readout small { color: #647572; font-size: .52rem; }

  .intel-panel { max-width: 1600px; margin: .75rem auto 0; display: grid; grid-template-columns: 1.35fr 1fr; gap: .75rem; }
  .perspective-panel, .legend-panel { min-width: 0; padding: .9rem 1rem; border: 1px solid rgba(98,122,132,.25); border-radius: .8rem; background: var(--surface); }
  .mode-pill { padding: .3rem .55rem; border: 1px solid rgba(98,139,132,.28); border-radius: 999px; color: #9bb4ae !important; background: rgba(25,56,52,.24); letter-spacing: .04em !important; }
  .position-legend { display: flex; flex-wrap: wrap; gap: .35rem .7rem; margin-top: .7rem; padding-top: .65rem; border-top: 1px solid rgba(98,122,132,.16); }
  .position-legend span { display: inline-flex; align-items: center; gap: .35rem; color: #7e8e8b; font-size: .6rem; }
  .position-legend i { width: .48rem; height: .48rem; border: 2px solid #091117; border-radius: 50%; background: var(--status-color); box-shadow: 0 0 0 1px var(--status-color), 0 0 7px color-mix(in srgb, var(--status-color) 45%, transparent); }
  .display-toggles { display: flex; gap: .4rem; margin-top: .65rem; }
  .display-toggles button { display: inline-flex; align-items: center; gap: .4rem; padding: .38rem .55rem; border: 1px solid #304149; border-radius: .45rem; color: #849492; background: #0b141b; font-size: .68rem; cursor: pointer; }
  .display-toggles button span { display: grid; width: 1rem; height: 1rem; place-items: center; border-radius: .2rem; background: #17242c; font-size: .62rem; }
  .display-toggles button.active { border-color: rgba(114,195,168,.42); color: #b6d3c9; }
  .display-toggles button.danger.active { border-color: rgba(201,94,84,.45); color: #e5a09a; background: rgba(76,29,27,.26); }
  :global(.perspective-panel .selector) { padding: 0; border: 0; background: transparent; }

  .timeline-shell { max-width: 1600px; margin: .75rem auto 0; padding: 1rem; border: 1px solid rgba(98,122,132,.25); border-radius: .85rem; background: var(--surface); }
  .timeline-header { display: flex; align-items: end; justify-content: space-between; margin-bottom: .8rem; }
  .timeline-header strong { display: block; margin-top: .2rem; color: #d8dfd9; font-size: .85rem; font-weight: 500; }
  .sequence-badge { color: #60716f; font-size: .65rem; letter-spacing: .08em; }
  .sequence-badge strong { display: inline; color: var(--gold); font-family: ui-monospace, monospace; }
  .range-wrap { display: grid; grid-template-columns: 2rem 1fr 2rem; gap: .65rem; align-items: center; margin-bottom: .8rem; color: #60706f; font: .62rem ui-monospace, monospace; }
  .range-wrap input { width: 100%; height: 2px; margin: 0; appearance: none; border-radius: 2px; background: linear-gradient(90deg, var(--gold) var(--progress), #26343b var(--progress)); cursor: pointer; }
  .range-wrap input::-webkit-slider-thumb { width: .8rem; height: .8rem; appearance: none; border: 3px solid #0d151c; border-radius: 50%; background: var(--gold-bright); box-shadow: 0 0 0 1px var(--gold), 0 0 12px rgba(215,182,93,.35); }
  .empty-state { color: #71817f; font-size: .75rem; }

  @media (max-width: 1100px) {
    .ship-hero { grid-template-columns: 1fr auto; }
    .hero-status { display: none; }
    .map-workspace { grid-template-columns: 225px minmax(0,1fr); }
    .map-hint { display: none; }
    .intel-panel { grid-template-columns: 1fr; }
  }

  @media (max-width: 720px) {
    .ship-page { padding: .85rem; }
    .ship-hero { grid-template-columns: 1fr; gap: .85rem; align-items: start; }
    .hero-actions { flex-wrap: wrap; }
    .map-workspace { height: auto; min-height: 0; grid-template-columns: 1fr; overflow: visible; }
    .control-deck { padding: .85rem; overflow: hidden; border-right: 0; border-bottom: 1px solid rgba(99,120,128,.22); }
    .tier-nav { grid-template-columns: repeat(3, 1fr); }
    .tier-nav button { grid-template-columns: 1fr; gap: .15rem; padding: .55rem; text-align: center; }
    .tier-nav small, .tier-arrow { display: none; }
    .filter-section { margin-top: .8rem; padding-top: .75rem; }
    .map-stage { height: 460px; }
    .map-tools { display: none; }
    .deck-signal { display: none; }
    .scan-readout { bottom: .65rem; left: .65rem; min-width: 0; }
    .map-toolbar { padding: 0 .75rem; }
    .intel-panel { grid-template-columns: 1fr; }
    .timeline-shell { padding: .8rem; }
  }
</style>
