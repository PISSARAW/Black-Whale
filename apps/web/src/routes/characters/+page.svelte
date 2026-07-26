<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let query = $state('');
  let activeFaction = $state('All');

  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const factionLabel = (value?: string | null) => value
    ? value.replace(/^prince-/, 'Faction ').replaceAll('-', ' ')
    : 'Independent';

  let factions: string[] = $derived(['All', ...Array.from(new Set<string>(data.characters.map((character: any) => factionLabel(character.factionId)))).sort()]);
  let filteredCharacters = $derived(data.characters.filter((character: any) => {
    const faction = factionLabel(character.factionId);
    const matchesFaction = activeFaction === 'All' || faction === activeFaction;
    const haystack = normalize(`${character.canonicalName} ${(character.aliases || []).join(' ')} ${character.description || ''} ${faction}`);
    return matchesFaction && haystack.includes(normalize(query.trim()));
  }));

  let charactersByFaction: Record<string, any[]> = $derived(filteredCharacters.reduce((acc: Record<string, any[]>, character: any) => {
    const faction = factionLabel(character.factionId);
    (acc[faction] ||= []).push(character);
    return acc;
  }, {}));
</script>

<svelte:head>
  <title>Passenger Registry — Black Whale</title>
  <meta name="description" content="Search the people, factions, and identities aboard the Black Whale." />
</svelte:head>

<div class="registry-page">
  <header class="registry-hero">
    <div>
      <p class="eyebrow">Manifest 02 · Identity records</p>
      <h1>Passenger<br />Registry</h1>
    </div>
    <div class="hero-note">
      <p>Every identity is a moving target. Browse confirmed passengers, aliases, affiliations, and first recorded appearances.</p>
      <dl><div><dt>Total records</dt><dd>{data.characters.length}</dd></div><div><dt>Visible</dt><dd>{filteredCharacters.length}</dd></div></dl>
    </div>
  </header>

  <section class="registry-controls" aria-label="Registry filters">
    <label class="search-field">
      <span aria-hidden="true">⌕</span>
      <span class="sr-only">Search passengers</span>
      <input bind:value={query} type="search" placeholder="Search by name, alias, or keyword…" />
      {#if query}<button type="button" onclick={() => (query = '')} aria-label="Clear search">×</button>{/if}
    </label>
    <div class="faction-filter" aria-label="Filter by affiliation">
      {#each factions as faction}
        <button type="button" class:active={activeFaction === faction} aria-pressed={activeFaction === faction} onclick={() => (activeFaction = faction)}>{faction}</button>
      {/each}
    </div>
  </section>

  {#if filteredCharacters.length}
    <div class="registry-groups" aria-live="polite">
      {#each Object.entries(charactersByFaction) as [faction, characters], groupIndex}
        <section class="faction-group reveal-on-scroll">
          <header class="faction-heading">
            <span>{String(groupIndex + 1).padStart(2, '0')}</span>
            <h2>{faction}</h2>
            <p>{characters.length} {characters.length === 1 ? 'record' : 'records'}</p>
          </header>

          <div class="character-grid">
            {#each characters as character, index (character.id)}
              <a href="/characters/{character.id}" class="character-card">
                <div class="portrait" aria-hidden="true">
                  <span>{character.canonicalName.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join('')}</span>
                  <i>{String(index + 1).padStart(2, '0')}</i>
                </div>
                <div class="card-copy">
                  <div class="card-status"><span class:canon={character.canonStatus === 'canon'}></span>{character.canonStatus === 'canon' ? 'Canonical' : 'Secondary'}</div>
                  <h3>{character.canonicalName}</h3>
                  {#if character.aliases?.length}<p class="aliases">AKA · {character.aliases.slice(0, 2).join(' / ')}</p>{/if}
                  <p class="description">{character.description || 'No public intelligence is currently available.'}</p>
                  <div class="card-footer"><span>{character.firstAppearanceChapterId?.replace('-', ' ') || 'Appearance unknown'}</span><i aria-hidden="true">↗</i></div>
                </div>
              </a>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {:else}
    <section class="empty-state" aria-live="polite">
      <span>NO MATCH</span><h2>The registry returned no identity.</h2><p>Change the affiliation or try a broader search.</p>
      <button type="button" onclick={() => { query = ''; activeFaction = 'All'; }}>Reset filters</button>
    </section>
  {/if}
</div>

<style>
  .registry-page { min-height: 100vh; padding: clamp(3rem,7vw,7rem) var(--page-gutter) 8rem; }
  .registry-hero { display: grid; max-width: var(--container-wide); margin: 0 auto 4rem; grid-template-columns: 1fr minmax(18rem,.55fr); align-items: end; gap: 3rem; }
  h1 { margin: .7rem 0 0; color: var(--text-primary); font-size: clamp(4.5rem,10vw,9rem); font-weight: 500; letter-spacing: -.065em; line-height: .72; text-transform: uppercase; }
  .hero-note { padding-left: 2rem; border-left: 1px solid var(--line-default); }.hero-note > p { margin: 0; color: var(--text-secondary); font-size: .9rem; line-height: 1.7; }
  dl { display: grid; grid-template-columns: repeat(2,1fr); margin: 2rem 0 0; gap: 1px; background: var(--line-subtle); } dl div { padding: .8rem; background: var(--surface-void); } dt { color: var(--text-faint); font: .5rem/1 var(--font-mono); letter-spacing: .1em; text-transform: uppercase; } dd { margin: .35rem 0 0; color: var(--accent-gold-bright); font: 500 1.5rem/1 var(--font-display); }
  .registry-controls { position: sticky; z-index: 20; top: calc(var(--header-height) + .6rem); display: grid; max-width: var(--container-wide); margin: 0 auto 4rem; grid-template-columns: minmax(18rem,.8fr) 1.4fr; align-items: center; gap: .8rem; padding: .65rem; border: 1px solid var(--line-default); border-radius: .8rem; background: rgba(8,14,18,.9); box-shadow: 0 18px 40px rgba(0,0,0,.24); backdrop-filter: blur(18px); }
  .search-field { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: .65rem; padding: .55rem .7rem; }.search-field > span:first-child { color: var(--accent-gold); font-size: 1.1rem; }.search-field input { min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text-primary); font-size: .78rem; }.search-field input::placeholder { color: var(--text-faint); }.search-field button { border: 0; background: none; color: var(--text-muted); cursor: pointer; }
  .faction-filter { display: flex; overflow-x: auto; gap: .35rem; scrollbar-width: none; }.faction-filter button { flex: none; padding: .5rem .65rem; border: 1px solid transparent; border-radius: .35rem; background: transparent; color: var(--text-muted); font: .52rem/1 var(--font-mono); letter-spacing: .07em; text-transform: uppercase; cursor: pointer; }.faction-filter button:hover { color: var(--text-primary); }.faction-filter button.active { border-color: var(--line-strong); background: rgba(200,169,86,.08); color: var(--accent-gold-bright); }
  .registry-groups { display: grid; max-width: var(--container-wide); margin: auto; gap: 6rem; }.faction-heading { display: grid; grid-template-columns: 3rem 1fr auto; align-items: baseline; gap: 1rem; margin-bottom: 1.2rem; padding-bottom: .8rem; border-bottom: 1px solid var(--line-default); }.faction-heading span,.faction-heading p { color: var(--text-faint); font: .53rem/1 var(--font-mono); letter-spacing: .1em; text-transform: uppercase; }.faction-heading h2 { margin: 0; color: var(--text-primary); font-size: 2rem; text-transform: capitalize; }.faction-heading p { margin: 0; }
  .character-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 1px; background: var(--line-subtle); border: 1px solid var(--line-subtle); }.character-card { display: grid; min-width: 0; grid-template-columns: 5rem 1fr; gap: 1rem; padding: 1rem; background: rgba(9,15,19,.96); color: inherit; text-decoration: none; transition: background .25s, transform .3s var(--ease-out); }.character-card:hover { position: relative; z-index: 2; background: var(--surface-raised); transform: translateY(-4px); box-shadow: 0 18px 45px rgba(0,0,0,.25); }
  .portrait { position: relative; display: grid; height: 7rem; place-items: center; overflow: hidden; border: 1px solid var(--line-default); background: radial-gradient(circle at 50% 28%,rgba(112,189,193,.14),transparent 42%),linear-gradient(145deg,#17262d,#0b1115); }.portrait::after { position: absolute; inset: 50% -20% auto; height: 1px; background: var(--line-subtle); content: ''; }.portrait > span { color: rgba(226,201,121,.72); font: 500 1.4rem/1 var(--font-display); letter-spacing: .05em; }.portrait i { position: absolute; right: .35rem; bottom: .35rem; color: var(--text-faint); font: normal .45rem/1 var(--font-mono); }
  .card-copy { min-width: 0; }.card-status { display: flex; align-items: center; gap: .35rem; color: var(--text-faint); font: .46rem/1 var(--font-mono); letter-spacing: .08em; text-transform: uppercase; }.card-status span { width: .35rem; height: .35rem; border-radius: 50%; background: var(--state-unknown); }.card-status span.canon { background: var(--state-known); box-shadow: 0 0 8px rgba(117,201,184,.35); }.card-copy h3 { margin: .65rem 0 .25rem; color: var(--text-primary); font-size: 1.45rem; line-height: 1; }.aliases { overflow: hidden; margin: 0; color: var(--accent-gold); font: .48rem/1.4 var(--font-mono); text-overflow: ellipsis; white-space: nowrap; }.description { display: -webkit-box; overflow: hidden; margin: .8rem 0 1rem; color: var(--text-muted); font-size: .7rem; line-height: 1.55; line-clamp: 3; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }.card-footer { display: flex; justify-content: space-between; padding-top: .7rem; border-top: 1px solid var(--line-subtle); color: var(--text-faint); font: .46rem/1 var(--font-mono); letter-spacing: .05em; text-transform: uppercase; }.card-footer i { color: var(--accent-gold); font-style: normal; transition: transform .2s; }.character-card:hover .card-footer i { transform: translate(2px,-2px); }
  .empty-state { max-width: var(--container-wide); margin: 0 auto; padding: 7rem 1rem; border: 1px dashed var(--line-default); text-align: center; }.empty-state > span { color: var(--accent-alert); font: .55rem/1 var(--font-mono); letter-spacing: .15em; }.empty-state h2 { margin: 1rem 0 .4rem; font-size: 2.2rem; }.empty-state p { color: var(--text-muted); }.empty-state button { margin-top: 1rem; padding: .65rem .9rem; border: 1px solid var(--line-strong); border-radius: .35rem; background: transparent; color: var(--accent-gold-bright); cursor: pointer; }
  @media(max-width:1050px){.character-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
  @media(max-width:760px){.registry-page{padding-inline:1rem}.registry-hero{grid-template-columns:1fr}.hero-note{padding-left:0;border-left:0}.registry-controls{top:calc(var(--header-height) + .35rem);grid-template-columns:1fr}.character-grid{grid-template-columns:1fr}.faction-heading{grid-template-columns:2rem 1fr auto}.character-card{grid-template-columns:4.5rem 1fr}}
</style>
